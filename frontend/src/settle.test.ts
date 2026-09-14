import { describe, it, expect } from "vitest";
import {
  bondSignature,
  fullSignature,
  namesResolved,
  settled,
  expectedSettleMs,
  settleView,
  bondsSignature,
} from "./settle.js";
import { buildRooms } from "./model.js";
import { roomsToLayout } from "./layout.js";
import type { LayoutMap, Placement, Role } from "./apply.js";
import type { BondGraph, BondMember, BondUnit } from "./types.js";

const ARC = "RINCON_ARC";
const SAT = "RINCON_SAT";
const B1 = "RINCON_BK1";

const mem = (
  uid: string,
  channel: string | null,
  name: string,
  model: string,
  is_primary = false,
  invisible = false
): BondMember => ({ uid, channel, ip: "10.0.0.1", name, model, invisible, is_primary });

// A home theater with one rear satellite whose NAME we vary (empty while it settles).
const htGraph = (satName: string): BondGraph => ({
  units: [
    {
      primary_uid: ARC,
      name: "Media Room",
      kind: "home_theater",
      members: [
        mem(ARC, "CC", "Media Room", "Sonos Arc", true, false),
        mem(SAT, "LR", satName, "Symfonisk Bookshelf", false, true),
      ],
    },
  ],
  players: [],
});

// Topology signature the editor's convergence compares against.
const topo = (g: BondGraph) => bondSignature(roomsToLayout(buildRooms(g)));

describe("fullSignature / namesResolved", () => {
  it("fullSignature changes when a name resolves", () => {
    expect(fullSignature(htGraph(""))).not.toBe(fullSignature(htGraph("Media Room")));
  });

  it("fullSignature changes when membership changes (a removed speaker reappears)", () => {
    const withBk: BondGraph = {
      units: [
        ...htGraph("Media Room").units,
        { primary_uid: B1, name: "TV Left", kind: "standalone", members: [mem(B1, null, "TV Left", "Symfonisk Bookshelf", true, false)] } as BondUnit,
      ],
      players: [],
    };
    expect(fullSignature(withBk)).not.toBe(fullSignature(htGraph("Media Room")));
  });

  it("namesResolved is false while a bonded satellite name is blank or a raw UID", () => {
    expect(namesResolved(htGraph(""))).toBe(false);
    expect(namesResolved(htGraph(SAT))).toBe(false); // name === its own RINCON uid
    expect(namesResolved(htGraph("Media Room"))).toBe(true);
  });

  it("bondSignature ignores names (only role + anchor)", () => {
    expect(topo(htGraph(""))).toBe(topo(htGraph("Media Room")));
  });
});

describe("settled — the add-only name plateau (the real bug)", () => {
  const intended = topo(htGraph("Media Room")); // fronts/rears bonded; names irrelevant to topology

  it("does NOT settle on a STABLE plateau where the name is still blank", () => {
    const plateau = htGraph(""); // satellite bonded, name not resolved yet
    const prevFull = fullSignature(plateau); // identical to this poll -> "stable"
    // Topology already matches and the graph is stable — a stability-only check would
    // wrongly declare done here. namesResolved must veto it.
    expect(topo(plateau)).toBe(intended);
    expect(fullSignature(plateau)).toBe(prevFull);
    expect(settled(intended, topo(plateau), plateau, prevFull)).toBe(false);
  });

  it("does not settle on the first poll (nothing to compare)", () => {
    const done = htGraph("Media Room");
    expect(settled(intended, topo(done), done, undefined)).toBe(false);
  });

  it("does not settle on the poll where the name just changed (not yet stable)", () => {
    const done = htGraph("Media Room");
    const prevFull = fullSignature(htGraph("")); // previous poll still had a blank name
    expect(settled(intended, topo(done), done, prevFull)).toBe(false);
  });

  it("settles once topology matches, names are resolved, AND the graph is stable", () => {
    const done = htGraph("Media Room");
    const prevFull = fullSignature(done); // previous poll identical -> stable
    expect(settled(intended, topo(done), done, prevFull)).toBe(true);
  });

  it("does not settle if the topology hasn't reached intent yet", () => {
    const wrong = htGraph("Media Room");
    const otherIntent = topo({
      units: [
        {
          primary_uid: ARC,
          name: "Media Room",
          kind: "home_theater",
          members: [
            mem(ARC, "CC", "Media Room", "Sonos Arc", true, false),
            mem(SAT, "RR", "Media Room", "Symfonisk Bookshelf", false, true), // RR, not LR
          ],
        },
      ],
      players: [],
    });
    expect(settled(otherIntent, topo(wrong), wrong, fullSignature(wrong))).toBe(false);
  });
});

describe("expectedSettleMs — budget must cover the measured worst case", () => {
  it("a pure add is quick — no speaker rediscovery to wait on", () => {
    expect(expectedSettleMs(["add_ht"])).toBeLessThan(20000);
  });

  it("a 2x2 front swap covers the measured worst-case settle (>54s)", () => {
    // Measured max clean swap settle across 8 real swaps was ~54s.
    expect(expectedSettleMs(["remove_ht", "remove_ht", "add_ht", "add_ht"])).toBeGreaterThan(54000);
  });

  it("one removal costs more than several adds — rediscovery dominates", () => {
    expect(expectedSettleMs(["remove_ht"])).toBeGreaterThan(
      expectedSettleMs(["add_ht", "add_ht", "add_ht"])
    );
  });

  it("separate (unpair) also triggers the rediscovery cost", () => {
    expect(expectedSettleMs(["separate"])).toBeGreaterThan(expectedSettleMs(["add_ht"]));
  });
});

describe("settleView — live, human-readable settle progress", () => {
  const P = (role: Role, name: string, anchorUid = "X"): Placement => ({
    room: "Media Room",
    role,
    anchorUid,
    name,
  });
  // Intent: Arc HT with the LF bookshelf bonded, and the RF bookshelf released to standalone.
  const intended: LayoutMap = {
    ARC: P("CC", "Media Room", "ARC"),
    BK1: P("LF", "Media Room", "ARC"),
    BK2: P("solo", "TV Right", "BK2"),
  };

  it("says 'reconfiguring' while the bonds themselves aren't in place yet", () => {
    const fresh: LayoutMap = {
      ARC: P("CC", "Media Room", "ARC"),
      BK1: P("solo", "TV Left", "BK1"), // not bonded to LF yet
      BK2: P("solo", "TV Right", "BK2"),
    };
    const v = settleView(intended, fresh, ["BK2"]);
    expect(v.label).toMatch(/Reconfiguring/);
    expect(v.ratio).toBeLessThan(0.2);
  });

  it("names the released speaker still waiting to reconnect", () => {
    // Bonds correct (BK1 on LF) but BK2 hasn't reappeared as a standalone yet.
    const fresh: LayoutMap = { ARC: P("CC", "Media Room", "ARC"), BK1: P("LF", "Media Room", "ARC") };
    const v = settleView(intended, fresh, ["BK2"]);
    expect(v.label).toContain("TV Right");
    expect(v.label).toContain("0 of 1");
  });

  it("ratio climbs as released speakers come back", () => {
    const waiting: LayoutMap = { ARC: P("CC", "Media Room", "ARC"), BK1: P("LF", "Media Room", "ARC") };
    const back: LayoutMap = { ...waiting, BK2: P("solo", "TV Right", "BK2") };
    expect(settleView(intended, back, ["BK2"]).ratio).toBeGreaterThan(
      settleView(intended, waiting, ["BK2"]).ratio
    );
  });

  it("reaches 'finishing up' once bonds are correct and every released speaker is back", () => {
    const fresh: LayoutMap = {
      ARC: P("CC", "Media Room", "ARC"),
      BK1: P("LF", "Media Room", "ARC"),
      BK2: P("solo", "TV Right", "BK2"),
    };
    const v = settleView(intended, fresh, ["BK2"]);
    expect(v.label).toMatch(/Finishing up/);
    expect(v.ratio).toBeGreaterThan(0.9);
  });

  it("a pure add (nothing released) goes straight to finishing once bonded", () => {
    const fresh: LayoutMap = {
      ARC: P("CC", "Media Room", "ARC"),
      BK1: P("LF", "Media Room", "ARC"),
      BK2: P("solo", "TV Right", "BK2"),
    };
    expect(settleView(intended, fresh, []).label).toMatch(/Finishing up/);
  });

  it("bondsSignature ignores standalones (only the bonds matter)", () => {
    const a: LayoutMap = { ARC: P("CC", "Media Room", "ARC"), BK1: P("LF", "Media Room", "ARC"), X: P("solo", "Kitchen", "X") };
    const b: LayoutMap = { ARC: P("CC", "Media Room", "ARC"), BK1: P("LF", "Media Room", "ARC") };
    expect(bondsSignature(a)).toBe(bondsSignature(b));
  });
});
