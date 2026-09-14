// Editor data model: capability registry + bond-graph -> editable rooms.
// Pure functions (no DOM, no hass) so they're unit-testable and reused by the UI.

import type { BondGraph, BondUnit, UnitKind } from "./types.js";

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

export interface Room {
  key: string; // stable id (the primary uid)
  name: string;
  kind: UnitKind;
  bar?: EditorSpeaker; // home theater only
  slots?: Record<Channel, EditorSpeaker | null>; // home theater only
  pairs?: EditorPair[]; // stereo_pair / standalone container
  tray?: EditorSpeaker[]; // solo speakers living in this room
}

function speakerOf(m: {
  uid: string;
  name: string | null;
  model?: string;
  ip: string | null;
}): EditorSpeaker {
  return { uid: m.uid, name: m.name || m.uid, model: m.model || "", ip: m.ip };
}

/** Build the editor's room list from the live bond graph. */
export function buildRooms(graph: BondGraph | undefined): Room[] {
  const units = graph?.units ?? [];
  return units
    .map((u) => unitToRoom(u))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

function unitToRoom(u: BondUnit): Room {
  if (u.kind === "home_theater") {
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
    return { key: u.primary_uid, name: u.name, kind: u.kind, bar, slots, tray: [] };
  }
  if (u.kind === "stereo_pair") {
    const L = u.members.find((m) => m.channel === "LF") ?? u.members[0];
    const R = u.members.find((m) => m.channel === "RF") ?? u.members[1];
    const sub = u.members.find((m) => m.channel === "SW") ?? null;
    return {
      key: u.primary_uid,
      name: u.name,
      kind: u.kind,
      pairs: [
        {
          L: L ? speakerOf(L) : null,
          R: R ? speakerOf(R) : null,
          sub: sub ? speakerOf(sub) : null,
        },
      ],
      tray: [],
    };
  }
  // standalone
  return {
    key: u.primary_uid,
    name: u.name,
    kind: u.kind,
    pairs: [],
    tray: u.members.map(speakerOf),
  };
}

/** Every standalone speaker on the system — the pool that can be dragged into a layout. */
export function availableSpeakers(graph: BondGraph | undefined): EditorSpeaker[] {
  const units = graph?.units ?? [];
  const out: EditorSpeaker[] = [];
  for (const u of units) {
    if (u.kind === "standalone") for (const m of u.members) out.push(speakerOf(m));
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
