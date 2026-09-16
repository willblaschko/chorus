// Pure URL <-> view/room mapping for the panel's deep links.
// Kept free of Lit/DOM so it's unit-testable (see route.test.ts). The panel owns
// the side effects (pushState, location-changed, reading window.location).

export type View = "editor" | "overview";

export interface Route {
  view: View;
  room?: string;
}

/** Parse a panel-relative sub-path ("/editor/media_room", "/overview", "") into a Route.
 *  Anything that isn't "/overview" resolves to the editor (the default view). A room only
 *  attaches to the editor; "/overview/foo" ignores the trailing segment. */
export function parseRoute(path: string): Route {
  const parts = (path || "").split("/").filter(Boolean);
  const view: View = parts[0] === "overview" ? "overview" : "editor";
  const room =
    parts[0] === "editor" && parts[1] ? decodeURIComponent(parts[1]) : undefined;
  return { view, room };
}

/** Build the panel-relative sub-path for a view/room (inverse of parseRoute).
 *  Only the editor carries a room; the room segment is URL-encoded. */
export function buildPath(view: View, room?: string): string {
  let path = `/${view}`;
  if (view === "editor" && room) path += `/${encodeURIComponent(room)}`;
  return path;
}
