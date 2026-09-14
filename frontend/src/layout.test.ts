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
  setupHT,
} from "./layout.js";
import { computeOps } from "./apply.js";
import { AVAILABLE_SUBS_KEY, setKind, type Room, type EditorSpeaker } from "./model.js";

const spk = (uid: string, name: string, model = "Sonos One"): EditorSpeaker => ({
  uid,
  name,
  model,
  ip: null,
});

// Media Room: an Arc home-theater SET (id "BAR") with only Rear-L bonded, plus two
// lone Era 300s in the tray.
const HT = "BAR";
function mediaRoom(): Room[] {
  return [
    {
      key: "Media Room",
      name: "Media Room",
      area: "Media Room",
      sets: [
        {
          id: HT,
          primary: spk("BAR", "Media Room", "Sonos Arc"),
          slots: { LR: spk("LR", "Media Room", "Symfonisk Frame") },
        },
      ],
      tray: [spk("E1", "Media Room 2", "Sonos Era 300"), spk("E2", "Media Room 3", "Sonos Era 300")],
    },
  ];
}
const htOf = (rooms: Room[], name = "Media Room") => rooms.find((r) => r.name === name)!.sets.find((s) => setKind(s) === "home_theater")!;
const pairOf = (rooms: Room[], name = "Media Room") => rooms.find((r) => r.name === name)!.sets.find((s) => setKind(s) === "stereo_pair")!;

describe("roomsToLayout", () => {
  it("maps a home-theater set to CC + channel placements anchored on the bar", () => {
    const m = roomsToLayout(mediaRoom());
    expect(m["BAR"]).toMatchObject({ room: "Media Room", role: "CC", anchorUid: "BAR" });
    expect(m["LR"]).toMatchObject({ role: "LR", anchorUid: "BAR", name: "Media Room" });
    expect(m["E1"]).toMatchObject({ role: "solo", anchorUid: "E1", name: "Media Room 2" });
  });

  it("maps a stereo-pair set to pairL/pairR anchored on the left uid", () => {
    const rooms: Room[] = [
      {
        key: "Bedroom",
        name: "Bedroom",
        area: "Bedroom",
        sets: [{ id: "PL", primary: spk("PL", "Bedroom"), slots: { RF: spk("PR", "Bedroom") } }],
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
    const after = assignToChannel(before, "Media Room", HT, "LF", "E1");
    expect(htOf(after).slots.LF?.uid).toBe("E1");
    expect(after[0].tray.map((s) => s.uid)).toEqual(["E2"]);
    // input untouched
    expect(htOf(before).slots.LF).toBeUndefined();
    expect(before[0].tray.map((s) => s.uid)).toEqual(["E1", "E2"]);
  });

  it("displaces the current occupant back to the tray", () => {
    const after = assignToChannel(mediaRoom(), "Media Room", HT, "LR", "E1");
    expect(htOf(after).slots.LR?.uid).toBe("E1");
    expect(after[0].tray.some((s) => s.uid === "LR")).toBe(true);
  });

  it("is a no-op when the speaker isn't in the room's tray", () => {
    const after = assignToChannel(mediaRoom(), "Media Room", HT, "LF", "NOPE");
    expect(htOf(after).slots.LF).toBeUndefined();
  });
});

describe("clearChannel / createPair / separatePair / swap / dissolve / move", () => {
  it("clearChannel returns the satellite to the tray", () => {
    const after = clearChannel(mediaRoom(), "Media Room", HT, "LR");
    expect(htOf(after).slots.LR).toBeUndefined();
    expect(after[0].tray.some((s) => s.uid === "LR")).toBe(true);
  });

  it("createPair consumes two tray speakers into a new pair set", () => {
    const after = createPair(mediaRoom(), "Media Room", "E1", "E2");
    expect(after[0].sets).toHaveLength(2); // the HT + the new pair
    const pair = pairOf(after);
    expect(pair.primary.uid).toBe("E1");
    expect(pair.slots.RF?.uid).toBe("E2");
    expect(after[0].tray).toHaveLength(0);
  });

  it("separatePair returns both halves to the tray", () => {
    const paired = createPair(mediaRoom(), "Media Room", "E1", "E2");
    const after = separatePair(paired, "Media Room", "E1");
    expect(after[0].sets.some((s) => setKind(s) === "stereo_pair")).toBe(false);
    expect(after[0].tray.map((s) => s.uid).sort()).toEqual(["E1", "E2"]);
  });

  it("swapPair flips primary and RF (id follows the new primary)", () => {
    const paired = createPair(mediaRoom(), "Media Room", "E1", "E2");
    const after = swapPair(paired, "Media Room", "E1");
    const pair = pairOf(after);
    expect(pair.primary.uid).toBe("E2");
    expect(pair.slots.RF?.uid).toBe("E1");
    expect(pair.id).toBe("E2");
  });

  it("dissolveHT clears channels to the tray and leaves the soundbar standalone", () => {
    const after = dissolveHT(mediaRoom(), "Media Room", HT);
    expect(after[0].sets).toHaveLength(0); // the HT set is gone
    expect(after[0].tray.some((s) => s.uid === "BAR")).toBe(true); // bar is standalone
    expect(after[0].tray.some((s) => s.uid === "LR")).toBe(true);
  });

  it("moveSpeaker relocates a tray speaker to another room, creating it", () => {
    const after = moveSpeaker(mediaRoom(), "E1", "Kitchen");
    expect(after.find((r) => r.name === "Media Room")!.tray.some((s) => s.uid === "E1")).toBe(false);
    expect(after.find((r) => r.name === "Kitchen")!.tray.map((s) => s.uid)).toEqual(["E1"]);
  });
});

// Living Room: a stereo-pair set (no sub) plus a lone Beam in the tray.
function pairRoom(): Room[] {
  return [
    {
      key: "Living Room",
      name: "Living Room",
      area: "Living Room",
      sets: [
        {
          id: "PL",
          primary: spk("PL", "Living Room", "Sonos Era 100"),
          slots: { RF: spk("PR", "Living Room 2", "Sonos Era 100") },
        },
      ],
      tray: [spk("BEAM", "Living Room Beam", "Sonos Beam")],
    },
  ];
}

describe("setupHT", () => {
  it("promotes a tray soundbar to an empty home-theater set, out of the tray", () => {
    const after = setupHT(pairRoom(), "Living Room", "BEAM");
    const ht = htOf(after, "Living Room");
    expect(ht.primary.uid).toBe("BEAM");
    expect(ht.slots).toEqual({});
    expect(after[0].tray.some((s) => s.uid === "BEAM")).toBe(false);
  });

  it("is a no-op when the uid isn't a tray speaker", () => {
    const after = setupHT(pairRoom(), "Living Room", "NOPE");
    expect(after[0].sets.some((s) => setKind(s) === "home_theater")).toBe(false);
  });
});

// The real contract: a location change -> the correct chorus.* service op.
describe("location change -> service op (via computeOps)", () => {
  const opsFor = (before: Room[], after: Room[]) =>
    computeOps(roomsToLayout(before), roomsToLayout(after));

  it("assigning a speaker to a channel emits one add_ht (set_home_theater)", () => {
    const before = mediaRoom();
    const ops = opsFor(before, assignToChannel(before, "Media Room", HT, "LF", "E1"));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "add_ht" });
    expect(ops[0].service.service).toBe("set_home_theater");
    expect(ops[0].service.data).toMatchObject({ soundbar: "BAR", lf: "E1" });
  });

  it("clearing a channel emits one remove_ht (remove_home_theater by channel)", () => {
    const before = mediaRoom();
    const ops = opsFor(before, clearChannel(before, "Media Room", HT, "LR"));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "remove_ht" });
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

describe("available subs — one SW path across HTs and pairs", () => {
  const sub = (uid: string, name = "Sub Mini") => spk(uid, name, "Sonos Sub Mini");
  const htRoom = (key: string, sw: EditorSpeaker | null): Room => ({
    key,
    name: key,
    area: key,
    sets: [{ id: `${key}-BAR`, primary: spk(`${key}-BAR`, key, "Sonos Arc"), slots: sw ? { SW: sw } : {} }],
    tray: [],
  });
  const pool = (...subs: EditorSpeaker[]): Room => ({
    key: AVAILABLE_SUBS_KEY,
    name: "Available subs",
    area: null,
    sets: [],
    tray: subs,
  });

  it("assigns a pooled sub into a home-theater SW slot and prunes the pool", () => {
    const before = [htRoom("Media Room", null), pool(sub("SUB"))];
    const after = assignSubToChannel(before, "Media Room", "Media Room-BAR", "SUB");
    expect(htOf(after).slots.SW?.uid).toBe("SUB");
    expect(after.some((r) => r.key === AVAILABLE_SUBS_KEY)).toBe(false);
  });

  it("assigning a pooled sub to an HT emits exactly one add_ht with the sw field", () => {
    const before = [htRoom("Media Room", null), pool(sub("SUB"))];
    const ops = computeOps(
      roomsToLayout(before),
      roomsToLayout(assignSubToChannel(before, "Media Room", "Media Room-BAR", "SUB"))
    );
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "add_ht" });
    expect(ops[0].service.data).toMatchObject({ soundbar: "Media Room-BAR", sw: "SUB" });
  });

  it("clearing an HT SW sends the sub to the available pool, NOT the room tray", () => {
    const before = [htRoom("Media Room", sub("SUB"))];
    const after = clearChannel(before, "Media Room", "Media Room-BAR", "SW");
    expect(htOf(after).slots.SW).toBeUndefined();
    expect(after.find((r) => r.name === "Media Room")!.tray.some((s) => s.uid === "SUB")).toBe(false);
    expect(after.find((r) => r.key === AVAILABLE_SUBS_KEY)!.tray.map((s) => s.uid)).toEqual(["SUB"]);
  });

  it("moves a sub from one home theater's SW to another's (cross-room)", () => {
    const before = [htRoom("A", sub("SUB")), htRoom("B", null)];
    const after = assignSubToChannel(before, "B", "B-BAR", "SUB");
    expect(htOf(after, "A").slots.SW).toBeUndefined();
    expect(htOf(after, "B").slots.SW?.uid).toBe("SUB");
  });

  it("displaces an existing sub back to the pool when a new one is assigned", () => {
    const before = [htRoom("Media Room", sub("OLD")), pool(sub("NEW"))];
    const after = assignSubToChannel(before, "Media Room", "Media Room-BAR", "NEW");
    expect(htOf(after).slots.SW?.uid).toBe("NEW");
    expect(after.find((r) => r.key === AVAILABLE_SUBS_KEY)!.tray.map((s) => s.uid)).toEqual(["OLD"]);
  });

  it("placing a sub on a PAIR set emits add_pair_sub (left/right/sub)", () => {
    const before = [pairRoom()[0], pool(sub("SUB"))];
    const after = assignSubToChannel(before, "Living Room", "PL", "SUB");
    expect(pairOf(after, "Living Room").slots.SW?.uid).toBe("SUB");
    const ops = computeOps(roomsToLayout(before), roomsToLayout(after));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "add_pair_sub" });
    expect(ops[0].service.data).toMatchObject({ left: "PL", right: "PR", sub: "SUB" });
  });

  it("removing a sub from a PAIR set emits remove_pair_sub", () => {
    const withSub = [pairRoom()[0], pool(sub("SUB"))];
    const bonded = assignSubToChannel(withSub, "Living Room", "PL", "SUB");
    const after = clearChannel(bonded, "Living Room", "PL", "SW");
    const ops = computeOps(roomsToLayout(bonded), roomsToLayout(after));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "remove_pair_sub" });
    expect(ops[0].service.data).toMatchObject({ left: "PL", right: "PR", sub: "SUB" });
  });
});
