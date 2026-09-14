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

const KIND_LABEL: Record<string, string> = {
  home_theater: "Home theater",
  stereo_pair: "Stereo pair",
  standalone: "Standalone",
};

const CHANNEL_TINT: Record<string, string> = {
  LF: "var(--chorus-front)",
  RF: "var(--chorus-front)",
  LR: "var(--chorus-rear)",
  RR: "var(--chorus-rear)",
  SW: "var(--chorus-sub)",
};

/**
 * The primary editor view (Slice A: structure, read-only).
 * Master-detail: room list -> selected room detail (HT positions / pairs / solos).
 * Interactions (drag/drop, tap-to-assign, staged Apply) land in the next slices.
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
    return rooms.find((r) => r.key === this._selected) ?? rooms[0];
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
        <div class="col-detail">
          ${room ? this._detail(room) : nothing}
        </div>
      </div>
    `;
  }

  private _roomButton(r: Room, sel?: Room): TemplateResult {
    const on = sel?.key === r.key;
    return html`
      <button class="room ${on ? "sel" : ""}" @click=${() => (this._selected = r.key)}>
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
      const n = CHANNELS.filter((c) => r.slots?.[c]).length;
      return `Home theater · ${n}.${r.slots?.SW ? "1" : "0"}`;
    }
    if (r.kind === "stereo_pair") return "Stereo pair";
    return (r.tray?.length ?? 0) === 1 ? "1 speaker" : `${r.tray?.length ?? 0} speakers`;
  }

  private _detail(r: Room): TemplateResult {
    return html`
      ${this.narrow
        ? html`<button class="back" @click=${() => (this._selected = undefined)}>‹ All rooms</button>`
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
    const front: Channel[] = ["LF", "RF"];
    const rear: Channel[] = ["LR", "RR"];
    return html`
      <div class="stage">
        <div class="bar">${r.bar ? r.bar.name : "Soundbar"}</div>
        <div class="prow">${front.map((c) => this._pos(r, c))}</div>
        <div class="seat">Listening position</div>
        <div class="prow">${rear.map((c) => this._pos(r, c))}</div>
        <div class="prow sub">${this._pos(r, "SW")}</div>
      </div>
      ${this._availablePanel()}
    `;
  }

  private _pos(r: Room, ch: Channel): TemplateResult {
    const sp = r.slots?.[ch] ?? null;
    const tint = CHANNEL_TINT[ch];
    return html`
      <div class="postile ${sp ? "" : "empty"}">
        <span class="pchip" style=${sp ? `background:${tint}` : nothing}>${CHANNEL_NAME[ch]}</span>
        ${sp
          ? html`<span class="pmeta"><b>${sp.name}</b><span>${sp.model}</span></span>`
          : html`<span class="pmeta empty-note">Empty</span>`}
      </div>
    `;
  }

  private _pairDetail(r: Room): TemplateResult {
    const p = r.pairs?.[0];
    if (!p) return this._soloDetail(r);
    return html`
      <div class="paircard">
        ${this._pcSlot("L", p.L)}
        <span class="pc-div">+</span>
        ${this._pcSlot("R", p.R)}
        ${p.sub ? html`<span class="pc-sub">Sub · ${p.sub.name}</span>` : nothing}
      </div>
    `;
  }

  private _pcSlot(side: string, sp: EditorSpeaker | null): TemplateResult {
    return html`
      <div class="pc-slot ${sp ? "" : "empty"}">
        <span class="pc-side">${side}</span>
        ${sp
          ? html`<span class="pc-meta"><b>${sp.name}</b><span>${sp.model}</span></span>`
          : html`<span class="pc-meta empty-note">Empty</span>`}
      </div>
    `;
  }

  private _soloDetail(r: Room): TemplateResult {
    const solos = r.tray ?? [];
    if (!solos.length) return html`<div class="empty">No speakers in this room.</div>`;
    return html`<div class="rows">${solos.map((s) => this._speakerRow(s))}</div>`;
  }

  private _speakerRow(s: EditorSpeaker): TemplateResult {
    return html`
      <div class="row">
        <span class="rx"><b>${s.name}</b><span>${s.model}</span></span>
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
      --chorus-front: #2f6fed;
      --chorus-rear: #129d9d;
      --chorus-sub: #6a4bd8;
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
      border-radius: 12px;
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
      padding: 11px 13px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .room + .room {
      border-top: 1px solid var(--divider-color);
    }
    .room:hover {
      background: var(--secondary-background-color);
    }
    .room.sel {
      background: color-mix(in srgb, var(--primary-color) 14%, transparent);
    }
    .rmeta {
      flex: 1;
      min-width: 0;
    }
    .rmeta b {
      display: block;
      font-size: 14px;
      font-weight: 600;
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
      display: none;
      border: none;
      background: none;
      color: var(--primary-color);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      padding: 0 0 10px;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 2px 16px;
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
    .stage {
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .bar {
      background: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
      color: var(--primary-color);
      font-weight: 600;
      font-size: 13px;
      border-radius: 10px;
      padding: 10px 40px;
    }
    .seat {
      font-size: 12px;
      color: var(--secondary-text-color);
      padding: 6px 0;
    }
    .prow {
      display: flex;
      gap: 40px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .postile {
      min-width: 150px;
      border-radius: 14px;
      background: var(--card-background-color, var(--ha-card-background));
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
      border: 1px solid var(--divider-color);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .postile.empty {
      background: none;
      border: 1.5px dashed var(--divider-color);
      box-shadow: none;
    }
    .pchip {
      align-self: flex-start;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      border-radius: 6px;
      padding: 2px 8px;
      background: var(--secondary-text-color);
    }
    .pmeta b {
      display: block;
      font-size: 14px;
      font-weight: 600;
    }
    .pmeta span {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .pmeta.empty-note,
    .empty-note {
      color: var(--secondary-text-color);
      font-size: 13px;
    }
    .paircard {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      padding: 16px;
      flex-wrap: wrap;
    }
    .pc-slot {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 120px;
    }
    .pc-side {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.4px;
      color: var(--secondary-text-color);
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
    .pc-div {
      color: var(--secondary-text-color);
      font-weight: 700;
    }
    .pc-sub {
      font-size: 12px;
      font-weight: 600;
      color: var(--chorus-sub);
      background: color-mix(in srgb, var(--chorus-sub) 15%, transparent);
      border-radius: 999px;
      padding: 5px 12px;
    }
    .sec {
      font-size: 13px;
      font-weight: 700;
      margin: 22px 4px 10px;
    }
    .rows {
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      overflow: hidden;
    }
    .row {
      display: flex;
      align-items: center;
      padding: 11px 14px;
    }
    .row + .row {
      border-top: 1px solid var(--divider-color);
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
      .back {
        display: inline-block;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "chorus-editor": ChorusEditor;
  }
}
