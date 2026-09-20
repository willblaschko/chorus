import { describe, it, expect } from "vitest";
import { computeOps, planLanes, withKeptNames } from "./apply.js";
import type { LayoutMap, Op, Placement } from "./apply.js";

// ── Synthetic fixtures ─────────────────────────────────────────────────────────
// Media Room Arc home theater: soundbar (CC) + four satellites + sub.
const ARC = "RINCON_ARC001";
const LF = "RINCON_FRONTL01";
const RF = "RINCON_FRONTR01";
const LR = "RINCON_REARL01";
const RR = "RINCON_REARR01";
const SW = "RINCON_SUBMINI01";

function sat(anchorUid: string, role: Placement["role"], name: string, room = "Media Room"): Placement {
  return { room, role, anchorUid, name };
}

// A full 5.1 Arc: soundbar + fronts + rears + sub.
function arcHomeTheater(): LayoutMap {
  return {
    [ARC]: { room: "Media Room", role: "CC", anchorUid: ARC, name: "Arc" },
    [LF]: sat(ARC, "LF", "Front L"),
    [RF]: sat(ARC, "RF", "Front R"),
    [LR]: sat(ARC, "LR", "Rear L"),
    [RR]: sat(ARC, "RR", "Rear R"),
    [SW]: sat(ARC, "SW", "Sub Mini"),
  };
}

function clone(m: LayoutMap): LayoutMap {
  return JSON.parse(JSON.stringify(m));
}

describe("computeOps — no change", () => {
  it("returns [] when applied === working", () => {
    const m = arcHomeTheater();
    expect(computeOps(m, clone(m))).toEqual([]);
  });
});

describe("computeOps — home theater satellites", () => {
  it("adding one HT satellite -> one add_ht with correct service data + touches", () => {
    // Applied: Arc + fronts only. Working: same, plus a Rear L satellite.
    const applied: LayoutMap = {
      [ARC]: { room: "Media Room", role: "CC", anchorUid: ARC, name: "Arc" },
      [LF]: sat(ARC, "LF", "Front L"),
      [RF]: sat(ARC, "RF", "Front R"),
    };
    const working = clone(applied);
    working[LR] = sat(ARC, "LR", "Media Room Rear L");

    const ops = computeOps(applied, working);
    expect(ops).toHaveLength(1);
    const op = ops[0];
    expect(op.type).toBe("add_ht");
    expect(op.service).toEqual({
      domain: "chorus",
      service: "set_home_theater",
      data: { soundbar: ARC, lr: LR },
    });
    expect(op.touches.sort()).toEqual([ARC, LR].sort());
    expect(op.summary).toBe("Media Room Rear L — add as Rear L in Media Room");
  });

  it("removing one satellite -> one remove_ht by channel", () => {
    const applied = arcHomeTheater();
    const working = clone(applied);
    delete working[SW]; // pull the Sub (SW channel) out of the home theater

    const ops = computeOps(applied, working);
    expect(ops).toHaveLength(1);
    const op = ops[0];
    expect(op.type).toBe("remove_ht");
    expect(op.service).toEqual({
      domain: "chorus",
      service: "remove_home_theater",
      data: { soundbar: ARC, channel: "SW" },
    });
    expect(op.touches.sort()).toEqual([ARC, SW].sort());
    expect(op.summary).toBe("Sub Mini — remove as Sub from Media Room");
  });

  it("re-channelling a satellite -> remove old + add new", () => {
    const applied: LayoutMap = {
      [ARC]: { room: "Media Room", role: "CC", anchorUid: ARC, name: "Arc" },
      [LR]: sat(ARC, "LR", "Sat"),
    };
    const working = clone(applied);
    working[LR].role = "RR"; // moved from Rear L to Rear R

    const ops = computeOps(applied, working);
    const types = ops.map((o) => o.type);
    expect(types).toContain("remove_ht");
    expect(types).toContain("add_ht");
    // unbond emitted before bond
    expect(types.indexOf("remove_ht")).toBeLessThan(types.indexOf("add_ht"));
  });
});

describe("computeOps — stereo pairs", () => {
  const L = "RINCON_PAIRL01";
  const R = "RINCON_PAIRR01";

  it("creating a stereo pair -> create_pair", () => {
    const applied: LayoutMap = {
      [L]: { room: "Office", role: "solo", anchorUid: L, name: "Office L" },
      [R]: { room: "Office 2", role: "solo", anchorUid: R, name: "Office R" },
    };
    const working: LayoutMap = {
      [L]: { room: "Office", role: "pairL", anchorUid: L, name: "Office L" },
      [R]: { room: "Office", role: "pairR", anchorUid: L, name: "Office R" },
    };
    const ops = computeOps(applied, working);
    const create = ops.filter((o) => o.type === "create_pair");
    expect(create).toHaveLength(1);
    expect(create[0].service).toEqual({
      domain: "chorus",
      service: "create_stereo_pair",
      data: { left: L, right: R },
    });
    expect(create[0].touches.sort()).toEqual([L, R].sort());
  });

  it("separating a pair -> separate", () => {
    const applied: LayoutMap = {
      [L]: { room: "Office", role: "pairL", anchorUid: L, name: "Office L" },
      [R]: { room: "Office", role: "pairR", anchorUid: L, name: "Office R" },
    };
    const working: LayoutMap = {
      [L]: { room: "Office", role: "solo", anchorUid: L, name: "Office L" },
      [R]: { room: "Office 2", role: "solo", anchorUid: R, name: "Office R" },
    };
    const ops = computeOps(applied, working);
    const sep = ops.filter((o) => o.type === "separate");
    expect(sep).toHaveLength(1);
    expect(sep[0].service).toEqual({
      domain: "chorus",
      service: "separate",
      data: { left: L, right: R },
    });
    expect(sep[0].touches.sort()).toEqual([L, R].sort());
  });
});

describe("computeOps — moves", () => {
  it("moving a speaker to another room -> move", () => {
    const uid = "RINCON_KITCHEN01";
    const applied: LayoutMap = {
      [uid]: { room: "Kitchen", role: "solo", anchorUid: uid, name: "Kitchen Speaker" },
    };
    const working = clone(applied);
    working[uid].room = "Office";
    working[uid].name = "Office"; // World B: a moved zone's name follows its room

    const ops = computeOps(applied, working);
    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe("move");
    // Rename the zone to its room-derived name + reassign the HA area.
    expect(ops[0].service).toEqual({
      domain: "chorus",
      service: "move",
      data: { speaker: uid, name: "Office", area: "Office" },
    });
    expect(ops[0].touches).toEqual([uid]);
    expect(ops[0].summary).toBe("Kitchen Speaker — move to Office");
  });

  it("a follow-room rename is keepable (not required) and carries the current name", () => {
    const UID = "RINCON_RN";
    const applied: LayoutMap = {
      [UID]: { room: "Office", role: "solo", anchorUid: UID, name: "Reading Nook", model: "One" },
    };
    const working = clone(applied);
    working[UID].name = "Office"; // World B wants it to follow the room
    const op = computeOps(applied, working).find((o) => o.type === "rename")!;
    expect(op.keep).toEqual({
      uid: UID,
      required: false,
      currentName: "Reading Nook",
      targetName: "Office",
      move: false,
    });
  });

  it("a collision-fix rename is required (can't be unchecked)", () => {
    const A = "RINCON_A";
    const B = "RINCON_B";
    const applied: LayoutMap = {
      [A]: { room: "Office", role: "solo", anchorUid: A, name: "Office", model: "One" },
      [B]: { room: "Office", role: "solo", anchorUid: B, name: "Office", model: "One" },
    };
    const working = clone(applied);
    working[B].name = "Office 2"; // de-dup B; keeping "Office" would clash with A
    const op = computeOps(applied, working).find((o) => o.type === "rename" && o.keep?.uid === B)!;
    expect(op.keep!.required).toBe(true);
  });

  it("withKeptNames drops the in-place rename for a kept uid", () => {
    const UID = "RINCON_K1";
    const base: LayoutMap = {
      [UID]: { room: "Office", role: "solo", anchorUid: UID, name: "Reading Nook", model: "One" },
    };
    const working = clone(base);
    working[UID].name = "Office"; // would rename
    const ops = computeOps(base, withKeptNames(base, working, [UID]));
    expect(ops.filter((o) => o.type === "rename")).toHaveLength(0);
  });

  it("withKeptNames keeps the name on a move but still moves the area", () => {
    const UID = "RINCON_K2";
    const base: LayoutMap = {
      [UID]: { room: "Office", role: "solo", anchorUid: UID, name: "Reading Nook", model: "One" },
    };
    const working = clone(base);
    working[UID] = { room: "Den", role: "solo", anchorUid: UID, name: "Den", model: "One" }; // moved + renamed
    const move = computeOps(base, withKeptNames(base, working, [UID])).find((o) => o.type === "move")!;
    expect(move.service.data).toMatchObject({ speaker: UID, name: "Reading Nook", area: "Den" });
  });

  it("never auto-renames an offline speaker (it can only fail)", () => {
    const UID = "RINCON_OFFLINE";
    const applied: LayoutMap = {
      [UID]: { room: "Guest Bedroom", role: "solo", anchorUid: UID, name: UID, model: "Table lamp", offline: true },
    };
    const working = clone(applied);
    working[UID].name = "Guest Bedroom"; // World B would rename it — but it's offline
    expect(computeOps(applied, working).filter((o) => o.type === "rename")).toHaveLength(0);
  });

  it("a summary never shows a raw RINCON uid — falls back to the model", () => {
    const UID = "RINCON_38420B972FDE01400"; // an unresolved (e.g. offline) speaker
    const applied: LayoutMap = {
      [UID]: { room: "Guest Bedroom", role: "solo", anchorUid: UID, name: UID, model: "Table lamp" },
    };
    const working = clone(applied);
    working[UID].name = "Guest Bedroom";
    const op = computeOps(applied, working).find((o) => o.type === "rename")!;
    expect(op.summary).toBe("Table lamp — rename to Guest Bedroom");
  });
});

describe("planLanes", () => {
  it("two changes on DIFFERENT soundbars -> two parallel lanes", () => {
    const BAR_A = "RINCON_BARA";
    const BAR_B = "RINCON_BARB";
    const applied: LayoutMap = {
      [BAR_A]: { room: "Media Room", role: "CC", anchorUid: BAR_A, name: "Arc" },
      [BAR_B]: { room: "Living Room", role: "CC", anchorUid: BAR_B, name: "Beam" },
    };
    const working = clone(applied);
    working["RINCON_SATA"] = sat(BAR_A, "LR", "Media Sat", "Media Room");
    working["RINCON_SATB"] = sat(BAR_B, "LR", "Living Sat", "Living Room");

    const ops = computeOps(applied, working);
    expect(ops).toHaveLength(2);
    const lanes = planLanes(ops);
    expect(lanes).toHaveLength(2);
    expect(lanes.every((l) => l.length === 1)).toBe(true);
  });

  it("two changes on the SAME soundbar -> one serial lane", () => {
    const BAR = "RINCON_BAR";
    const applied: LayoutMap = {
      [BAR]: { room: "Media Room", role: "CC", anchorUid: BAR, name: "Arc" },
    };
    const working = clone(applied);
    working["RINCON_S1"] = sat(BAR, "LR", "Sat 1");
    working["RINCON_S2"] = sat(BAR, "RR", "Sat 2");

    const ops = computeOps(applied, working);
    expect(ops).toHaveLength(2);
    const lanes = planLanes(ops);
    expect(lanes).toHaveLength(1);
    expect(lanes[0]).toHaveLength(2);
  });

  it("within a lane, separate+bind reuse orders separate before bind", () => {
    // Applied: L+R are a stereo pair. Working: pair separated, and L becomes a
    // rear satellite of a bar that shares L. Both ops touch L -> same lane.
    const BAR = "RINCON_BAR2";
    const L = "RINCON_L";
    const R = "RINCON_R";
    const applied: LayoutMap = {
      [BAR]: { room: "Media Room", role: "CC", anchorUid: BAR, name: "Arc" },
      [L]: { room: "Office", role: "pairL", anchorUid: L, name: "Spk L" },
      [R]: { room: "Office", role: "pairR", anchorUid: L, name: "Spk R" },
    };
    const working = clone(applied);
    working[L] = { room: "Media Room", role: "LR", anchorUid: BAR, name: "Spk L" };
    working[R] = { room: "Office", role: "solo", anchorUid: R, name: "Spk R" };

    const ops = computeOps(applied, working);
    const lanes = planLanes(ops);
    // BAR and L both link the separate op (touches L) with the add_ht op (touches L,BAR).
    const laneWithBoth = lanes.find(
      (l) => l.some((o) => o.type === "separate") && l.some((o) => o.type === "add_ht")
    ) as Op[];
    expect(laneWithBoth).toBeDefined();
    const sepIdx = laneWithBoth.findIndex((o) => o.type === "separate");
    const addIdx = laneWithBoth.findIndex((o) => o.type === "add_ht");
    expect(sepIdx).toBeLessThan(addIdx);
  });

  it("within a lane, a freed speaker's rename runs BEFORE the re-bonds", () => {
    // HT rearrange (one lane, shared soundbar): S1 is unbonded (keeps the set's inherited
    // name) and renamed to its de-duped name; S2 is added. The rename must land right after
    // the un-bond and BEFORE the re-bond, so S1 doesn't sit as a duplicate "Media Room"
    // through the whole operation.
    const BAR = "RINCON_BAR3";
    const S1 = "RINCON_S1X";
    const S2 = "RINCON_S2X";
    const applied: LayoutMap = {
      [BAR]: { room: "Media Room", role: "CC", anchorUid: BAR, name: "Media Room" },
      [S1]: { room: "Media Room", role: "LR", anchorUid: BAR, name: "Media Room" },
    };
    const working = clone(applied);
    working[S1] = { room: "Media Room", role: "solo", anchorUid: S1, name: "Media Room 2" };
    working[S2] = { room: "Media Room", role: "RR", anchorUid: BAR, name: "Media Room" };

    const lane = planLanes(computeOps(applied, working)).find((l) =>
      l.some((o) => o.type === "rename")
    ) as Op[];
    expect(lane).toBeDefined();
    const idx = (t: string) => lane.findIndex((o) => o.type === t);
    expect(idx("remove_ht")).toBeLessThan(idx("rename")); // freed first
    expect(idx("rename")).toBeLessThan(idx("add_ht")); // renamed BEFORE the re-bond
  });

  it("within a lane, MOVE runs before RENAME, and a moved speaker is never also renamed", () => {
    // Separate a pair: L moves to another room; R stays put and is renamed in place. The
    // separate links them into one lane. MOVE (which itself renames the zone) must precede
    // the in-place RENAME so the two can't race on the room's names.
    const L = "RINCON_PL";
    const R = "RINCON_PR";
    const applied: LayoutMap = {
      [L]: { room: "Office", role: "pairL", anchorUid: L, name: "Office" },
      [R]: { room: "Office", role: "pairR", anchorUid: L, name: "Office" },
    };
    const working = clone(applied);
    working[L] = { room: "Media Room", role: "solo", anchorUid: L, name: "Media Room 2" }; // moved
    working[R] = { room: "Office", role: "solo", anchorUid: R, name: "Office 2" }; // renamed in place

    const ops = computeOps(applied, working);
    // A moved speaker is NOT also emitted as a rename (mutual exclusion).
    const renameTargets = ops
      .filter((o) => o.type === "rename")
      .map((o) => (o.service.data as { speaker: string }).speaker);
    expect(renameTargets).toContain(R);
    expect(renameTargets).not.toContain(L);

    const lane = planLanes(ops).find(
      (l) => l.some((o) => o.type === "move") && l.some((o) => o.type === "rename")
    ) as Op[];
    expect(lane).toBeDefined();
    const idx = (t: string) => lane.findIndex((o) => o.type === t);
    expect(idx("separate")).toBeLessThan(idx("move"));
    expect(idx("move")).toBeLessThan(idx("rename"));
  });

  it("freeing two speakers emits two renames with DISTINCT de-duped names", () => {
    // Both satellites inherit the set's "Media Room" name. The plan must carry two
    // different target names (2 and 3) regardless of execution order — so "remove, remove,
    // rename, rename" can never leave two zones sharing a name. Names come from the working
    // model, not from replaying ops, so batch-per-phase is safe.
    const BAR = "RINCON_BARM";
    const A = "RINCON_AA";
    const B = "RINCON_BB";
    const applied: LayoutMap = {
      [BAR]: { room: "Media Room", role: "CC", anchorUid: BAR, name: "Media Room" },
      [A]: { room: "Media Room", role: "LR", anchorUid: BAR, name: "Media Room" },
      [B]: { room: "Media Room", role: "RR", anchorUid: BAR, name: "Media Room" },
    };
    const working = clone(applied);
    working[A] = { room: "Media Room", role: "solo", anchorUid: A, name: "Media Room 2" };
    working[B] = { room: "Media Room", role: "solo", anchorUid: B, name: "Media Room 3" };

    const names = computeOps(applied, working)
      .filter((o) => o.type === "rename")
      .map((o) => (o.service.data as { name: string }).name)
      .sort();
    expect(names).toEqual(["Media Room 2", "Media Room 3"]);
  });

  it("no ops -> no lanes", () => {
    expect(planLanes([])).toEqual([]);
  });
});
