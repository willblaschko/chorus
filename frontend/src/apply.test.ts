import { describe, it, expect } from "vitest";
import { computeOps, planLanes } from "./apply.js";
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
    expect(op.summary).toBe("Media Room — add Rear L");
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
    expect(op.summary).toBe("Media Room — remove Sub");
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

  it("no ops -> no lanes", () => {
    expect(planLanes([])).toEqual([]);
  });
});
