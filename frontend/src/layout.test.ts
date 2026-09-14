import { describe, it, expect } from "vitest";
import {
  roomsToLayout,
  assignToChannel,
  clearChannel,
  assignSubToChannel,
  createPair,
  separatePair,
  swapPair,
  dissolveHT,
  moveSpeaker,
  addSubToPair,
  removeSubFromPair,
  setupHT,
} from "./layout.js";
import { computeOps } from "./apply.js";
import { AVAILABLE_SUBS_KEY, type Room, type EditorSpeaker } from "./model.js";

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

  it("swapPair flips L and R", () => {
    const paired = createPair(mediaRoom(), "Media Room", "E1", "E2");
    const after = swapPair(paired, "Media Room", 0);
    expect(after[0].pairs[0].L?.uid).toBe("E2");
    expect(after[0].pairs[0].R?.uid).toBe("E1");
  });

  it("dissolveHT clears every channel back to the tray, bar stays", () => {
    const after = dissolveHT(mediaRoom(), "Media Room");
    expect(after[0].ht?.bar.uid).toBe("BAR");
    expect(after[0].ht?.slots.LR).toBeNull();
    expect(after[0].tray.some((s) => s.uid === "LR")).toBe(true);
  });

  it("moveSpeaker relocates a tray speaker to another room, creating it", () => {
    const after = moveSpeaker(mediaRoom(), "E1", "Kitchen");
    expect(after.find((r) => r.name === "Media Room")!.tray.some((s) => s.uid === "E1")).toBe(false);
    expect(after.find((r) => r.name === "Kitchen")!.tray.map((s) => s.uid)).toEqual(["E1"]);
  });
});

// Living Room: a stereo pair (no sub) plus a lone Sub and a lone Beam in the tray.
function pairRoom(): Room[] {
  return [
    {
      key: "Living Room",
      name: "Living Room",
      area: "Living Room",
      ht: null,
      pairs: [{ L: spk("PL", "Living Room", "Sonos Era 100"), R: spk("PR", "Living Room 2", "Sonos Era 100"), sub: null }],
      tray: [spk("SUB", "Living Room Sub", "Sonos Sub"), spk("BEAM", "Living Room Beam", "Sonos Beam")],
    },
  ];
}

describe("addSubToPair / removeSubFromPair", () => {
  it("moves a tray sub into the pair's .sub and out of the tray; input unchanged", () => {
    const before = pairRoom();
    const after = addSubToPair(before, "Living Room", 0, "SUB");
    expect(after[0].pairs[0].sub?.uid).toBe("SUB");
    expect(after[0].tray.some((s) => s.uid === "SUB")).toBe(false);
    // purity: input untouched
    expect(before[0].pairs[0].sub).toBeNull();
    expect(before[0].tray.map((s) => s.uid)).toEqual(["SUB", "BEAM"]);
  });

  it("is a no-op for a bad sub uid", () => {
    const after = addSubToPair(pairRoom(), "Living Room", 0, "NOPE");
    expect(after[0].pairs[0].sub).toBeNull();
    expect(after[0].tray.map((s) => s.uid)).toEqual(["SUB", "BEAM"]);
  });

  it("removeSubFromPair returns the pair's sub to the tray and nulls .sub", () => {
    const withSub = addSubToPair(pairRoom(), "Living Room", 0, "SUB");
    const after = removeSubFromPair(withSub, "Living Room", 0);
    expect(after[0].pairs[0].sub).toBeNull();
    expect(after[0].tray.some((s) => s.uid === "SUB")).toBe(true);
  });
});

describe("setupHT", () => {
  it("promotes a tray soundbar to an HT with five null slots, out of the tray", () => {
    const after = setupHT(pairRoom(), "Living Room", "BEAM");
    expect(after[0].ht?.bar.uid).toBe("BEAM");
    expect(after[0].ht?.slots).toEqual({ LF: null, RF: null, LR: null, RR: null, SW: null });
    expect(after[0].tray.some((s) => s.uid === "BEAM")).toBe(false);
  });

  it("is a no-op when the room already has an ht", () => {
    const after = setupHT(mediaRoom(), "Media Room", "E1");
    expect(after[0].ht?.bar.uid).toBe("BAR");
    expect(after[0].tray.some((s) => s.uid === "E1")).toBe(true);
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

describe("available subs — assign/clear across rooms", () => {
  const sub = (uid: string, name = "Sub Mini") => spk(uid, name, "Sonos Sub Mini");
  const htRoom = (key: string, sw: EditorSpeaker | null): Room => ({
    key,
    name: key,
    area: key,
    ht: { bar: spk(`${key}-BAR`, key, "Sonos Arc"), slots: { LF: null, RF: null, LR: null, RR: null, SW: sw } },
    pairs: [],
    tray: [],
  });
  const pool = (...subs: EditorSpeaker[]): Room => ({
    key: AVAILABLE_SUBS_KEY,
    name: "Available subs",
    area: null,
    ht: null,
    pairs: [],
    tray: subs,
  });

  it("assigns a pooled sub into a room's SW slot and empties (prunes) the pool", () => {
    const before = [htRoom("Media Room", null), pool(sub("SUB"))];
    const after = assignSubToChannel(before, "Media Room", "SUB");
    expect(after.find((r) => r.key === "Media Room")!.ht!.slots.SW?.uid).toBe("SUB");
    expect(after.some((r) => r.key === AVAILABLE_SUBS_KEY)).toBe(false);
  });

  it("assigning a pooled sub emits exactly one add_ht with the sw field", () => {
    const before = [htRoom("Media Room", null), pool(sub("SUB"))];
    const ops = computeOps(roomsToLayout(before), roomsToLayout(assignSubToChannel(before, "Media Room", "SUB")));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "add_ht" });
    expect(ops[0].service.data).toMatchObject({ soundbar: "Media Room-BAR", sw: "SUB" });
  });

  it("clearing a SW sends the sub to the available pool, NOT the room tray", () => {
    const before = [htRoom("Media Room", sub("SUB"))];
    const after = clearChannel(before, "Media Room", "SW");
    expect(after.find((r) => r.key === "Media Room")!.ht!.slots.SW).toBeNull();
    expect(after.find((r) => r.key === "Media Room")!.tray.some((s) => s.uid === "SUB")).toBe(false);
    expect(after.find((r) => r.key === AVAILABLE_SUBS_KEY)!.tray.map((s) => s.uid)).toEqual(["SUB"]);
  });

  it("clearing a SW then re-reading emits one remove_ht", () => {
    const before = [htRoom("Media Room", sub("SUB"))];
    const ops = computeOps(roomsToLayout(before), roomsToLayout(clearChannel(before, "Media Room", "SW")));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "remove_ht" });
  });

  it("moves a sub from one room's SW to another's (cross-room)", () => {
    const before = [htRoom("A", sub("SUB")), htRoom("B", null)];
    const after = assignSubToChannel(before, "B", "SUB");
    expect(after.find((r) => r.key === "A")!.ht!.slots.SW).toBeNull();
    expect(after.find((r) => r.key === "B")!.ht!.slots.SW?.uid).toBe("SUB");
  });

  it("displaces an existing sub back to the pool when a new one is assigned", () => {
    const before = [htRoom("Media Room", sub("OLD")), pool(sub("NEW"))];
    const after = assignSubToChannel(before, "Media Room", "NEW");
    expect(after.find((r) => r.key === "Media Room")!.ht!.slots.SW?.uid).toBe("NEW");
    expect(after.find((r) => r.key === AVAILABLE_SUBS_KEY)!.tray.map((s) => s.uid)).toEqual(["OLD"]);
  });
});
