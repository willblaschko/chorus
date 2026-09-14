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
import type { LayoutMap } from "./apply.js";

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
