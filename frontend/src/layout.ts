// Pure working-model edits + the bridge from the editor's Room model to the
// scheduler's flat LayoutMap. NO DOM, NO Lit — every speaker-location change is a
// pure function returning a NEW Room[] (input untouched), so it's fully unit-tested.
//
// Scope (v0.2 slice 1): within-room bonding edits — assign a lone speaker to an HT
// channel, clear a channel, create/separate a stereo pair. Cross-room moves are a
// later slice. These map 1:1 to the validated chorus.* services via computeOps.

import { CHANNELS, AVAILABLE_SUBS_KEY, type Channel, type Room, type EditorSpeaker } from "./model.js";
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

const byName = (a: EditorSpeaker, b: EditorSpeaker) =>
  a.name.localeCompare(b.name, undefined, { numeric: true });

/** Find (or create) the global "Available subs" pseudo-room in a rooms array. */
function poolOf(rooms: Room[]): Room {
  let pool = rooms.find((r) => r.key === AVAILABLE_SUBS_KEY);
  if (!pool) {
    pool = { key: AVAILABLE_SUBS_KEY, name: "Available subs", area: null, ht: null, pairs: [], tray: [] };
    rooms.push(pool);
  }
  return pool;
}

/** Drop the available-subs pseudo-room if it has emptied out. */
function prunePool(rooms: Room[]): Room[] {
  const i = rooms.findIndex((r) => r.key === AVAILABLE_SUBS_KEY);
  if (i >= 0 && rooms[i].tray.length === 0) rooms.splice(i, 1);
  return rooms;
}

/**
 * Remove whatever is on an HT channel. A surround/front goes back to its room's
 * tray; a SUB goes to the global available-subs pool (a sub is homeless once
 * unbonded -- it can only live in another HT/pair).
 */
export function clearChannel(rooms: Room[], roomKey: string, ch: Channel): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room || !room.ht) return next;
  const sp = room.ht.slots[ch];
  if (!sp) return next;
  room.ht.slots[ch] = null;
  if (ch === "SW") {
    const pool = poolOf(next);
    pool.tray.push(sp);
    pool.tray.sort(byName);
  } else {
    room.tray.push(sp);
    room.tray.sort(byName);
  }
  return next;
}

/**
 * Assign an available sub to a target room's home-theater SW slot. The sub may
 * currently live in the available pool OR in another home theater's SW slot (this
 * is how a sub moves between rooms). Any sub already on the target's SW is displaced
 * back to the available pool. No-op if the target has no HT or the sub isn't found.
 */
export function assignSubToChannel(rooms: Room[], targetRoomKey: string, subUid: string): Room[] {
  const next = cloneRooms(rooms);
  const target = findRoom(next, targetRoomKey);
  if (!target || !target.ht) return next;

  // Detach the sub from wherever it currently lives.
  let sub: EditorSpeaker | undefined;
  const pool = next.find((r) => r.key === AVAILABLE_SUBS_KEY);
  if (pool) {
    const i = pool.tray.findIndex((s) => s.uid === subUid);
    if (i >= 0) sub = pool.tray.splice(i, 1)[0];
  }
  if (!sub) {
    for (const r of next) {
      if (r.ht && r.ht.slots.SW?.uid === subUid) {
        sub = r.ht.slots.SW;
        r.ht.slots.SW = null;
        break;
      }
    }
  }
  if (!sub) return next;

  // Displace an existing sub on the target back to the pool, then seat the new one.
  const existing = target.ht.slots.SW;
  if (existing) {
    const p = poolOf(next);
    p.tray.push(existing);
    p.tray.sort(byName);
  }
  target.ht.slots.SW = sub;
  return prunePool(next);
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

/** Move a lone speaker to another room (by name); creates the target room if it
 * doesn't exist yet. Only moves speakers from a tray (not bonded members). */
export function moveSpeaker(rooms: Room[], speakerUid: string, targetRoom: string): Room[] {
  const next = cloneRooms(rooms);
  let moved: EditorSpeaker | undefined;
  for (const r of next) {
    const i = r.tray.findIndex((s) => s.uid === speakerUid);
    if (i !== -1) {
      moved = r.tray.splice(i, 1)[0];
      break;
    }
  }
  if (!moved) return next;
  let target = next.find((r) => r.name === targetRoom);
  if (!target) {
    target = { key: targetRoom, name: targetRoom, area: targetRoom, ht: null, pairs: [], tray: [] };
    next.push(target);
  }
  target.tray.push(moved);
  const byName = (a: EditorSpeaker, b: EditorSpeaker) =>
    a.name.localeCompare(b.name, undefined, { numeric: true });
  target.tray.sort(byName);
  next.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return next;
}

/**
 * Move a sub speaker (found anywhere in `rooms` — a room tray OR another pair's
 * `.sub`) into `rooms[roomKey].pairs[pairIndex].sub`, detaching it from its old
 * location first. If the target pair already has a sub, that old sub is returned to
 * the target room's tray. No-op (returns a clone) if the sub uid or the target pair
 * can't be found.
 */
export function addSubToPair(
  rooms: Room[],
  roomKey: string,
  pairIndex: number,
  subUid: string
): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room) return next;
  const pair = room.pairs[pairIndex];
  if (!pair) return next;
  // Detach the sub from wherever it currently lives (a tray or another pair's sub).
  let sub: EditorSpeaker | undefined;
  for (const r of next) {
    const i = r.tray.findIndex((s) => s.uid === subUid);
    if (i !== -1) {
      sub = r.tray.splice(i, 1)[0];
      break;
    }
    const p = r.pairs.find((pp) => pp.sub?.uid === subUid);
    if (p) {
      sub = p.sub!;
      p.sub = null;
      break;
    }
  }
  if (!sub) return next;
  // Displace an existing sub on the target pair back to the target room's tray.
  if (pair.sub) {
    room.tray.push(pair.sub);
    room.tray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }
  pair.sub = sub;
  return next;
}

/** Move the pair's sub back to the room's tray; pair.sub becomes null. No-op if none. */
export function removeSubFromPair(rooms: Room[], roomKey: string, pairIndex: number): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room) return next;
  const pair = room.pairs[pairIndex];
  if (!pair || !pair.sub) return next;
  room.tray.push(pair.sub);
  pair.sub = null;
  room.tray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return next;
}

/**
 * Turn a standalone soundbar (currently in the room's tray, identified by uid) into
 * a home theater: set room.ht = { bar, slots: all null } and remove it from the
 * tray. No-op if the room already has an ht, or the uid isn't in the tray.
 */
export function setupHT(rooms: Room[], roomKey: string, barUid: string): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room || room.ht) return next;
  const idx = room.tray.findIndex((s) => s.uid === barUid);
  if (idx === -1) return next;
  const [bar] = room.tray.splice(idx, 1);
  const slots = {} as Record<Channel, EditorSpeaker | null>;
  for (const ch of CHANNELS) slots[ch] = null;
  room.ht = { bar, slots };
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
