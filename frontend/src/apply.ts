// Pure scheduler: turn a diff of the staged Sonos layout into an ordered,
// parallelizable list of Home Assistant service calls.
//
// NO DOM, NO Lit, NO Home Assistant objects — just typed functions over plain
// data, so the whole thing is unit-testable. Ported from the ui-prototype's
// computeOps / planLanes (design/ui-prototype.html): every edit is staged
// locally against the last-applied state, and the pending work is simply the
// diff between the two layouts. Each op is tagged with the device UIDs it
// touches; a union-find over those touch-sets falls straight out as the apply
// plan (ops sharing a device serialise, disjoint ops run in parallel).

// A speaker's placement in the layout.
export type Role =
  | "CC"
  | "LF"
  | "RF"
  | "LR"
  | "RR"
  | "SW"
  | "pairL"
  | "pairR"
  | "pairSub" // a sub bonded to a stereo pair (ChannelMapSet SW,SW)
  | "solo";

export interface Placement {
  room: string; // the Sonos zone/room name it belongs to
  role: Role; // where it sits
  anchorUid: string; // the soundbar UID (for HT) or the pair's left UID (for pairs); self for solo
  height?: boolean; // Atmos height enabled (fronts/rears only)
  name: string; // speaker friendly name (for service calls that take names)
}

// speakerUid -> placement. One map for the last-applied state, one for the staged/working state.
export type LayoutMap = Record<string, Placement>;

export type OpType =
  | "separate"
  | "move"
  | "create_pair"
  | "add_ht"
  | "remove_ht"
  | "add_pair_sub"
  | "remove_pair_sub";

export interface Op {
  type: OpType;
  touches: string[]; // device UIDs this op reads/writes (for lane planning)
  service: { domain: "chorus"; service: string; data: Record<string, unknown> };
  summary: string; // plain-language, e.g. "Media Room — add Rear L"
}

// ── Channel vocabulary ────────────────────────────────────────────────────────
// The five bondable home-theater satellite channels (CC is the soundbar itself,
// which is the anchor — it never needs an add/remove op of its own).
const HT_SAT_ROLES: readonly Role[] = ["LF", "RF", "LR", "RR", "SW"];

// Plain-language channel labels for op summaries.
const CHANNEL_LABEL: Record<string, string> = {
  LF: "Front L",
  RF: "Front R",
  LR: "Rear L",
  RR: "Rear R",
  SW: "Sub",
  CC: "Center",
};

// set_home_theater service field per channel (one satellite per call — see SPIKE_FINDINGS).
const CHANNEL_FIELD: Record<string, string> = {
  LF: "lf",
  RF: "rf",
  LR: "lr",
  RR: "rr",
  SW: "sw",
};

// Phase within a lane: separate(0) -> move(1) -> create_pair/add_ht/remove_ht(2).
const PHASE: Record<OpType, number> = {
  separate: 0,
  remove_pair_sub: 0,
  move: 1,
  create_pair: 2,
  add_ht: 2,
  remove_ht: 2,
  add_pair_sub: 2,
};

function isHTSat(p: Placement | undefined): p is Placement {
  return !!p && HT_SAT_ROLES.indexOf(p.role) !== -1;
}

// Two placements describe the same home-theater satellite bond.
function sameHTSat(a: Placement | undefined, b: Placement | undefined): boolean {
  return (
    isHTSat(a) &&
    isHTSat(b) &&
    a.anchorUid === b.anchorUid &&
    a.role === b.role &&
    !!a.height === !!b.height
  );
}

interface PairUnit {
  left: string;
  right: string;
  leftName: string;
  rightName: string;
  room: string;
}

// Reconstruct the stereo pairs from a layout, keyed by the left (anchor) UID.
// A pair is only reported when both halves are present.
function pairsOf(map: LayoutMap): PairUnit[] {
  const uids = Object.keys(map).sort();
  const out: PairUnit[] = [];
  for (const left of uids) {
    if (map[left].role !== "pairL") continue;
    const right = uids.find((u) => map[u].role === "pairR" && map[u].anchorUid === left);
    if (!right) continue;
    out.push({
      left,
      right,
      leftName: map[left].name,
      rightName: map[right].name,
      room: map[left].room,
    });
  }
  return out;
}

/**
 * Diff `applied` -> `working` into atomic ops.
 *
 * Emits the minimal net-diff (unchanged placements produce nothing) and orders
 * emission unbond-before-bond: pair separations, then HT satellite removals,
 * then moves, then pair creations, then HT satellite adds.
 */
export function computeOps(applied: LayoutMap, working: LayoutMap): Op[] {
  const ops: Op[] = [];
  const allUids = Array.from(new Set([...Object.keys(applied), ...Object.keys(working)])).sort();

  // ── Phase 0/unbond: separate stereo pairs that no longer exist as-was ────────
  const appliedPairs = pairsOf(applied);
  const workingPairs = pairsOf(working);
  const workingPairKey = new Set(workingPairs.map((p) => `${p.left}|${p.right}`));
  for (const p of appliedPairs) {
    if (workingPairKey.has(`${p.left}|${p.right}`)) continue;
    ops.push({
      type: "separate",
      touches: [p.left, p.right],
      service: {
        domain: "chorus",
        service: "separate",
        data: { left: p.left, right: p.right }, // UIDs — names are ambiguous
      },
      summary: `${p.room} — separate stereo pair`,
    });
  }

  // ── Unbond: remove HT satellites that are gone or re-channelled ──────────────
  for (const uid of allUids) {
    const a = applied[uid];
    const b = working[uid];
    if (isHTSat(a) && !sameHTSat(a, b)) {
      ops.push({
        type: "remove_ht",
        touches: [uid, a.anchorUid],
        service: {
          domain: "chorus",
          service: "remove_home_theater",
          data: { soundbar: a.anchorUid, channel: a.role },
        },
        summary: `${a.room} — remove ${CHANNEL_LABEL[a.role] ?? a.role}`,
      });
    }
  }

  // ── Phase 1: move a standalone speaker to another room ───────────────────────
  for (const uid of allUids) {
    const a = applied[uid];
    const b = working[uid];
    if (a && b && a.role === "solo" && b.role === "solo" && a.room !== b.room) {
      ops.push({
        type: "move",
        touches: [uid],
        service: {
          domain: "chorus",
          service: "move",
          data: { speaker: uid, name: b.room },
        },
        summary: `${b.name} — move to ${b.room}`,
      });
    }
  }

  // ── Phase 2/bond: create new stereo pairs ────────────────────────────────────
  const appliedPairKey = new Set(appliedPairs.map((p) => `${p.left}|${p.right}`));
  for (const p of workingPairs) {
    if (appliedPairKey.has(`${p.left}|${p.right}`)) continue;
    ops.push({
      type: "create_pair",
      touches: [p.left, p.right],
      service: {
        domain: "chorus",
        service: "create_stereo_pair",
        data: { left: p.left, right: p.right }, // UIDs — names are ambiguous
      },
      summary: `${p.room} — create stereo pair`,
    });
  }

  // ── Bond: add HT satellites that are new or re-channelled ────────────────────
  for (const uid of allUids) {
    const a = applied[uid];
    const b = working[uid];
    if (isHTSat(b) && !sameHTSat(a, b)) {
      const field = CHANNEL_FIELD[b.role];
      ops.push({
        type: "add_ht",
        touches: [uid, b.anchorUid],
        service: {
          domain: "chorus",
          service: "set_home_theater",
          data: { soundbar: b.anchorUid, [field]: uid },
        },
        summary: `${b.room} — add ${CHANNEL_LABEL[b.role] ?? b.role}`,
      });
    }
  }

  // ── Sub bonded to a stereo pair (add/remove) ─────────────────────────────────
  // A pairSub is applied by re-issuing CreateStereoPair with the sub appended (add)
  // or dissolving the set and re-pairing (remove) — both need the pair's left+right.
  const pairRightOf = (map: LayoutMap, left: string): string | undefined =>
    Object.keys(map).find((u) => map[u].role === "pairR" && map[u].anchorUid === left);
  for (const uid of allUids) {
    const a = applied[uid];
    const b = working[uid];
    const wasSub = a?.role === "pairSub";
    const isSubNow = b?.role === "pairSub";
    // A pairSub anchored on a pair-left has a `right` (the pair's other half); one
    // anchored on a lone speaker does not — omit `right` there (speaker + sub).
    if (isSubNow && !wasSub) {
      const left = b.anchorUid;
      const right = pairRightOf(working, left);
      ops.push({
        type: "add_pair_sub",
        touches: right ? [uid, left, right] : [uid, left],
        service: {
          domain: "chorus",
          service: "add_pair_sub",
          data: right ? { left, right, sub: uid } : { left, sub: uid },
        },
        summary: `${b.room} — add Sub`,
      });
    } else if (wasSub && !isSubNow) {
      const left = a.anchorUid;
      const right = pairRightOf(applied, left);
      ops.push({
        type: "remove_pair_sub",
        touches: right ? [uid, left, right] : [uid, left],
        service: {
          domain: "chorus",
          service: "remove_pair_sub",
          data: right ? { left, right, sub: uid } : { left, sub: uid },
        },
        summary: `${a.room} — remove Sub`,
      });
    }
  }

  return ops;
}

/**
 * Group ops into lanes via union-find over shared `touches`: ops sharing any
 * device UID land in the same lane (serialised); disjoint ops go in separate
 * lanes (parallel). Within a lane, order by phase (separate -> move -> bonds),
 * with the original emission order as a stable tiebreak. Lanes are returned in
 * a deterministic order (by their earliest op).
 */
export function planLanes(ops: Op[]): Op[][] {
  const parent = ops.map((_, i) => i);
  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }
  function union(a: number, b: number): void {
    parent[find(a)] = find(b);
  }

  const byDev: Record<string, number> = {};
  ops.forEach((op, i) => {
    op.touches.forEach((d) => {
      if (byDev[d] != null) union(i, byDev[d]);
      byDev[d] = i;
    });
  });

  const lanes = new Map<number, number[]>();
  ops.forEach((_, i) => {
    const root = find(i);
    const bucket = lanes.get(root);
    if (bucket) bucket.push(i);
    else lanes.set(root, [i]);
  });

  return Array.from(lanes.values())
    .sort((a, b) => a[0] - b[0]) // deterministic lane order: by earliest op index
    .map((idxs) =>
      idxs
        .slice()
        .sort((i, j) => PHASE[ops[i].type] - PHASE[ops[j].type] || i - j)
        .map((i) => ops[i])
    );
}
