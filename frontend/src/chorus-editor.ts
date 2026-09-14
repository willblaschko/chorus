import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { BondGraph } from "./types.js";
import {
  buildRooms,
  availableSpeakers,
  CHANNELS,
  CHANNEL_NAME,
  type Channel,
  type Room,
  type EditorSpeaker,
} from "./model.js";
import { iconFor, shortModel } from "./icons.js";
import { TV_ART, COUCH_ART } from "./art.js";

const KIND_LABEL: Record<string, string> = {
  home_theater: "Home theater",
  stereo_pair: "Stereo pair",
  standalone: "Standalone",
};

// Channel -> tint class on the position tile.
const CH_TINT: Record<Channel, string> = {
  LF: "t-front",
  RF: "t-front",
  LR: "t-rear",
  RR: "t-rear",
  SW: "t-sub",
};

/**
 * The primary editor view (read-only structure + full styling).
 * Master-detail: room list -> selected room detail. Home theaters render a spatial
 * stage (TV art, tinted front/rear/sub position tiles, listening-position couch);
 * pairs render pair cards; standalones render speaker rows. Drag/drop + tap-to-assign
 * + staged Apply land next, on top of this same layout.
 */
@customElement("chorus-editor")
export class ChorusEditor extends LitElement {
  @property({ attribute: false }) public graph?: BondGraph;
  @property({ type: Boolean }) public narrow = false;

  @state() private _selected?: string;

  private get _rooms(): Room[] {
    return buildRooms(this.graph);
  }

  private _room(): Room | undefined {
    const rooms = this._rooms;
    if (this._selected) {
      const found = rooms.find((r) => r.key === this._selected);
      if (found) return found;
    }
    // Desktop shows the first room by default (two-pane); mobile starts on the
    // list, so "‹ All rooms" (which clears _selected) actually returns to it.
    return this.narrow ? undefined : rooms[0];
  }

  public override render(): TemplateResult {
    const rooms = this._rooms;
    if (!rooms.length) {
      return html`<div class="empty">No Sonos speakers discovered yet.</div>`;
    }
    const room = this._room();
    return html`
      <div class="grid" data-detail=${room ? "on" : "off"}>
        <div class="col-list">
          <div class="eyebrow">Rooms</div>
          <div class="list">${rooms.map((r) => this._roomButton(r, room))}</div>
        </div>
        <div class="col-detail">${room ? this._detail(room) : nothing}</div>
      </div>
    `;
  }

  // ---- room list ------------------------------------------------------
  private _roomGlyphModel(r: Room): string {
    if (r.kind === "home_theater") return r.bar?.model ?? "";
    return r.pairs?.[0]?.L?.model ?? r.tray?.[0]?.model ?? "";
  }

  private _roomTint(r: Room): string {
    if (r.kind === "home_theater") return "t-bar";
    if (r.kind === "stereo_pair") return "t-front";
    return "t-neutral";
  }

  private _roomButton(r: Room, sel?: Room): TemplateResult {
    const on = sel?.key === r.key;
    return html`
      <button type="button" class="room ${on ? "sel" : ""}" @click=${() => (this._selected = r.key)}>
        <span class="ric ${this._roomTint(r)}">${iconFor(this._roomGlyphModel(r))}</span>
        <span class="rmeta">
          <b>${r.name}</b>
          <span>${this._roomSummary(r)}</span>
        </span>
        <span class="chev">›</span>
      </button>
    `;
  }

  private _roomSummary(r: Room): string {
    if (r.kind === "home_theater") {
      const n = CHANNELS.filter((c) => c !== "SW" && r.slots?.[c]).length;
      return `Home theater · ${n}.${r.slots?.SW ? "1" : "0"}`;
    }
    if (r.kind === "stereo_pair") return "Stereo pair";
    const n = r.tray?.length ?? 0;
    return n === 1 ? "1 speaker" : `${n} speakers`;
  }

  // ---- detail ---------------------------------------------------------
  private _detail(r: Room): TemplateResult {
    return html`
      ${this.narrow
        ? html`<button type="button" class="back" @click=${() => (this._selected = undefined)}>
            ‹ All rooms
          </button>`
        : nothing}
      <div class="head">
        <h1>${r.name}</h1>
        <span class="kind">${KIND_LABEL[r.kind] ?? r.kind}</span>
      </div>
      ${r.kind === "home_theater"
        ? this._htDetail(r)
        : r.kind === "stereo_pair"
          ? this._pairDetail(r)
          : this._soloDetail(r)}
    `;
  }

  private _htDetail(r: Room): TemplateResult {
    return html`
      <div class="stage">
        <div class="tv">${TV_ART}</div>
        ${this._barTile(r)}
        <div class="prow fronts">${this._pos(r, "LF")}${this._pos(r, "RF")}</div>
        <div class="lp"><div class="couch">${COUCH_ART}</div><small>Listening position</small></div>
        <div class="prow rear">${this._pos(r, "LR")}${this._pos(r, "RR")}</div>
        <div class="psub">${this._pos(r, "SW")}</div>
      </div>
      ${this._availablePanel()}
    `;
  }

  private _barTile(r: Room): TemplateResult {
    return html`
      <div class="postile bar t-bar">
        <span class="badge t-bar">${iconFor(r.bar?.model)}</span>
        <span class="pmeta">
          <b>${r.bar?.name ?? "Soundbar"}</b>
          <span>${shortModel(r.bar?.model) || "Center"}</span>
        </span>
      </div>
    `;
  }

  private _pos(r: Room, ch: Channel): TemplateResult {
    const sp = r.slots?.[ch] ?? null;
    const tint = CH_TINT[ch];
    if (!sp) {
      return html`
        <div class="postile empty">
          <span class="badge empty-badge">${ch}</span>
          <span class="pmeta"><b>${CHANNEL_NAME[ch]}</b><span>Empty</span></span>
        </div>
      `;
    }
    return html`
      <div class="postile">
        <span class="badge ${tint}">${iconFor(sp.model)}</span>
        <span class="pmeta">
          <b>${sp.name}</b>
          <span>${CHANNEL_NAME[ch]} · ${shortModel(sp.model)}</span>
        </span>
      </div>
    `;
  }

  // ---- pairs ----------------------------------------------------------
  private _pairDetail(r: Room): TemplateResult {
    const pairs = r.pairs ?? [];
    if (!pairs.length) return this._soloDetail(r);
    return html`<div class="paircards">${pairs.map((p) => this._pairCard(p))}</div>`;
  }

  private _pairCard(p: { L: EditorSpeaker | null; R: EditorSpeaker | null; sub: EditorSpeaker | null }): TemplateResult {
    return html`
      <div class="paircard">
        <div class="pc-orbs">
          ${this._pcSlot("L", p.L)}
          <span class="pc-div">+</span>
          ${this._pcSlot("R", p.R)}
        </div>
        <div class="pc-meta">
          <b>${p.L?.name ?? p.R?.name ?? "Stereo pair"}</b>
          <span>${shortModel(p.L?.model ?? p.R?.model)} · stereo pair</span>
        </div>
        ${p.sub
          ? html`<span class="pc-sub"><span class="pc-sub-ic">${iconFor(p.sub.model)}</span> Sub · ${p.sub.name}</span>`
          : nothing}
      </div>
    `;
  }

  private _pcSlot(side: string, sp: EditorSpeaker | null): TemplateResult {
    return html`
      <div class="pc-slot ${sp ? "" : "empty"}">
        ${sp
          ? html`<span class="badge orb t-front">${iconFor(sp.model)}</span>`
          : html`<span class="badge empty-badge">${side}</span>`}
        <span class="pc-side">${side}</span>
      </div>
    `;
  }

  // ---- solos + available ---------------------------------------------
  private _soloDetail(r: Room): TemplateResult {
    const solos = r.tray ?? [];
    if (!solos.length) return html`<div class="empty">No speakers in this room.</div>`;
    return html`<div class="rows">${solos.map((s) => this._speakerRow(s))}</div>`;
  }

  private _speakerRow(s: EditorSpeaker): TemplateResult {
    return html`
      <div class="row">
        <span class="rt">${iconFor(s.model)}</span>
        <span class="rx"><b>${s.name}</b><span>${shortModel(s.model)}</span></span>
      </div>
    `;
  }

  private _availablePanel(): TemplateResult {
    const avail = availableSpeakers(this.graph);
    return html`
      <div class="sec">Available speakers</div>
      ${avail.length
        ? html`<div class="rows">${avail.map((s) => this._speakerRow(s))}</div>`
        : html`<div class="empty small">Every speaker is in use.</div>`}
    `;
  }

  static override styles = css`
    :host {
      display: block;
      color: var(--primary-text-color);
      --chorus-front: #2f6fed;
      --chorus-rear: #12a3a3;
      --chorus-sub: #6a4bd8;
      --chorus-bar: var(--primary-color);
    }
    .grid {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 24px;
      align-items: start;
    }
    .eyebrow {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text-color);
      margin: 0 4px 8px;
    }
    .list {
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 14px;
      overflow: hidden;
    }
    .room {
      width: 100%;
      border: none;
      background: none;
      font: inherit;
      color: var(--primary-text-color);
      cursor: pointer;
      text-align: left;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 11px;
    }
    .room + .room {
      border-top: 1px solid var(--divider-color);
    }
    .room:hover {
      background: var(--secondary-background-color);
    }
    .room.sel {
      background: color-mix(in srgb, var(--primary-color) 13%, transparent);
    }
    .ric {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      flex: none;
      display: grid;
      place-items: center;
    }
    .ric svg {
      width: 19px;
      height: 19px;
    }
    .rmeta {
      flex: 1;
      min-width: 0;
    }
    .rmeta b {
      display: block;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rmeta span {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .chev {
      color: var(--secondary-text-color);
    }
    .room.sel .chev {
      color: var(--primary-color);
    }
    .back {
      border: none;
      background: none;
      color: var(--primary-color);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      padding: 0 0 12px;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 2px 12px;
    }
    .head h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    .kind {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 1px 8px;
      font-weight: 600;
    }

    /* ---- tints ---- */
    .t-front {
      background: color-mix(in srgb, var(--chorus-front) 16%, var(--card-background-color));
      color: var(--chorus-front);
    }
    .t-rear {
      background: color-mix(in srgb, var(--chorus-rear) 17%, var(--card-background-color));
      color: var(--chorus-rear);
    }
    .t-sub {
      background: color-mix(in srgb, var(--chorus-sub) 16%, var(--card-background-color));
      color: var(--chorus-sub);
    }
    .t-bar {
      background: color-mix(in srgb, var(--chorus-bar) 16%, var(--card-background-color));
      color: var(--chorus-bar);
    }
    .t-neutral {
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
    }

    /* ---- stage ---- */
    .stage {
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 18px;
      padding: 18px 16px 22px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .tv {
      width: 210px;
      max-width: 60%;
      color: var(--secondary-text-color);
      margin-bottom: 6px;
    }
    .tv svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .ink {
      fill: currentColor;
    }
    .paper {
      fill: var(--card-background-color, #fff);
    }
    .prow {
      display: flex;
      gap: 44px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 12px;
    }
    .psub {
      margin-top: 12px;
    }
    .lp {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin: 16px 0 4px;
    }
    .lp .couch {
      width: 150px;
      color: var(--secondary-text-color);
    }
    .lp .couch svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .lp small {
      font-size: 11px;
      color: var(--secondary-text-color);
    }
    .postile {
      min-width: 158px;
      border-radius: 15px;
      background: var(--card-background-color, var(--ha-card-background));
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.12));
      border: 1px solid var(--divider-color);
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 11px;
    }
    .postile.bar {
      min-width: 200px;
    }
    .postile.empty {
      background: none;
      border: 1.5px dashed var(--divider-color);
      box-shadow: none;
    }
    .badge {
      width: 40px;
      height: 40px;
      border-radius: 11px;
      display: grid;
      place-items: center;
      flex: none;
    }
    .badge svg {
      width: 23px;
      height: 23px;
    }
    .badge.empty-badge {
      border: 1.5px dashed var(--divider-color);
      color: var(--secondary-text-color);
      font-size: 12px;
      font-weight: 700;
      font-family: ui-monospace, monospace;
    }
    .pmeta {
      min-width: 0;
    }
    .pmeta b {
      display: block;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pmeta span {
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    /* ---- pairs ---- */
    .paircards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .paircard {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      padding: 13px 15px;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
      flex-wrap: wrap;
    }
    .pc-orbs {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: none;
    }
    .pc-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .pc-side {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.4px;
      color: var(--secondary-text-color);
    }
    .pc-div {
      color: var(--secondary-text-color);
      font-weight: 700;
    }
    .pc-meta {
      flex: 1;
      min-width: 0;
    }
    .pc-meta b {
      display: block;
      font-size: 15px;
      font-weight: 600;
    }
    .pc-meta span {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .pc-sub {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--chorus-sub);
      background: color-mix(in srgb, var(--chorus-sub) 15%, transparent);
      border-radius: 999px;
      padding: 5px 12px 5px 8px;
      flex: none;
    }
    .pc-sub-ic svg {
      width: 15px;
      height: 15px;
      display: block;
    }

    /* ---- rows ---- */
    .sec {
      font-size: 13px;
      font-weight: 700;
      margin: 22px 4px 10px;
    }
    .rows {
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 14px;
      overflow: hidden;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 13px;
    }
    .row + .row {
      border-top: 1px solid var(--divider-color);
    }
    .rt {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex: none;
      display: grid;
      place-items: center;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
    }
    .rt svg {
      width: 22px;
      height: 22px;
    }
    .rx {
      min-width: 0;
    }
    .rx b {
      display: block;
      font-size: 14px;
      font-weight: 600;
    }
    .rx span {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .empty {
      padding: 40px 8px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 15px;
    }
    .empty.small {
      padding: 16px;
      font-size: 13px;
    }
    @media (max-width: 800px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .grid[data-detail="on"] .col-list {
        display: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "chorus-editor": ChorusEditor;
  }
}
