// Editor data model: capability registry + bond-graph -> editable rooms.
// Pure functions (no DOM, no hass) so they're unit-testable and reused by the UI.

import type { BondGraph, BondUnit } from "./types.js";

/** Short model label — drops the "Sonos "/"Symfonisk " brand prefix. Pure string
 * helper kept here (not in the Lit-based icons.ts) so pure modules can use it. */
export function shortModel(model: string | null | undefined): string {
  return (model || "").replace("Sonos ", "").replace("Symfonisk ", "");
}

export type Channel = "LF" | "RF" | "LR" | "RR" | "SW";
export const CHANNELS: Channel[] = ["LF", "RF", "LR", "RR", "SW"];
export const CHANNEL_NAME: Record<Channel, string> = {
  LF: "Front L",
  RF: "Front R",
  LR: "Rear L",
  RR: "Rear R",
  SW: "Sub",
};

/** Device capabilities, derived from the model string (mirrors const.py). */
export interface Caps {
  icon: string;
  primary?: boolean; // can be a home-theater center (soundbar)
  sub?: boolean; // is a subwoofer
  surround?: boolean; // can be a surround/satellite
  pair?: boolean; // can be stereo-paired
  height?: boolean; // has up-firing Atmos drivers (height channel)
}

// One row per device family, matched top-down on the (lower-cased) model string.
// Adding a future device is a one-line change; unknown models hit FALLBACK so new
// hardware degrades gracefully instead of breaking.
const KINDS: Array<{ re: RegExp; caps: Caps }> = [
  { re: /arc/, caps: { icon: "soundbar", primary: true } },
  { re: /beam|ray|playbar|playbase/, caps: { icon: "soundbar", primary: true } },
  { re: /sub/, caps: { icon: "sub", sub: true } },
  { re: /era 300/, caps: { icon: "era", surround: true, pair: true, height: true } },
  { re: /era/, caps: { icon: "era", surround: true, pair: true } },
  { re: /lamp/, caps: { icon: "lamp", surround: true, pair: true } },
  { re: /frame|picture/, caps: { icon: "frame", surround: true, pair: true } },
  { re: /bookshelf/, caps: { icon: "book", surround: true, pair: true } },
  { re: /connect|port|amp/, caps: { icon: "connect" } },
  { re: /move|roam/, caps: { icon: "driver" } },
];
const FALLBACK: Caps = { icon: "driver", surround: true, pair: true };

export function speakerKind(model: string | null | undefined): Caps {
  const m = (model || "").toLowerCase();
  for (const k of KINDS) if (k.re.test(m)) return k.caps;
  return FALLBACK;
}
export const isBar = (model?: string | null) => !!speakerKind(model).primary;
export const isSub = (model?: string | null) => !!speakerKind(model).sub;
export const canSurround = (model?: string | null) => !!speakerKind(model).surround;
export const canPair = (model?: string | null) => !!speakerKind(model).pair;
export const hasHeight = (model?: string | null) => !!speakerKind(model).height;

/** Drop-eligibility for a home-theater position. */
export function positionAccepts(ch: Channel, model?: string | null): boolean {
  return ch === "SW" ? isSub(model) : canSurround(model);
}

export interface EditorSpeaker {
  uid: string;
  name: string; // the speaker's OWN name; a member keeps this through bonding, so
  // separating a set restores each half's standalone name automatically.
  model: string;
  ip: string | null;
  volume?: number | null; // 0-100 for a standalone speaker's zone; display-only
}

/**
 * The one unifying shape for everything bonded: a visible PRIMARY anchor plus
 * satellites keyed by channel. A home theater, a stereo pair, and a speaker+sub
 * are the same structure — only the primary and which channels are filled differ:
 *   - home theater: primary = soundbar (CC); slots = LF/RF/LR/RR/SW
 *   - stereo pair:  primary = left speaker;  slots = RF (partner) [+ SW]
 *   - speaker+sub:  primary = a speaker;     slots = SW
 * A sub is just a speaker that can only occupy an SW slot, on ANY set.
 */
export interface BondedSet {
  id: string; // stable id = the primary speaker's uid
  // The set's ONE zone name (a bonded set is a single Sonos zone). This is the
  // source of truth for the coordinator's name — NOT derived from whichever member
  // is currently primary, so swapping L/R never changes the name. Defaults to the
  // room name when a set is created in the editor; from hardware it's the primary's
  // (coordinator's) live zone name.
  name: string;
  volume?: number | null; // 0-100 for the whole bonded zone; display-only
  primary: EditorSpeaker; // visible anchor: soundbar / pair-left / lone speaker
  slots: Partial<Record<Channel, EditorSpeaker>>; // bonded satellites by channel
}

export type SetKind = "home_theater" | "stereo_pair" | "speaker";

/** A set's kind is DERIVED from its primary + satellites (no stored discriminant). */
export function setKind(set: BondedSet): SetKind {
  if (isBar(set.primary.model)) return "home_theater";
  if (set.slots.RF) return "stereo_pair";
  return "speaker";
}

/** Channels a set can still accept, from the primary's capabilities (excludes
 * already-filled slots). Soundbar → the 5 HT channels; a pairable speaker → a
 * partner (RF) and a sub (SW); any set can take a sub. */
export function openSlots(set: BondedSet): Channel[] {
  const all: Channel[] = isBar(set.primary.model)
    ? ["LF", "RF", "LR", "RR", "SW"]
    : [...(canPair(set.primary.model) ? (["RF"] as Channel[]) : []), "SW"];
  return all.filter((ch) => !set.slots[ch]);
}

/**
 * A room == a Home Assistant Area. It holds any number of bonded `sets` (home
 * theaters, stereo pairs, speaker+sub) plus lone non-sub speakers in `tray`
 * (available to bond). Unbonded subs live in one global pseudo-room, AVAILABLE_SUBS_KEY.
 */
export interface Room {
  key: string; // HA Area name, or the zone name when a unit has no area
  name: string;
  area: string | null; // the HA Area (null when the speaker isn't assigned one)
  sets: BondedSet[];
  tray: EditorSpeaker[];
}

/** True when two zones in the room share a Sonos name (a bonded set OR a tray speaker).
 * The de-dup convention ("<room> 2/3") normally prevents this, but a rename that didn't
 * land on the device can leave a collision — this is what surfaces it in the UI. */
export function roomNameCollision(room: Room): boolean {
  const names = [...room.sets.map((s) => s.name), ...room.tray.map((s) => s.name)];
  return new Set(names).size !== names.length;
}

function speakerOf(m: {
  uid: string;
  name: string | null;
  model?: string;
  ip: string | null;
}): EditorSpeaker {
  return { uid: m.uid, name: m.name || m.uid, model: m.model || "", ip: m.ip };
}

function unitArea(u: BondUnit): string | null {
  const primary = u.members.find((m) => m.is_primary) ?? u.members[0];
  return primary?.area ?? null;
}

// A home theater unit -> a set whose primary is the CC soundbar and whose slots
// are the bonded satellites (LF/RF/LR/RR/SW).
function htSet(u: BondUnit): BondedSet {
  const slots: Partial<Record<Channel, EditorSpeaker>> = {};
  let bar: EditorSpeaker | undefined;
  for (const m of u.members) {
    if (m.channel === "CC") bar = speakerOf(m);
    else if (m.channel && (CHANNELS as string[]).includes(m.channel)) {
      slots[m.channel as Channel] = speakerOf(m);
    }
  }
  const primary = bar ?? speakerOf(u.members[0]);
  return { id: primary.uid, name: primary.name, volume: u.volume ?? null, primary, slots };
}

// A stereo-pair unit -> a set whose primary is the left/visible half; the right
// half is the RF slot, and a bonded sub (if any) is the SW slot.
function pairSet(u: BondUnit): BondedSet {
  const left =
    u.members.find((m) => m.channel === "LF") ??
    u.members.find((m) => m.is_primary) ??
    u.members[0];
  const right = u.members.find((m) => m.channel === "RF");
  const sub = u.members.find((m) => m.channel === "SW");
  const primary = speakerOf(left);
  const slots: Partial<Record<Channel, EditorSpeaker>> = {};
  if (right) slots.RF = speakerOf(right);
  if (sub) slots.SW = speakerOf(sub);
  return { id: primary.uid, name: primary.name, volume: u.volume ?? null, primary, slots };
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { numeric: true });

/** Sentinel room key for the global pool of unbonded subs (see buildRooms). */
export const AVAILABLE_SUBS_KEY = "__available_subs__";

/**
 * Group the live bond graph into rooms by HA Area. Units whose primary speaker has
 * no area fall back to their own zone name as the room key, so nothing is dropped.
 *
 * Subs are special: a sub has no standalone playback role, so an unbonded sub is
 * homeless -- it can only live in a home theater's SW slot (or, later, a pair). We
 * collect every unbonded sub into one global "Available subs" pseudo-room (keyed
 * AVAILABLE_SUBS_KEY) so the editor can offer it as droppable onto ANY home theater,
 * across rooms. A sub is NEVER rendered as a soundbar: right after it's unbonded it
 * can briefly appear as a degenerate "home theater of one", which we detect and
 * route to the pool instead.
 */
export function buildRooms(graph: BondGraph | undefined): Room[] {
  const units = graph?.units ?? [];
  const byKey = new Map<string, Room>();
  const order: string[] = [];
  const availableSubs: EditorSpeaker[] = [];

  // A loose (unbonded) speaker: a sub is homeless (global pool); anything else
  // lands in its own room's tray.
  const routeLoose = (room: Room, sp: EditorSpeaker): void => {
    if (isSub(sp.model)) availableSubs.push(sp);
    else room.tray.push(sp);
  };

  for (const u of units) {
    const area = unitArea(u);
    const key = area ?? u.name;
    let room = byKey.get(key);
    if (!room) {
      room = { key, name: area ?? u.name, area, sets: [], tray: [] };
      byKey.set(key, room);
      order.push(key);
    }
    if (u.kind === "home_theater") {
      const bar = u.members.find((m) => m.channel === "CC") ?? u.members[0];
      // A real home theater is a soundbar plus >=1 satellite. A single-member unit
      // (a lone soundbar, or a just-unbonded sub masquerading as a home-theater-of-
      // one) is NOT a set: route its members loose (a bar -> tray for the setup CTA,
      // a sub -> the unassigned pool).
      if (isSub(bar?.model) || u.members.length <= 1) {
        for (const m of u.members) routeLoose(room, { ...speakerOf(m), volume: u.volume ?? null });
      } else {
        room.sets.push(htSet(u));
      }
    } else if (u.kind === "stereo_pair") {
      room.sets.push(pairSet(u));
    } else {
      for (const m of u.members) routeLoose(room, { ...speakerOf(m), volume: u.volume ?? null });
    }
  }

  // Drop rooms left empty because their only speaker was a sub routed to the pool
  // (e.g. a lone unbonded sub whose zone name became a phantom room).
  const rooms = order
    .map((k) => byKey.get(k)!)
    .filter((r) => r.sets.length > 0 || r.tray.length > 0);
  for (const r of rooms) r.tray.sort(byName);
  rooms.sort(byName);
  if (availableSubs.length) {
    availableSubs.sort(byName);
    rooms.push({
      key: AVAILABLE_SUBS_KEY,
      name: "Available subs",
      area: null,
      sets: [],
      tray: availableSubs,
    });
  }
  return rooms;
}
