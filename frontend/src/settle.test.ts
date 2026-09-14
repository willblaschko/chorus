import { describe, it, expect } from "vitest";
import { bondSignature, fullSignature, namesResolved, settled } from "./settle.js";
import { buildRooms } from "./model.js";
import { roomsToLayout } from "./layout.js";
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
