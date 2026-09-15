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
      // The coordinator carries the SET's name (a bonded set is one zone). Satellites
      // keep their own name in the map but apply.ts never renames a satellite — their
      // name is subsumed by the coordinator's zone, so it's display-only here.
      if (kind === "home_theater") {
        map[p.uid] = { room: r.name, role: "CC", anchorUid: p.uid, name: set.name };
        for (const ch of CHANNELS) {
          const sp = set.slots[ch];
          if (sp) map[sp.uid] = { room: r.name, role: ch, anchorUid: p.uid, name: sp.name };
        }
      } else if (kind === "stereo_pair") {
        map[p.uid] = { room: r.name, role: "pairL", anchorUid: p.uid, name: set.name };
        const rf = set.slots.RF;
        if (rf) map[rf.uid] = { room: r.name, role: "pairR", anchorUid: p.uid, name: rf.name };
        const sw = set.slots.SW;
        // A sub bonded to a pair is a real op now (add_pair_sub/remove_pair_sub).
        if (sw) map[sw.uid] = { room: r.name, role: "pairSub", anchorUid: p.uid, name: sw.name };
      } else {
        map[p.uid] = { room: r.name, role: "solo", anchorUid: p.uid, name: set.name };
        const sw = set.slots.SW;
        // A sub on a lone speaker is a real op now (add_pair_sub with no `right`).
        if (sw) map[sw.uid] = { room: r.name, role: "pairSub", anchorUid: p.uid, name: sw.name };
      }
    }
    // Tag pool subs with the stable key (not the display name) so the diff can tell
    // "unbonded to the pool" apart from a real room move.
    const roomLabel = r.key === AVAILABLE_SUBS_KEY ? AVAILABLE_SUBS_KEY : r.name;
    for (const s of r.tray) {
      map[s.uid] = { room: roomLabel, role: "solo", anchorUid: s.uid, name: s.name };
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
/**
 * World B naming: a zone's Sonos name follows its ROOM. Returns the room name, or
 * "<room> 2" / "<room> 3" ... when the base is already taken by another zone in the
 * same room (a set's name or a tray speaker's name) — Sonos' own de-dupe convention.
 * `exceptSetId`/`exceptUid` skip a zone that's mid-move (so it doesn't block its own name).
 */
function roomZoneName(room: Room, exceptSetId?: string, exceptUid?: string): string {
  const taken = new Set<string>();
  for (const set of room.sets) if (set.id !== exceptSetId) taken.add(set.name);
  for (const s of room.tray) if (s.uid !== exceptUid) taken.add(s.name);
  const base = room.name;
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const cand = `${base} ${n}`;
    if (!taken.has(cand)) return cand;
  }
}

/** A freed satellite: a sub is homeless (global pool); a real speaker returns to the
 * tray and (World B) takes a room-derived name, since it's now its own zone again. */
function release(rooms: Room[], room: Room, ch: Channel, sp: EditorSpeaker): void {
  if (ch === "SW") toPool(rooms, sp);
  else {
    sp.name = roomZoneName(room, undefined, sp.uid);
    toTray(room, sp);
  }
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
  // A speaker+sub is fundamentally still that speaker, so it keeps the speaker's name
  // (not the room name) — a sub is invisible.
  room.sets.push({ id: speaker.uid, name: speaker.name, primary: speaker, slots: { SW: sub } });
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
  // World B: the new pair's zone name follows the room (both halves are out of the tray
  // now, so they don't block the base name). The name lives on the SET, so a later L/R
  // swap never changes it.
  room.sets.push({ id: left.uid, name: roomZoneName(room), primary: left, slots: { RF: right } });
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
  // World B: the coordinator keeps the set's (zone) name; the other half becomes its own
  // zone and takes the next free room-derived name ("Room 2") to avoid colliding with it.
  set.primary.name = set.name;
  toTray(room, set.primary);
  if (set.slots.RF) {
    set.slots.RF.name = roomZoneName(room, undefined, set.slots.RF.uid);
    toTray(room, set.slots.RF);
  }
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
  // World B: a moved speaker's zone name follows its new room (disambiguated if taken).
  moved.name = roomZoneName(target, undefined, moved.uid);
  toTray(target, moved);
  next.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return next;
}

// ── stage a manual rename ───────────────────────────────────────────────────────
// A standalone (tray) speaker renames itself. Renaming ANY member of a bonded set
// renames the SET's zone (a bonded set is one zone with one name) — never a single
// member, so the name survives an L/R swap and only the coordinator is renamed on apply.
export function renameSpeaker(rooms: Room[], uid: string, newName: string): Room[] {
  const next = cloneRooms(rooms);
  for (const r of next) {
    for (const s of r.tray) {
      if (s.uid === uid) {
        s.name = newName;
        return next;
      }
    }
    for (const set of r.sets) {
      if (set.primary.uid === uid) {
        set.name = newName;
        return next;
      }
      for (const ch of CHANNELS) {
        const sp = set.slots[ch];
        if (sp?.uid === uid) {
          set.name = newName;
          return next;
        }
      }
    }
  }
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
  room.sets.push({ id: bar.uid, name: bar.name, primary: bar, slots: {} });
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
