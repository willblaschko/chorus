// Pure working-model edits + the bridge from the editor's Room model to the
// scheduler's flat LayoutMap. NO DOM, NO Lit — every speaker-location change is a
// pure function returning a NEW Room[] (input untouched), so it's fully unit-tested.
//
// Scope (v0.2 slice 1): within-room bonding edits — assign a lone speaker to an HT
// channel, clear a channel, create/separate a stereo pair. Cross-room moves are a
// later slice. These map 1:1 to the validated chorus.* services via computeOps.

import { CHANNELS, type Channel, type Room } from "./model.js";
import type { LayoutMap, Placement } from "./apply.js";

/** Convert the room model to the flat LayoutMap the scheduler diffs. */
export function roomsToLayout(rooms: Room[]): LayoutMap {
  const map: LayoutMap = {};
  for (const r of rooms) {
    if (r.ht) {
      const bar = r.ht.bar;
      map[bar.uid] = { room: r.name, role: "CC", anchorUid: bar.uid, name: bar.name };
      for (const ch of CHANNELS) {
        const sp = r.ht.slots[ch];
        if (sp) {
          map[sp.uid] = { room: r.name, role: ch, anchorUid: bar.uid, name: sp.name };
        }
      }
    }
    for (const p of r.pairs) {
      if (p.L) {
        map[p.L.uid] = { room: r.name, role: "pairL", anchorUid: p.L.uid, name: p.L.name };
        if (p.R) {
          map[p.R.uid] = { room: r.name, role: "pairR", anchorUid: p.L.uid, name: p.R.name };
        }
      }
      // NOTE: a sub bonded to a pair is not yet part of the diff (a pair isn't a
      // soundbar for set_home_theater); managing pair+sub is a later slice.
    }
    for (const s of r.tray) {
      map[s.uid] = { room: r.name, role: "solo", anchorUid: s.uid, name: s.name };
    }
  }
  return map;
}

// ── pure edits ────────────────────────────────────────────────────────────────

function cloneRooms(rooms: Room[]): Room[] {
  return structuredClone(rooms);
}

function findRoom(rooms: Room[], key: string): Room | undefined {
  return rooms.find((r) => r.key === key);
}

/**
 * Assign a lone speaker (currently in the SAME room's tray) to a home-theater
 * channel. Any speaker already on that channel is displaced back to the tray.
 * No-op (returns the input unchanged, cloned) if the room has no HT or the speaker
 * isn't in its tray.
 */
export function assignToChannel(
  rooms: Room[],
  roomKey: string,
  ch: Channel,
  speakerUid: string
): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room || !room.ht) return next;
  const idx = room.tray.findIndex((s) => s.uid === speakerUid);
  if (idx === -1) return next;
  const [speaker] = room.tray.splice(idx, 1);
  const displaced = room.ht.slots[ch];
  if (displaced) room.tray.push(displaced);
  room.ht.slots[ch] = speaker;
  room.tray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return next;
}

/** Remove whatever is on an HT channel back into the room's tray. */
export function clearChannel(rooms: Room[], roomKey: string, ch: Channel): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room || !room.ht) return next;
  const sp = room.ht.slots[ch];
  if (!sp) return next;
  room.ht.slots[ch] = null;
  room.tray.push(sp);
  room.tray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return next;
}

/** Create a stereo pair from two speakers currently in the room's tray. */
export function createPair(
  rooms: Room[],
  roomKey: string,
  leftUid: string,
  rightUid: string
): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room || leftUid === rightUid) return next;
  const li = room.tray.findIndex((s) => s.uid === leftUid);
  const ri = room.tray.findIndex((s) => s.uid === rightUid);
  if (li === -1 || ri === -1) return next;
  const left = room.tray[li];
  const right = room.tray[ri];
  room.tray = room.tray.filter((s) => s.uid !== leftUid && s.uid !== rightUid);
  room.pairs.push({ L: left, R: right, sub: null });
  return next;
}

/** Separate a stereo pair (by index) back into the room's tray. */
export function separatePair(rooms: Room[], roomKey: string, pairIndex: number): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room || pairIndex < 0 || pairIndex >= room.pairs.length) return next;
  const [pair] = room.pairs.splice(pairIndex, 1);
  for (const sp of [pair.L, pair.R, pair.sub]) if (sp) room.tray.push(sp);
  room.tray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return next;
}

/** Swap a pair's left and right channels. */
export function swapPair(rooms: Room[], roomKey: string, pairIndex: number): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room || pairIndex < 0 || pairIndex >= room.pairs.length) return next;
  const p = room.pairs[pairIndex];
  [p.L, p.R] = [p.R, p.L];
  return next;
}

/** Separate a whole home theater — every satellite returns to the tray, the
 * soundbar stays (as a standalone soundbar ready to rebuild). */
export function dissolveHT(rooms: Room[], roomKey: string): Room[] {
  const room = findRoom(rooms, roomKey);
  if (!room?.ht) return cloneRooms(rooms);
  let next = cloneRooms(rooms);
  for (const ch of CHANNELS) next = clearChannel(next, roomKey, ch); // no-op if empty
  return next;
}

// Re-export for consumers that build a Placement directly (tests, editor glue).
export type { LayoutMap, Placement };
