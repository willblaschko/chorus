// Editor data model: capability registry + bond-graph -> editable rooms.
// Pure functions (no DOM, no hass) so they're unit-testable and reused by the UI.

import type { BondGraph, BondUnit } from "./types.js";

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
  name: string;
  model: string;
  ip: string | null;
}

export interface EditorPair {
  L: EditorSpeaker | null;
  R: EditorSpeaker | null;
  sub: EditorSpeaker | null;
}

/** A home theater within a room: one soundbar (CC) + channel positions. */
export interface HTLayout {
  bar: EditorSpeaker;
  slots: Record<Channel, EditorSpeaker | null>;
}

/**
 * A room == a Home Assistant Area. It may hold at most one home theater, any
 * number of stereo pairs, and lone speakers (`tray`). The tray is the pool of
 * speakers in THIS area that can be bonded into the HT/pairs — bonding across
 * areas requires moving the speaker into the area first.
 */
export interface Room {
  key: string; // HA Area name, or the zone name when a unit has no area
  name: string;
  area: string | null; // the HA Area (null when the speaker isn't assigned one)
  ht: HTLayout | null;
  pairs: EditorPair[];
  tray: EditorSpeaker[];
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

function htLayout(u: BondUnit): HTLayout {
  const slots: Record<Channel, EditorSpeaker | null> = {
    LF: null,
    RF: null,
    LR: null,
    RR: null,
    SW: null,
  };
  let bar: EditorSpeaker | undefined;
  for (const m of u.members) {
    if (m.channel === "CC") bar = speakerOf(m);
    else if (m.channel && (CHANNELS as string[]).includes(m.channel)) {
      slots[m.channel as Channel] = speakerOf(m);
    }
  }
  return { bar: bar ?? speakerOf(u.members[0]), slots };
}

function pairOf(u: BondUnit): EditorPair {
  const L = u.members.find((m) => m.channel === "LF") ?? u.members[0];
  const R = u.members.find((m) => m.channel === "RF") ?? u.members[1];
  const sub = u.members.find((m) => m.channel === "SW") ?? null;
  return {
    L: L ? speakerOf(L) : null,
    R: R ? speakerOf(R) : null,
    sub: sub ? speakerOf(sub) : null,
  };
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
      room = { key, name: area ?? u.name, area, ht: null, pairs: [], tray: [] };
      byKey.set(key, room);
      order.push(key);
    }
    if (u.kind === "home_theater") {
      const bar = u.members.find((m) => m.channel === "CC") ?? u.members[0];
      // A real home theater is a soundbar plus >=1 satellite. A single-member
      // "home theater", or one whose center is a sub, is a just-unbonded sub
      // masquerading -- never a soundbar; treat its members as loose speakers.
      if (isSub(bar?.model) || u.members.length <= 1) {
        for (const m of u.members) routeLoose(room, speakerOf(m));
      } else if (!room.ht) {
        // An area with two soundbars is unusual; keep the first, ignore extras.
        room.ht = htLayout(u);
      }
    } else if (u.kind === "stereo_pair") {
      room.pairs.push(pairOf(u));
    } else {
      for (const m of u.members) routeLoose(room, speakerOf(m));
    }
  }

  // Drop rooms left empty because their only speaker was a sub routed to the pool
  // (e.g. a lone unbonded sub whose zone name became a phantom room).
  const rooms = order
    .map((k) => byKey.get(k)!)
    .filter((r) => r.ht || r.pairs.length > 0 || r.tray.length > 0);
  for (const r of rooms) r.tray.sort(byName);
  rooms.sort(byName);
  if (availableSubs.length) {
    availableSubs.sort(byName);
    rooms.push({
      key: AVAILABLE_SUBS_KEY,
      name: "Available subs",
      area: null,
      ht: null,
      pairs: [],
      tray: availableSubs,
    });
  }
  return rooms;
}
