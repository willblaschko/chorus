import { describe, it, expect } from "vitest";
import { parseRoute, buildPath } from "./route.js";

describe("parseRoute", () => {
  it("defaults empty/root to the editor with no room", () => {
    for (const p of ["", "/", "//"]) {
      expect(parseRoute(p)).toEqual({ view: "editor", room: undefined });
    }
  });

  it("reads /overview", () => {
    expect(parseRoute("/overview")).toEqual({ view: "overview", room: undefined });
  });

  it("reads /editor/<room> and decodes the room id", () => {
    expect(parseRoute("/editor/media_room")).toEqual({ view: "editor", room: "media_room" });
    expect(parseRoute("/editor/living%20room")).toEqual({ view: "editor", room: "living room" });
  });

  it("treats an unknown first segment as the editor", () => {
    expect(parseRoute("/wat")).toEqual({ view: "editor", room: undefined });
  });

  it("ignores a room segment under overview", () => {
    expect(parseRoute("/overview/media_room")).toEqual({ view: "overview", room: undefined });
  });
});

describe("buildPath", () => {
  it("builds the editor and overview paths", () => {
    expect(buildPath("editor")).toBe("/editor");
    expect(buildPath("overview")).toBe("/overview");
  });

  it("appends and encodes the editor room", () => {
    expect(buildPath("editor", "media_room")).toBe("/editor/media_room");
    expect(buildPath("editor", "living room")).toBe("/editor/living%20room");
  });

  it("never attaches a room to overview", () => {
    expect(buildPath("overview", "media_room")).toBe("/overview");
  });
});

describe("parseRoute <-> buildPath round-trip", () => {
  it("survives a round-trip for representative routes", () => {
    const cases: Array<[import("./route.js").View, string | undefined]> = [
      ["editor", undefined],
      ["editor", "media_room"],
      ["editor", "living room"],
      ["overview", undefined],
    ];
    for (const [view, room] of cases) {
      expect(parseRoute(buildPath(view, room))).toEqual({ view, room });
    }
  });
});
