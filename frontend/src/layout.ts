// Pure working-model edits + the bridge from the editor's Room model (bonded SETS
// of primary + channel-slots) to the scheduler's flat LayoutMap. NO DOM, NO Lit —
// every edit returns a NEW Room[] (input untouched), so it's fully unit-tested.
//
// One shape drives everything: a set is a primary anchor + satellites keyed by
// channel. A home theater, a stereo pair, and a speaker+sub differ only in the
// primary and which channels are filled (see model.ts).

import {
  CHANNELS,
  AVAILABLE_SUBS_KEY,
  setKind,
  type Channel,
  type Room,
  type BondedSet,
  type EditorSpeaker,
} from "./model.js";
import type { LayoutMap, Placement } from "./apply.js";

/**
 * Convert the room model to the flat LayoutMap the scheduler diffs.
 * - home-theater sets emit CC + every filled channel (incl. SW)
 * - stereo-pair sets emit pairL/pairR
 * - a sub bonded to a PAIR or a SPEAKER has no validated bond service yet, so those
 *   SW slots are intentionally NOT diffed (diffing them would emit a no-op op).
 */
export function roomsToLayout(rooms: Room[]): LayoutMap {
  const map: LayoutMap = {};
  for (const r of rooms) {
    for (const set of r.sets) {
      const p = set.primary;
      const kind = setKind(set);
      if (kind === "home_theater") {
        map[p.uid] = { room: r.name, role: "CC", anchorUid: p.uid, name: p.name };
        for (const ch of CHANNELS) {
          const sp = set.slots[ch];
          if (sp) map[sp.uid] = { room: r.name, role: ch, anchorUid: p.uid, name: sp.name };
        }
      } else if (kind === "stereo_pair") {
        map[p.uid] = { room: r.name, role: "pairL", anchorUid: p.uid, name: p.name };
        const rf = set.slots.RF;
        if (rf) map[rf.uid] = { room: r.name, role: "pairR", anchorUid: p.uid, name: rf.name };
        const sw = set.slots.SW;
        // A sub bonded to a pair is a real op now (add_pair_sub/remove_pair_sub).
        if (sw) map[sw.uid] = { room: r.name, role: "pairSub", anchorUid: p.uid, name: sw.name };
      } else {
        map[p.uid] = { room: r.name, role: "solo", anchorUid: p.uid, name: p.name };
        const sw = set.slots.SW;
        // A sub on a lone speaker is a real op now (add_pair_sub with no `right`).
        if (sw) map[sw.uid] = { room: r.name, role: "pairSub", anchorUid: p.uid, name: sw.name };
      }
    }
    for (const s of r.tray) {
      map[s.uid] = { room: r.name, role: "solo", anchorUid: s.uid, name: s.name };
    }
  }
  return map;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function cloneRooms(rooms: Room[]): Room[] {
  return structuredClone(rooms);
}
function findRoom(rooms: Room[], key: string): Room | undefined {
  return rooms.find((r) => r.key === key);
}
function findSet(room: Room | undefined, setId: string): BondedSet | undefined {
  return room?.sets.find((s) => s.id === setId);
}
const byName = (a: EditorSpeaker, b: EditorSpeaker) =>
  a.name.localeCompare(b.name, undefined, { numeric: true });

/** Find (or create) the global "Available subs" pseudo-room. */
function poolOf(rooms: Room[]): Room {
  let pool = rooms.find((r) => r.key === AVAILABLE_SUBS_KEY);
  if (!pool) {
    pool = { key: AVAILABLE_SUBS_KEY, name: "Available subs", area: null, sets: [], tray: [] };
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
function toTray(room: Room, sp: EditorSpeaker): void {
  room.tray.push(sp);
  room.tray.sort(byName);
}
function toPool(rooms: Room[], sp: EditorSpeaker): void {
  const p = poolOf(rooms);
  p.tray.push(sp);
  p.tray.sort(byName);
}
/** A freed satellite: a sub is homeless (global pool); anything else goes to the tray. */
function release(rooms: Room[], room: Room, ch: Channel, sp: EditorSpeaker): void {
  if (ch === "SW") toPool(rooms, sp);
  else toTray(room, sp);
}

// ── assign a surround/front (from the room tray) to a home-theater channel ──────
export function assignToChannel(
  rooms: Room[],
  roomKey: string,
  setId: string,
  ch: Channel,
  speakerUid: string
): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  const set = findSet(room, setId);
  if (!room || !set) return next;
  const idx = room.tray.findIndex((s) => s.uid === speakerUid);
  if (idx === -1) return next;
  const [speaker] = room.tray.splice(idx, 1);
  const displaced = set.slots[ch];
  if (displaced) release(next, room, ch, displaced);
  set.slots[ch] = speaker;
  room.tray.sort(byName);
  return next;
}

// ── clear a channel: satellite back to the tray, a sub back to the pool ─────────
export function clearChannel(rooms: Room[], roomKey: string, setId: string, ch: Channel): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  const set = findSet(room, setId);
  if (!room || !set) return next;
  const sp = set.slots[ch];
  if (!sp) return next;
  delete set.slots[ch];
  release(next, room, ch, sp);
  return prunePool(next);
}

// ── assign an available sub to ANY set's SW slot (works cross-room) ─────────────
export function assignSubToChannel(
  rooms: Room[],
  targetRoomKey: string,
  setId: string,
  subUid: string
): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, targetRoomKey);
  const target = findSet(room, setId);
  if (!room || !target) return next;
  // Detach the sub from wherever it currently lives: the pool, or any set's SW.
  let sub: EditorSpeaker | undefined;
  const pool = next.find((r) => r.key === AVAILABLE_SUBS_KEY);
  if (pool) {
    const i = pool.tray.findIndex((s) => s.uid === subUid);
    if (i >= 0) sub = pool.tray.splice(i, 1)[0];
  }
  if (!sub) {
    outer: for (const r of next) {
      for (const s of r.sets) {
        if (s.slots.SW?.uid === subUid) {
          sub = s.slots.SW;
          delete s.slots.SW;
          break outer;
        }
      }
    }
  }
  if (!sub) return next;
  const existing = target.slots.SW;
  if (existing) toPool(next, existing);
  target.slots.SW = sub;
  return prunePool(next);
}

// ── bond an available sub to a LONE speaker (forms a speaker+sub set) ───────────
export function bondSubToSpeaker(
  rooms: Room[],
  roomKey: string,
  speakerUid: string,
  subUid: string
): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room) return next;
  const si = room.tray.findIndex((s) => s.uid === speakerUid);
  if (si === -1) return next;
  // Detach the sub from the pool (or any set's SW slot).
  let sub: EditorSpeaker | undefined;
  const pool = next.find((r) => r.key === AVAILABLE_SUBS_KEY);
  if (pool) {
    const i = pool.tray.findIndex((s) => s.uid === subUid);
    if (i >= 0) sub = pool.tray.splice(i, 1)[0];
  }
  if (!sub) {
    outer: for (const r of next) {
      for (const s of r.sets) {
        if (s.slots.SW?.uid === subUid) {
          sub = s.slots.SW;
          delete s.slots.SW;
          break outer;
        }
      }
    }
  }
  if (!sub) return next;
  const [speaker] = room.tray.splice(si, 1);
  room.sets.push({ id: speaker.uid, primary: speaker, slots: { SW: sub } });
  return prunePool(next);
}

// ── create a stereo pair from two tray speakers (primary = left) ────────────────
export function createPair(rooms: Room[], roomKey: string, leftUid: string, rightUid: string): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room || leftUid === rightUid) return next;
  const li = room.tray.findIndex((s) => s.uid === leftUid);
  const ri = room.tray.findIndex((s) => s.uid === rightUid);
  if (li === -1 || ri === -1) return next;
  const left = room.tray[li];
  const right = room.tray[ri];
  room.tray = room.tray.filter((s) => s.uid !== leftUid && s.uid !== rightUid);
  room.sets.push({ id: left.uid, primary: left, slots: { RF: right } });
  return next;
}

// ── separate a stereo-pair set: both halves to the tray, a sub to the pool ──────
export function separatePair(rooms: Room[], roomKey: string, setId: string): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room) return next;
  const i = room.sets.findIndex((s) => s.id === setId);
  if (i === -1) return next;
  const [set] = room.sets.splice(i, 1);
  toTray(room, set.primary);
  if (set.slots.RF) toTray(room, set.slots.RF);
  if (set.slots.SW) toPool(next, set.slots.SW);
  return prunePool(next);
}

// ── swap a pair's left/right (primary <-> RF) ───────────────────────────────────
export function swapPair(rooms: Room[], roomKey: string, setId: string): Room[] {
  const next = cloneRooms(rooms);
  const set = findSet(findRoom(next, roomKey), setId);
  if (!set || !set.slots.RF) return next;
  const oldPrimary = set.primary;
  set.primary = set.slots.RF;
  set.slots.RF = oldPrimary;
  set.id = set.primary.uid;
  return next;
}

// ── move a lone speaker to another room (by name); creates the room if needed ───
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
    target = { key: targetRoom, name: targetRoom, area: targetRoom, sets: [], tray: [] };
    next.push(target);
  }
  toTray(target, moved);
  next.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return next;
}

// ── set up a home theater from a standalone soundbar in the tray ────────────────
export function setupHT(rooms: Room[], roomKey: string, barUid: string): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room) return next;
  const idx = room.tray.findIndex((s) => s.uid === barUid);
  if (idx === -1) return next;
  const [bar] = room.tray.splice(idx, 1);
  room.sets.push({ id: bar.uid, primary: bar, slots: {} });
  return next;
}

// ── dissolve a home theater: satellites to tray/pool, soundbar back to the tray ─
// (leaves the bar standalone, ready to rebuild — the create/dissolve loop round-trips)
export function dissolveHT(rooms: Room[], roomKey: string, setId: string): Room[] {
  const next = cloneRooms(rooms);
  const room = findRoom(next, roomKey);
  if (!room) return next;
  const i = room.sets.findIndex((s) => s.id === setId);
  if (i === -1) return next;
  const [set] = room.sets.splice(i, 1);
  for (const ch of CHANNELS) {
    const sp = set.slots[ch];
    if (sp) release(next, room, ch, sp);
  }
  toTray(room, set.primary);
  return prunePool(next);
}

// Re-export for consumers that build a Placement directly (tests, editor glue).
export type { LayoutMap, Placement };
