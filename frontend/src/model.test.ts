import { describe, it, expect } from "vitest";
import {
  speakerKind,
  isBar,
  isSub,
  canSurround,
  canPair,
  hasHeight,
  positionAccepts,
  buildRooms,
} from "./model.js";
import type { BondGraph } from "./types.js";

describe("capability registry", () => {
  it("classifies soundbars as primaries", () => {
    expect(isBar("Sonos Arc")).toBe(true);
    expect(isBar("Sonos Arc SL")).toBe(true);
    expect(isBar("Sonos Beam")).toBe(true);
    expect(isBar("Sonos Ray")).toBe(true);
    expect(isBar("Sonos Sub Mini")).toBe(false);
  });

  it("classifies subs", () => {
    expect(isSub("Sonos Sub Mini")).toBe(true);
    expect(isSub("Sonos Sub")).toBe(true);
    expect(isSub("Sonos Era 300")).toBe(false);
  });

  it("marks surround/pair capable speakers", () => {
    for (const m of ["Sonos Era 300", "Sonos Era 100", "Symfonisk Bookshelf", "Symfonisk Lamp"]) {
      expect(canSurround(m)).toBe(true);
      expect(canPair(m)).toBe(true);
    }
  });

  it("gates height to the Era 300 family", () => {
    expect(hasHeight("Sonos Era 300")).toBe(true);
    expect(hasHeight("Sonos Era 100")).toBe(false);
    expect(hasHeight("Sonos Arc")).toBe(false);
  });

  it("degrades unknown models to a generic home speaker", () => {
    const caps = speakerKind("Sonos Future 9000");
    expect(caps.primary).toBeFalsy();
    expect(caps.sub).toBeFalsy();
    expect(caps.surround).toBe(true);
    expect(caps.pair).toBe(true);
    expect(speakerKind("").surround).toBe(true);
  });

  it("gates home-theater positions by capability", () => {
    expect(positionAccepts("SW", "Sonos Sub Mini")).toBe(true);
    expect(positionAccepts("SW", "Sonos Era 300")).toBe(false); // only a sub in the sub slot
    expect(positionAccepts("LR", "Sonos Era 300")).toBe(true);
    expect(positionAccepts("LR", "Sonos Sub Mini")).toBe(false); // a sub isn't a surround
  });
});

// A system where the "Media Room" HA Area holds a home theater AND a lone Era 300;
// the Bedroom area a pair; Kitchen a lone speaker; and one speaker with no area.
const GRAPH: BondGraph = {
  areas: ["Bedroom", "Kitchen", "Media Room"],
  units: [
    {
      primary_uid: "BAR",
      name: "Media Room",
      kind: "home_theater",
      members: [
        { uid: "BAR", channel: "CC", ip: "10.0.0.1", name: "Media Room", model: "Sonos Arc SL", area: "Media Room", invisible: false, is_primary: true },
        { uid: "S_LR", channel: "LR", ip: "10.0.0.2", name: "Media Room", model: "Symfonisk Frame", area: "Media Room", invisible: true, is_primary: false },
        { uid: "S_SW", channel: "SW", ip: "10.0.0.3", name: "Sub Mini", model: "Sonos Sub Mini", area: "Media Room", invisible: true, is_primary: false },
      ],
    },
    {
      primary_uid: "ERA",
      name: "Media Room 2",
      kind: "standalone",
      members: [
        { uid: "ERA", channel: null, ip: "10.0.0.7", name: "Media Room 2", model: "Sonos Era 300", area: "Media Room", invisible: false, is_primary: true },
      ],
    },
    {
      primary_uid: "PL",
      name: "Bedroom",
      kind: "stereo_pair",
      members: [
        { uid: "PL", channel: "LF", ip: "10.0.0.4", name: "Bedroom", model: "Symfonisk Lamp", area: "Bedroom", invisible: false, is_primary: true },
        { uid: "PR", channel: "RF", ip: "10.0.0.5", name: "Bedroom", model: "Symfonisk Lamp", area: "Bedroom", invisible: true, is_primary: false },
      ],
    },
    {
      primary_uid: "SOLO",
      name: "Kitchen",
      kind: "standalone",
      members: [
        { uid: "SOLO", channel: null, ip: "10.0.0.6", name: "Kitchen", model: "Symfonisk Bookshelf", area: "Kitchen", invisible: false, is_primary: true },
      ],
    },
    {
      primary_uid: "NOAREA",
      name: "Garage Speaker",
      kind: "standalone",
      members: [
        { uid: "NOAREA", channel: null, ip: "10.0.0.8", name: "Garage Speaker", model: "Sonos One", area: null, invisible: false, is_primary: true },
      ],
    },
  ],
  players: [],
};

const room = (name: string) => buildRooms(GRAPH).find((r) => r.name === name)!;

describe("buildRooms — group by HA Area", () => {
  it("puts the home theater and a lone speaker from the SAME area in one room", () => {
    const r = room("Media Room");
    expect(r.area).toBe("Media Room");
    expect(r.ht).not.toBeNull();
    expect(r.ht!.bar.model).toBe("Sonos Arc SL");
    expect(r.ht!.slots.LR?.uid).toBe("S_LR");
    expect(r.ht!.slots.SW?.name).toBe("Sub Mini");
    expect(r.ht!.slots.LF).toBeNull();
    // the lone Era 300 in the SAME area is the room's available pool
    expect(r.tray.map((s) => s.uid)).toEqual(["ERA"]);
  });

  it("scopes available speakers to the room's area (no cross-area bleed)", () => {
    // Kitchen's speaker must NOT appear in Media Room's tray, and vice versa.
    expect(room("Media Room").tray.some((s) => s.uid === "SOLO")).toBe(false);
    expect(room("Kitchen").tray.map((s) => s.uid)).toEqual(["SOLO"]);
    expect(room("Kitchen").ht).toBeNull();
  });

  it("groups a stereo pair under its area", () => {
    const r = room("Bedroom");
    expect(r.pairs).toHaveLength(1);
    expect(r.pairs[0].L?.uid).toBe("PL");
    expect(r.pairs[0].R?.uid).toBe("PR");
    expect(r.pairs[0].sub).toBeNull();
  });

  it("falls back to the zone name when a speaker has no area", () => {
    const r = room("Garage Speaker");
    expect(r.area).toBeNull();
    expect(r.tray.map((s) => s.uid)).toEqual(["NOAREA"]);
  });

  it("returns rooms alpha-sorted and handles an empty graph", () => {
    const names = buildRooms(GRAPH).map((r) => r.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(buildRooms(undefined)).toEqual([]);
    expect(buildRooms({ units: [], players: [] })).toEqual([]);
  });
});
