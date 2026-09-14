import { describe, it, expect } from "vitest";
import {
  roomsToLayout,
  assignToChannel,
  clearChannel,
  createPair,
  separatePair,
} from "./layout.js";
import { computeOps } from "./apply.js";
import type { Room, EditorSpeaker } from "./model.js";

const spk = (uid: string, name: string, model = "Sonos One"): EditorSpeaker => ({
  uid,
  name,
  model,
  ip: null,
});

// Media Room area: an Arc HT with only Rear-L bonded, plus two lone Era 300s.
function mediaRoom(): Room[] {
  return [
    {
      key: "Media Room",
      name: "Media Room",
      area: "Media Room",
      ht: {
        bar: spk("BAR", "Media Room", "Sonos Arc"),
        slots: {
          LF: null,
          RF: null,
          LR: spk("LR", "Media Room", "Symfonisk Frame"),
          RR: null,
          SW: null,
        },
      },
      pairs: [],
      tray: [spk("E1", "Media Room 2", "Sonos Era 300"), spk("E2", "Media Room 3", "Sonos Era 300")],
    },
  ];
}

describe("roomsToLayout", () => {
  it("maps a home theater to CC + channel placements anchored on the bar", () => {
    const m = roomsToLayout(mediaRoom());
    expect(m["BAR"]).toMatchObject({ room: "Media Room", role: "CC", anchorUid: "BAR" });
    expect(m["LR"]).toMatchObject({ role: "LR", anchorUid: "BAR", name: "Media Room" });
    expect(m["E1"]).toMatchObject({ role: "solo", anchorUid: "E1", name: "Media Room 2" });
  });

  it("maps a stereo pair to pairL/pairR anchored on the left uid", () => {
    const rooms: Room[] = [
      {
        key: "Bedroom",
        name: "Bedroom",
        area: "Bedroom",
        ht: null,
        pairs: [{ L: spk("PL", "Bedroom"), R: spk("PR", "Bedroom"), sub: null }],
        tray: [],
      },
    ];
    const m = roomsToLayout(rooms);
    expect(m["PL"]).toMatchObject({ role: "pairL", anchorUid: "PL" });
    expect(m["PR"]).toMatchObject({ role: "pairR", anchorUid: "PL" });
  });
});

describe("assignToChannel", () => {
  it("moves a tray speaker onto an empty channel and is pure", () => {
    const before = mediaRoom();
    const after = assignToChannel(before, "Media Room", "LF", "E1");
    expect(after[0].ht!.slots.LF?.uid).toBe("E1");
    expect(after[0].tray.map((s) => s.uid)).toEqual(["E2"]);
    // input untouched
    expect(before[0].ht!.slots.LF).toBeNull();
    expect(before[0].tray.map((s) => s.uid)).toEqual(["E1", "E2"]);
  });

  it("displaces the current occupant back to the tray", () => {
    const after = assignToChannel(mediaRoom(), "Media Room", "LR", "E1");
    expect(after[0].ht!.slots.LR?.uid).toBe("E1");
    expect(after[0].tray.some((s) => s.uid === "LR")).toBe(true);
  });

  it("is a no-op when the speaker isn't in the room's tray", () => {
    const after = assignToChannel(mediaRoom(), "Media Room", "LF", "NOPE");
    expect(after[0].ht!.slots.LF).toBeNull();
  });
});

describe("clearChannel / createPair / separatePair", () => {
  it("clearChannel returns the satellite to the tray", () => {
    const after = clearChannel(mediaRoom(), "Media Room", "LR");
    expect(after[0].ht!.slots.LR).toBeNull();
    expect(after[0].tray.some((s) => s.uid === "LR")).toBe(true);
  });

  it("createPair consumes two tray speakers into a pair", () => {
    const after = createPair(mediaRoom(), "Media Room", "E1", "E2");
    expect(after[0].pairs).toHaveLength(1);
    expect(after[0].pairs[0].L?.uid).toBe("E1");
    expect(after[0].pairs[0].R?.uid).toBe("E2");
    expect(after[0].tray).toHaveLength(0);
  });

  it("separatePair returns both halves to the tray", () => {
    const paired = createPair(mediaRoom(), "Media Room", "E1", "E2");
    const after = separatePair(paired, "Media Room", 0);
    expect(after[0].pairs).toHaveLength(0);
    expect(after[0].tray.map((s) => s.uid).sort()).toEqual(["E1", "E2"]);
  });
});

// The real contract: a location change -> the correct chorus.* service op.
describe("location change -> service op (via computeOps)", () => {
  const opsFor = (before: Room[], after: Room[]) =>
    computeOps(roomsToLayout(before), roomsToLayout(after));

  it("assigning a speaker to a channel emits one add_ht (set_home_theater)", () => {
    const before = mediaRoom();
    const ops = opsFor(before, assignToChannel(before, "Media Room", "LF", "E1"));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "add_ht" });
    expect(ops[0].service.service).toBe("set_home_theater");
    expect(ops[0].service.data).toMatchObject({ soundbar: "BAR", lf: "E1" });
  });

  it("clearing a channel emits one remove_ht (remove_home_theater by channel)", () => {
    const before = mediaRoom();
    const ops = opsFor(before, clearChannel(before, "Media Room", "LR"));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "remove_ht" });
    expect(ops[0].service.service).toBe("remove_home_theater");
    expect(ops[0].service.data).toMatchObject({ soundbar: "BAR", channel: "LR" });
  });

  it("creating a pair emits one create_pair (create_stereo_pair)", () => {
    const before = mediaRoom();
    const ops = opsFor(before, createPair(before, "Media Room", "E1", "E2"));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "create_pair" });
    expect(ops[0].service.data).toMatchObject({ left: "E1", right: "E2" });
  });

  it("no edit -> no ops", () => {
    const before = mediaRoom();
    expect(opsFor(before, mediaRoom())).toEqual([]);
  });
});
