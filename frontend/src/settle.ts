// Deciding when a bonding change has TRULY settled on the devices.
//
// Measured on real hardware (2x2 front swap): the topology (channel map) is correct
// within ~9s, but the system keeps cycling until ~53s — satellite names resolve
// ~38s, and removed speakers reappear as standalones ~32-49s. Critically there's a
// STABLE ~23s plateau early on (satellites bonded but unnamed, removed speakers not
// yet rediscovered), so "the graph stopped changing" alone would declare victory ~40s
// too early. True settle needs three things together: topology matches intent, every
// speaker has a resolved name, and the full graph is stable across polls.
//
// Pure functions (no DOM/hass) so they're the single source of truth for the editor's
// convergence loop AND unit-testable against the captured timeline.

import type { BondGraph } from "./types.js";
import type { LayoutMap, OpType } from "./apply.js";

/** Topology fingerprint: each speaker's role + anchor (the actual bonds). */
export function bondSignature(map: LayoutMap): string {
  return Object.keys(map)
    .sort()
    .map((u) => `${u}:${map[u].role}:${map[u].anchorUid}`)
    .join(";");
}

/** Full fingerprint: every speaker's channel + name + membership. Changes while the
 * device cycles (names resolving, removed speakers reappearing), so "unchanged"
 * across polls == no transitions in flight. */
export function fullSignature(graph: BondGraph): string {
  const parts: string[] = [];
  for (const u of graph.units ?? []) {
    for (const m of u.members) parts.push(`${m.uid}:${m.channel ?? "-"}:${m.name ?? ""}`);
  }
  return parts.sort().join(";");
}

/** Every speaker has a real, resolved name — not empty and not a raw RINCON UID.
 * This is what rules out the mid-swap plateau (freshly-bonded satellites are unnamed
 * for ~30s). */
export function namesResolved(graph: BondGraph): boolean {
  for (const u of graph.units ?? []) {
    for (const m of u.members) {
      if (!m.name || /^RINCON_/i.test(m.name)) return false;
    }
  }
  return true;
}

/**
 * True only when the change has fully landed: the topology matches what we asked for,
 * every name has resolved, AND the full graph is unchanged since the previous poll.
 * `prevFull` is undefined on the first poll (nothing to compare — never settled yet).
 */
export function settled(
  intendedTopology: string,
  freshTopology: string,
  fresh: BondGraph,
  prevFull: string | undefined
): boolean {
  return (
    freshTopology === intendedTopology &&
    namesResolved(fresh) &&
    prevFull !== undefined &&
    fullSignature(fresh) === prevFull
  );
}

// ── How long a change realistically takes to settle ────────────────────────
//
// Measured on real hardware across 8 front swaps (see docs): a pure ADD settles
// in ~9s (nothing to wait for), but ANY removal forces the released speaker(s)
// to be rediscovered as standalones — a slow, roughly-constant ~30-54s cost that
// dominates everything else and happens in parallel across the removed speakers.
// So the model is: a base, a big one-time cost the moment there's ≥1 removal, and
// small per-op costs on top. Used both to budget the convergence loop (so it never
// gives up before a real swap finishes) and to pace the progress bar.
const BASE_MS = 9000;
const REMOVAL_REDISCOVERY_MS = 55000; // once ≥1 speaker is released, ~constant
const ADD_MS = 3000;
const MOVE_MS = 4000;

export function expectedSettleMs(opTypes: readonly OpType[]): number {
  const has = (t: OpType): boolean => opTypes.indexOf(t) !== -1;
  const count = (t: OpType): number => opTypes.filter((o) => o === t).length;
  // remove_pair_sub dissolves the whole set and re-pairs, so it pays the same
  // rediscovery cost as any other release.
  const releases = has("remove_ht") || has("separate") || has("remove_pair_sub");
  return (
    BASE_MS +
    (releases ? REMOVAL_REDISCOVERY_MS : 0) +
    (count("add_ht") + count("create_pair") + count("add_pair_sub")) * ADD_MS +
    count("move") * MOVE_MS
  );
}

// ── Live, human-readable settle progress ───────────────────────────────────
//
// While the convergence loop polls, this turns the current live layout into a
// message the user can actually reason about ("Reconnecting TV Left, TV Right… (1
// of 2)") plus a 0..1 ratio for the progress bar. `releasedUids` are the speakers
// the plan un-bonded — the ones we're waiting to see come back as standalones,
// which is the slow part. Pure: the editor passes in the intended + live layouts.
export interface SettleView {
  label: string;
  ratio: number;
}

/** Bonds-only fingerprint: the bonded roles (ignores standalones), so we can tell
 * "the bonds are correct" apart from "the released speakers are back yet". */
export function bondsSignature(map: LayoutMap): string {
  return Object.keys(map)
    .filter((u) => map[u].role !== "solo")
    .sort()
    .map((u) => `${u}:${map[u].role}:${map[u].anchorUid}`)
    .join(";");
}

function humanList(names: string[]): string {
  if (names.length === 0) return "speakers";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

export function settleView(
  intended: LayoutMap,
  fresh: LayoutMap,
  releasedUids: readonly string[]
): SettleView {
  // Bonds not in place yet — still issuing/settling the actual bond changes.
  if (bondsSignature(intended) !== bondsSignature(fresh)) {
    return { label: "Reconfiguring speakers…", ratio: 0.12 };
  }
  const total = releasedUids.length;
  const back = releasedUids.filter((u) => fresh[u]?.role === "solo").length;
  if (total > 0 && back < total) {
    const waitingNames = releasedUids
      .filter((u) => fresh[u]?.role !== "solo")
      .map((u) => intended[u]?.name || "a speaker");
    return {
      label: `Reconnecting ${humanList(waitingNames)}… (${back} of ${total})`,
      ratio: 0.2 + 0.68 * (back / total),
    };
  }
  // Bonds correct and every released speaker is back — just the final sync.
  return { label: "Finishing up…", ratio: 0.92 };
}
