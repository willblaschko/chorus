import { describe, it, expect } from "vitest";
import {
  roomsToLayout,
  assignToChannel,
  clearChannel,
  assignSubToChannel,
  bondSubToSpeaker,
  createPair,
  separatePair,
  swapPair,
  dissolveHT,
  moveSpeaker,
  renameSpeaker,
  setupHT,
  dedupeRoomNames,
  dedupeAllRooms,
} from "./layout.js";
import { computeOps, planLanes } from "./apply.js";
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
          name: "Media Room",
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
        sets: [{ id: "PL", name: "Bedroom", primary: spk("PL", "Bedroom"), slots: { RF: spk("PR", "Bedroom") } }],
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
          name: "Living Room",
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

  it("clearing a channel emits a remove_ht + renames the freed satellite (World B)", () => {
    const before = mediaRoom();
    const ops = opsFor(before, clearChannel(before, "Media Room", HT, "LR"));
    const remove = ops.find((o) => o.type === "remove_ht")!;
    expect(remove).toBeTruthy();
    expect(remove.service.data).toMatchObject({ soundbar: "BAR", channel: "LR" });
    // The freed satellite becomes its own zone -> a room-derived rename op accompanies it.
    expect(ops.some((o) => o.type === "rename" && o.service.data.speaker === "LR")).toBe(true);
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

  it("move two speakers to a room, THEN pair them: 3 ops (move, move, pair) in order", () => {
    const before: Room[] = [
      { key: "A", name: "A", area: "A", sets: [], tray: [spk("S1", "A")] },
      { key: "B", name: "B", area: "B", sets: [], tray: [spk("S2", "B")] },
    ];
    const m1 = moveSpeaker(before, "S1", "Living Room");
    const m2 = moveSpeaker(m1, "S2", "Living Room");
    const paired = createPair(m2, "Living Room", "S1", "S2");
    const ops = opsFor(before, paired);
    // Before the fix the two moves were dropped (S1/S2 ended as pairL/pairR, not solo)
    // and the pair formed in a starting room. Now: move, move, pair.
    expect(ops.filter((o) => o.type === "move")).toHaveLength(2);
    expect(ops.filter((o) => o.type === "create_pair")).toHaveLength(1);
    expect(ops).toHaveLength(3);
    const lane = planLanes(ops).find((l) => l.some((o) => o.type === "create_pair"))!;
    const lastMove = Math.max(...lane.map((o, i) => (o.type === "move" ? i : -1)));
    expect(lastMove).toBeLessThan(lane.findIndex((o) => o.type === "create_pair"));
  });

  it("staging a rename emits a single rename op", () => {
    const before = mediaRoom();
    const renamed = renameSpeaker(before, "E1", "Kitchen Speaker");
    const ops = opsFor(before, renamed);
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "rename" });
    expect(ops[0].service.data).toMatchObject({ speaker: "E1", name: "Kitchen Speaker" });
  });

  it("separate a pair AND move a half to another room emits BOTH ops (the bug)", () => {
    const before: Room[] = [
      {
        key: "Guest Bedroom",
        name: "Guest Bedroom",
        area: "Guest Bedroom",
        sets: [{ id: "L", name: "Guest Bedroom", primary: spk("L", "Guest Bedroom"), slots: { RF: spk("R", "Guest Bedroom") } }],
        tray: [],
      },
    ];
    const separated = separatePair(before, "Guest Bedroom", "L"); // L + R fall to the tray
    const moved = moveSpeaker(separated, "L", "Office"); // then move L to Office
    const ops = opsFor(before, moved);
    // Before the fix this only emitted the separate — the move was dropped because L
    // started as pairL (not solo).
    expect(ops.some((o) => o.type === "separate")).toBe(true);
    const move = ops.find((o) => o.type === "move");
    expect(move).toBeTruthy();
    expect(move!.service.data).toMatchObject({ speaker: "L", name: "Office" });
    // the move must run AFTER the separate within the (shared) lane
    const lane = planLanes(ops).find((l) => l.some((o) => o.type === "move"))!;
    expect(lane.findIndex((o) => o.type === "separate")).toBeLessThan(
      lane.findIndex((o) => o.type === "move")
    );
  });
});

// World B: a zone's Sonos name FOLLOWS its room. The name lives on the SET (one zone,
// one name), so swapping L/R never changes it; moving/bonding adopts the room name,
// disambiguated "Room 2/3…"; separating restores the coordinator's name and gives the
// freed half a room-derived name.
describe("World B naming — name follows room", () => {
  const opsFor = (before: Room[], after: Room[]) =>
    computeOps(roomsToLayout(before), roomsToLayout(after));

  // A pair in "Guest Bedroom" whose RIGHT half still carries a stale, foreign name
  // ("Front Porch") — the exact shape that used to make a swap rename the whole pair.
  const stalePair = (): Room[] => [
    {
      key: "Guest Bedroom",
      name: "Guest Bedroom",
      area: "Guest Bedroom",
      sets: [
        {
          id: "L",
          name: "Guest Bedroom",
          primary: spk("L", "Guest Bedroom"),
          slots: { RF: spk("R", "Front Porch") },
        },
      ],
      tray: [],
    },
  ];

  it("swapping L/R keeps the set's name (never adopts the satellite's stale name)", () => {
    const swapped = swapPair(stalePair(), "Guest Bedroom", "L");
    const layout = roomsToLayout(swapped);
    // R is now the coordinator (pairL) but the zone is STILL named after the set/room.
    expect(layout["R"]).toMatchObject({ role: "pairL", name: "Guest Bedroom" });
    // And crucially: no op renames the pair to the satellite's old name.
    const ops = opsFor(stalePair(), swapped);
    expect(ops.every((o) => o.service.data.name !== "Front Porch")).toBe(true);
  });

  it("creating a pair adopts the room name, disambiguated when the room has another set", () => {
    // "Den" already holds a home theater named "Den"; a new pair of two loose speakers
    // must become "Den 2", not collide on "Den".
    const before: Room[] = [
      {
        key: "Den",
        name: "Den",
        area: "Den",
        sets: [{ id: "BAR", name: "Den", primary: spk("BAR", "Den", "Sonos Arc"), slots: { LR: spk("LR", "Den", "Sonos One") } }],
        tray: [spk("X", "X"), spk("Y", "Y")],
      },
    ];
    const paired = createPair(before, "Den", "X", "Y");
    expect(roomsToLayout(paired)["X"]).toMatchObject({ role: "pairL", name: "Den 2" });
  });

  it("moving a speaker renames its zone to the destination room", () => {
    const before: Room[] = [{ key: "A", name: "A", area: "A", sets: [], tray: [spk("S1", "A")] }];
    const moved = moveSpeaker(before, "S1", "Den");
    const s1 = moved.find((r) => r.name === "Den")!.tray.find((s) => s.uid === "S1")!;
    expect(s1.name).toBe("Den");
    // the move op carries the room-derived name
    const ops = opsFor(before, moved);
    expect(ops.find((o) => o.type === "move")!.service.data).toMatchObject({ name: "Den" });
  });

  it("separating a pair keeps the coordinator's name and gives the other half 'Room 2'", () => {
    const separated = separatePair(stalePair(), "Guest Bedroom", "L");
    const names = separated.find((r) => r.name === "Guest Bedroom")!.tray.map((s) => s.name).sort();
    expect(names).toEqual(["Guest Bedroom", "Guest Bedroom 2"]);
  });

  it("a freed HT satellite takes a room-derived name", () => {
    // Media Room already holds the Arc HT "Media Room" plus loose "Media Room 2"/"Media
    // Room 3" in the tray, so the freed Rear-L satellite takes the next free slot.
    const cleared = clearChannel(mediaRoom(), "Media Room", HT, "LR");
    const freed = cleared.find((r) => r.name === "Media Room")!.tray.find((s) => s.uid === "LR")!;
    expect(freed.name).toBe("Media Room 4");
  });
});

describe("available subs — one SW path across HTs and pairs", () => {
  const sub = (uid: string, name = "Sub Mini") => spk(uid, name, "Sonos Sub Mini");
  const htRoom = (key: string, sw: EditorSpeaker | null): Room => ({
    key,
    name: key,
    area: key,
    sets: [{ id: `${key}-BAR`, name: key, primary: spk(`${key}-BAR`, key, "Sonos Arc"), slots: sw ? { SW: sw } : {} }],
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

  it("bonding a sub to a LONE speaker emits add_pair_sub with NO right", () => {
    const before: Room[] = [
      { key: "Office", name: "Office", area: "Office", sets: [], tray: [spk("OFF", "Office", "Sonos Era 100")] },
      pool(sub("SUB")),
    ];
    const after = bondSubToSpeaker(before, "Office", "OFF", "SUB");
    const set = after.find((r) => r.name === "Office")!.sets[0];
    expect(setKind(set)).toBe("speaker");
    expect(set.slots.SW?.uid).toBe("SUB");
    const ops = computeOps(roomsToLayout(before), roomsToLayout(after));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "add_pair_sub" });
    expect(ops[0].service.data).toMatchObject({ left: "OFF", sub: "SUB" });
    expect(ops[0].service.data).not.toHaveProperty("right");
  });

  it("removing a sub from a speaker+sub set emits remove_pair_sub with NO right", () => {
    const start: Room[] = [
      { key: "Office", name: "Office", area: "Office", sets: [], tray: [spk("OFF", "Office", "Sonos Era 100")] },
      pool(sub("SUB")),
    ];
    const bonded = bondSubToSpeaker(start, "Office", "OFF", "SUB");
    const after = separatePair(bonded, "Office", "OFF"); // dissolves the speaker+sub set
    const ops = computeOps(roomsToLayout(bonded), roomsToLayout(after));
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "remove_pair_sub" });
    expect(ops[0].service.data).toMatchObject({ left: "OFF", sub: "SUB" });
    expect(ops[0].service.data).not.toHaveProperty("right");
  });
});

describe("dedupeRoomNames", () => {
  const mediaRoom = (): any => [
    {
      key: "media_room",
      name: "Media Room",
      area: "Media Room",
      sets: [{ id: "BAR", name: "Media Room", primary: { uid: "BAR" }, slots: {} }],
      tray: [
        { uid: "A", name: "Media Room 2" },
        { uid: "B", name: "Media Room 2" }, // collides with A
      ],
    },
  ];

  it("bumps a colliding tray speaker to the next free name, keeping unique ones", () => {
    const room = dedupeRoomNames(mediaRoom(), "media_room")[0];
    const names = [...room.sets.map((s: any) => s.name), ...room.tray.map((sp: any) => sp.name)];
    expect(new Set(names).size).toBe(3); // no more collisions
    expect(room.sets[0].name).toBe("Media Room"); // the set keeps its name
    const byUid = Object.fromEntries(room.tray.map((sp: any) => [sp.uid, sp.name]));
    expect(byUid.A).toBe("Media Room 2"); // first (by uid) keeps it
    expect(byUid.B).toBe("Media Room 3"); // the duplicate is bumped
  });

  it("leaves an already-unique room untouched", () => {
    const rooms: any = [
      {
        key: "den",
        name: "Den",
        area: "Den",
        sets: [],
        tray: [
          { uid: "A", name: "Den" },
          { uid: "B", name: "Den 2" },
        ],
      },
    ];
    const room = dedupeRoomNames(rooms, "den")[0];
    expect(room.tray.map((sp: any) => sp.name)).toEqual(["Den", "Den 2"]);
  });

  it("dedupeAllRooms fixes every room and leaves clean rooms alone", () => {
    const rooms: any = [
      { key: "a", name: "A", area: "A", sets: [], tray: [{ uid: "1", name: "A" }, { uid: "2", name: "A" }] },
      { key: "b", name: "B", area: "B", sets: [], tray: [{ uid: "3", name: "B" }, { uid: "4", name: "B 2" }] },
    ];
    const out = dedupeAllRooms(rooms);
    const a = out.find((r: any) => r.key === "a")!;
    const b = out.find((r: any) => r.key === "b")!;
    expect(a.tray.map((s: any) => s.name)).toEqual(["A", "A 2"]); // collision fixed
    expect(b.tray.map((s: any) => s.name)).toEqual(["B", "B 2"]); // already unique — untouched
  });
});

describe("moving + naming never collide", () => {
  it("a speaker moved into a room whose name is taken gets a de-duped name", () => {
    const rooms: any = [
      {
        key: "media_room",
        name: "Media Room",
        area: "Media Room",
        sets: [{ id: "BAR", name: "Media Room", primary: { uid: "BAR" }, slots: {} }],
        tray: [],
      },
      {
        key: "office",
        name: "Office",
        area: "Office",
        sets: [],
        tray: [{ uid: "SPK", name: "Office", model: "Sonos One" }],
      },
    ];
    const mr = moveSpeaker(rooms, "SPK", "Media Room").find((r: any) => r.name === "Media Room")!;
    const spk = mr.tray.find((s: any) => s.uid === "SPK")!;
    expect(spk.name).toBe("Media Room 2"); // not "Media Room" — de-duped against the HT
    const names = [...mr.sets.map((s: any) => s.name), ...mr.tray.map((s: any) => s.name)];
    expect(new Set(names).size).toBe(names.length); // no collision in the room
  });

  it("a second speaker moved into the same room takes the next free number", () => {
    const rooms: any = [
      {
        key: "media_room",
        name: "Media Room",
        area: "Media Room",
        sets: [{ id: "BAR", name: "Media Room", primary: { uid: "BAR" }, slots: {} }],
        tray: [{ uid: "A", name: "Media Room 2" }],
      },
      {
        key: "office",
        name: "Office",
        area: "Office",
        sets: [],
        tray: [{ uid: "B", name: "Office" }],
      },
    ];
    const mr = moveSpeaker(rooms, "B", "Media Room").find((r: any) => r.name === "Media Room")!;
    const b = mr.tray.find((s: any) => s.uid === "B")!;
    expect(b.name).toBe("Media Room 3"); // "Media Room" + "Media Room 2" taken -> 3
  });
});
