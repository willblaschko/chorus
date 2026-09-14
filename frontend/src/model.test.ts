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
  availableSpeakers,
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

const GRAPH: BondGraph = {
  units: [
    {
      primary_uid: "BAR",
      name: "Media Room",
      kind: "home_theater",
      members: [
        { uid: "BAR", channel: "CC", ip: "10.0.0.1", name: "Media Room", model: "Sonos Arc SL", invisible: false, is_primary: true },
        { uid: "S_LR", channel: "LR", ip: "10.0.0.2", name: "Media Room", model: "Symfonisk Frame", invisible: true, is_primary: false },
        { uid: "S_SW", channel: "SW", ip: "10.0.0.3", name: "Sub Mini", model: "Sonos Sub Mini", invisible: true, is_primary: false },
      ],
    },
    {
      primary_uid: "PL",
      name: "Bedroom",
      kind: "stereo_pair",
      members: [
        { uid: "PL", channel: "LF", ip: "10.0.0.4", name: "Bedroom", model: "Symfonisk Lamp", invisible: false, is_primary: true },
        { uid: "PR", channel: "RF", ip: "10.0.0.5", name: "Bedroom", model: "Symfonisk Lamp", invisible: true, is_primary: false },
      ],
    },
    {
      primary_uid: "SOLO",
      name: "Kitchen",
      kind: "standalone",
      members: [
        { uid: "SOLO", channel: null, ip: "10.0.0.6", name: "Kitchen", model: "Symfonisk Bookshelf", invisible: false, is_primary: true },
      ],
    },
  ],
  players: [],
};

describe("buildRooms", () => {
  it("maps a home theater unit to a room with channel slots", () => {
    const room = buildRooms(GRAPH).find((r) => r.name === "Media Room")!;
    expect(room.kind).toBe("home_theater");
    expect(room.bar?.model).toBe("Sonos Arc SL");
    expect(room.slots?.LR?.uid).toBe("S_LR");
    expect(room.slots?.SW?.name).toBe("Sub Mini");
    expect(room.slots?.LF).toBeNull(); // not bonded
  });

  it("maps a stereo pair to L/R", () => {
    const room = buildRooms(GRAPH).find((r) => r.name === "Bedroom")!;
    expect(room.kind).toBe("stereo_pair");
    expect(room.pairs?.[0].L?.uid).toBe("PL");
    expect(room.pairs?.[0].R?.uid).toBe("PR");
    expect(room.pairs?.[0].sub).toBeNull();
  });

  it("maps a standalone to a tray speaker", () => {
    const room = buildRooms(GRAPH).find((r) => r.name === "Kitchen")!;
    expect(room.kind).toBe("standalone");
    expect(room.tray?.map((s) => s.uid)).toEqual(["SOLO"]);
  });

  it("handles an empty/undefined graph", () => {
    expect(buildRooms(undefined)).toEqual([]);
    expect(buildRooms({ units: [], players: [] })).toEqual([]);
  });
});

describe("availableSpeakers", () => {
  it("returns only standalone speakers (the draggable pool)", () => {
    expect(availableSpeakers(GRAPH).map((s) => s.uid)).toEqual(["SOLO"]);
  });
});
