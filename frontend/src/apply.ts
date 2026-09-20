// Pure scheduler: turn a diff of the staged Sonos layout into an ordered,
// parallelizable list of Home Assistant service calls.
//
// NO DOM, NO Lit, NO Home Assistant objects — just typed functions over plain
// data, so the whole thing is unit-testable. Every edit is staged locally
// against the last-applied state, and the pending work is simply the
// diff between the two layouts. Each op is tagged with the device UIDs it
// touches; a union-find over those touch-sets falls straight out as the apply
// plan (ops sharing a device serialise, disjoint ops run in parallel).

// The available-subs pool's room key — a synthetic "room" that must not count as a
// real move target (model.ts only imports TYPES from here, so this stays one-way).
import { AVAILABLE_SUBS_KEY } from "./model.js";

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
  model?: string; // short model label, to disambiguate a device in summaries (a bonded
  // sub's `name` is the inherited room name, so "move to X" alone reads ambiguously)
  offline?: boolean; // no LAN address — unreachable (unplugged/off); never auto-operate on it
}

// speakerUid -> placement. One map for the last-applied state, one for the staged/working state.
export type LayoutMap = Record<string, Placement>;

export type OpType =
  | "separate"
  | "move"
  | "rename"
  | "create_pair"
  | "add_ht"
  | "remove_ht"
  | "add_pair_sub"
  | "remove_pair_sub";

export interface Op {
  type: OpType;
  touches: string[]; // device UIDs this op reads/writes (for lane planning)
  service: { domain: "chorus"; service: string; data: Record<string, unknown> };
  summary: string; // plain-language, e.g. "Office (Era 300) — add as Rear L in Media Room"
  // For ops that rename a zone (rename, and the rename half of a move): lets the user
  // uncheck it to KEEP the current name. `required` means keeping it would clash with
  // another zone in the room, so it can't be unchecked. `currentName` is what to keep,
  // `targetName` the room-derived name it would get, and `move` is true when the rename is
  // the sub-part of a MOVE (so the UI shows it as a sub-item, not a checkbox on the row).
  keep?: { uid: string; required: boolean; currentName: string; targetName: string; move: boolean };
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

// Ordering within a lane: 0 UNBOND (free speakers) -> 1 MOVE (re-home them) -> 2 RENAME
// (give them de-duped names) -> 3 BOND (re-bond).
// - RENAME is NOT last: a speaker unbonded from a set keeps that set's zone name until
//   renamed, so in a single-lane HT rearrange (every op shares the soundbar) a trailing
//   rename would leave it colliding with the set for the WHOLE operation. Doing it right
//   after the un-bond closes that window. The de-duped names are already in the plan, so
//   this is pure scheduling. (Rename only targets speakers that END standalone/coordinator,
//   never one about to be bonded away, so it's safe before the re-bonds.)
// - MOVE strictly precedes RENAME (distinct phases, not just emit order): a move already
//   renames the zone to its room-derived name, so ordering it first avoids any chance of a
//   move + an in-place rename racing on the same room's names.
const PHASE: Record<OpType, number> = {
  separate: 0,
  remove_ht: 0,
  remove_pair_sub: 0,
  move: 1,
  rename: 2,
  create_pair: 3,
  add_ht: 3,
  add_pair_sub: 3,
};

function isHTSat(p: Placement | undefined): p is Placement {
  return !!p && HT_SAT_ROLES.indexOf(p.role) !== -1;
}

// A device label for change-bar summaries: the speaker's name + its (short) model, so a
// row says WHICH physical unit, not just a room. `model` is already the short form. Never
// surfaces a raw "RINCON_…" uid (an unresolved name) — falls back to the model, then a
// generic label. Avoids redundancy like "Sub Mini (Sub Mini)".
function dev(p: { name?: string; model?: string } | undefined): string {
  const raw = p?.name ?? "";
  const name = /^RINCON_/i.test(raw) ? "" : raw; // a raw UID is not a usable name
  const model = p?.model ?? "";
  if (!name) return model || "a speaker";
  if (!model || name === model || name.includes(model)) return name;
  return `${name} (${model})`;
}

// Honor the checklist's "keep this name" choices: restore each kept uid's CURRENT name into
// the working map, so the diff emits no in-place rename for it and a move carries the old
// name. Pure — the editor's apply path runs this before planning.
export function withKeptNames(
  base: LayoutMap,
  working: LayoutMap,
  kept: Iterable<string>
): LayoutMap {
  const out = { ...working };
  for (const uid of kept) {
    if (out[uid] && base[uid]) out[uid] = { ...out[uid], name: base[uid].name };
  }
  return out;
}

// keep-info for a rename-bearing op: can the user uncheck it (keep the current name), or
// is it REQUIRED because keeping `currentName` would clash with another zone in `room`?
function keepInfo(
  uid: string,
  currentName: string,
  targetName: string,
  room: string,
  working: LayoutMap,
  move: boolean
): NonNullable<Op["keep"]> {
  const clash = Object.keys(working).some(
    (u) => u !== uid && working[u].room === room && working[u].name === currentName
  );
  return { uid, required: clash, currentName, targetName, move };
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
      summary: `${dev(applied[p.left])} — separate stereo pair in ${p.room}`,
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
        summary: `${dev(a)} — remove as ${CHANNEL_LABEL[a.role] ?? a.role} from ${a.room}`,
      });
    }
  }

  // ── move a speaker to another room ───────────────────────────────────────────
  // A speaker that ends up standalone in a DIFFERENT room than it started needs a
  // move (rename its zone + reassign its HA area). This fires even when it started
  // bonded (e.g. separate a pair, then move a half to another room) — the only
  // requirement is that it's `solo` in the target and its room changed. Ordered
  // AFTER the unbonds (see PHASE) so the speaker is freed before it's renamed.
  for (const uid of allUids) {
    const a = applied[uid];
    const b = working[uid];
    // Any speaker whose ROOM changed needs a move (rename its zone + reassign its HA
    // area) — even one that ends up bonded (moved, then paired/bonded in the new room;
    // the move runs before the bond so the set forms in the right room). Excludes the
    // synthetic available-subs pool (unbonding a sub is not a move).
    const poolInvolved = a?.room === AVAILABLE_SUBS_KEY || b?.room === AVAILABLE_SUBS_KEY;
    if (a && b && a.room !== b.room && !poolInvolved) {
      ops.push({
        type: "move",
        touches: [uid],
        service: {
          domain: "chorus",
          // World B: a move renames the zone to its room-derived name (`name`) and
          // reassigns the HA area (`area` = the room). These differ only when the room
          // already holds another zone (e.g. name "Den 2" in area "Den").
          service: "move",
          data: { speaker: uid, name: b.name, area: b.room },
        },
        summary: `${dev(a)} — move to ${b.room}`,
        keep: keepInfo(uid, a.name, b.name, b.room, working, true),
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
      summary: `${dev(working[p.left])} — create stereo pair in ${p.room}`,
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
        summary: `${dev(b)} — add as ${CHANNEL_LABEL[b.role] ?? b.role} in ${b.room}`,
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
        summary: `${dev(b)} — add as Sub in ${b.room}`,
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
        summary: `${dev(a)} — remove as Sub from ${a.room}`,
      });
    }
  }

  // ── rename: a name-bearing zone whose staged name differs from its live name ──
  // Only a standalone speaker or a set's COORDINATOR carries a name (a bonded set is
  // one zone). Satellites are subsumed by the coordinator, so we never rename them —
  // this is what stops an L/R swap (which flips the coordinator UID) from renaming a
  // pair to a satellite's stale name. Pooled subs are excluded (sentinel room).
  // A rename op is only for an IN-PLACE rename (same room, name changed). A room change
  // is a move, and the move op already renames the zone — so we require a.room === b.room
  // here to avoid emitting a redundant second rename for a moved speaker.
  const NAME_BEARING: readonly Role[] = ["solo", "pairL", "CC"];
  for (const uid of allUids) {
    const a = applied[uid];
    const b = working[uid];
    if (
      a &&
      b &&
      b.name &&
      a.name !== b.name &&
      a.room === b.room &&
      a.room !== AVAILABLE_SUBS_KEY &&
      NAME_BEARING.indexOf(b.role) !== -1 &&
      !a.offline // never auto-rename an unreachable speaker — it can only fail
    ) {
      ops.push({
        type: "rename",
        touches: [uid],
        service: { domain: "chorus", service: "rename", data: { speaker: uid, name: b.name } },
        summary: `${dev(a)} — rename to ${b.name}`,
        keep: keepInfo(uid, a.name, b.name, b.room, working, false),
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
