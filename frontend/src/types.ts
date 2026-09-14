// Shared types for the Chorus panel.

/** The slice of Home Assistant's frontend API the panel uses. */
export interface HomeAssistant {
  connection: {
    sendMessagePromise<T>(msg: Record<string, unknown>): Promise<T>;
  };
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>
  ): Promise<unknown>;
  language?: string;
  themes?: unknown;
}

export type UnitKind = "home_theater" | "stereo_pair" | "standalone";

/** One speaker within a bonded unit, as parsed from ZoneGroupState. */
export interface BondMember {
  uid: string;
  channel: string | null; // CC / LF / RF / LR / RR / SW, or null for a standalone
  ip: string | null;
  name: string | null;
  model?: string;
  invisible: boolean;
  is_primary: boolean;
}

/** A standalone speaker, a stereo pair, or a home theater. */
export interface BondUnit {
  primary_uid: string;
  name: string;
  kind: UnitKind;
  members: BondMember[];
}

export interface BondPlayer {
  uid: string;
  ip: string;
  name: string;
  model: string;
}

/** Result of the chorus/bond_graph websocket command. */
export interface BondGraph {
  units: BondUnit[];
  players: BondPlayer[];
}
