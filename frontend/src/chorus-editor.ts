import { LitElement, html, css, nothing, type TemplateResult, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { BondGraph, HomeAssistant } from "./types.js";
import {
  buildRooms,
  positionAccepts,
  CHANNELS,
  CHANNEL_NAME,
  type Channel,
  type Room,
  type HTLayout,
  type EditorPair,
  type EditorSpeaker,
} from "./model.js";
import { iconFor, shortModel } from "./icons.js";
import { TV_ART, COUCH_ART } from "./art.js";
import { roomsToLayout, assignToChannel, clearChannel, separatePair } from "./layout.js";
import { planChanges, applyPlan, isEmpty } from "./staged.js";
import "./chorus-changebar.js";
import "./chorus-toast.js";
import type { ChangeRow } from "./chorus-changebar.js";

const CH_TINT: Record<Channel, string> = {
  LF: "t-front",
  RF: "t-front",
  LR: "t-rear",
  RR: "t-rear",
  SW: "t-sub",
};

/**
 * The primary editor: rooms grouped by HA Area, a spatial home-theater stage, and
 * interactive editing. Tap an empty channel to assign a speaker from the room; tap
 * the × to remove one; separate a pair. Edits stage locally (nothing hits Sonos)
 * and surface in the change bar; Apply pushes them via the chorus.* services.
 */
@customElement("chorus-editor")
export class ChorusEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public graph?: BondGraph;
  @property({ type: Boolean }) public narrow = false;

  @state() private _selected?: string;
  @state() private _working?: Room[]; // staged edits (undefined until synced from graph)
  @state() private _dirty = false;
  @state() private _applying = false;
  @state() private _rows: ChangeRow[] = []; // live rows during apply
  @state() private _picker?: { roomKey: string; ch: Channel };

  protected override willUpdate(changed: PropertyValues): void {
    // Sync the working model from the live graph — but never clobber staged edits
    // (the coordinator refreshes every 30s; that must not wipe your in-progress work).
    if ((changed.has("graph") && !this._dirty) || this._working === undefined) {
      this._working = structuredClone(buildRooms(this.graph));
    }
  }

  private get _rooms(): Room[] {
    return this._working ?? buildRooms(this.graph);
  }

  private _room(): Room | undefined {
    const rooms = this._rooms;
    if (this._selected) {
      const found = rooms.find((r) => r.key === this._selected);
      if (found) return found;
    }
    return this.narrow ? undefined : rooms[0];
  }

  // ---- staged plan + apply -------------------------------------------
  private _plan() {
    const base = roomsToLayout(buildRooms(this.graph));
    const working = roomsToLayout(this._rooms);
    return planChanges(base, working);
  }

  private _toast(message: string): void {
    const el = this.shadowRoot?.querySelector("chorus-toast") as
      | { show(m: string): void }
      | null;
    el?.show(message);
  }

  private _assign(roomKey: string, ch: Channel, sp: EditorSpeaker): void {
    this._working = assignToChannel(this._rooms, roomKey, ch, sp.uid);
    this._dirty = true;
    this._picker = undefined;
    this._toast(`${sp.name} → ${CHANNEL_NAME[ch]}`);
  }

  private _clear(roomKey: string, ch: Channel, sp: EditorSpeaker): void {
    this._working = clearChannel(this._rooms, roomKey, ch);
    this._dirty = true;
    this._toast(`${sp.name} removed from ${CHANNEL_NAME[ch]}`);
  }

  private _separate(roomKey: string, index: number): void {
    this._working = separatePair(this._rooms, roomKey, index);
    this._dirty = true;
    this._toast("Stereo pair separated");
  }

  private _discard(): void {
    this._working = structuredClone(buildRooms(this.graph));
    this._dirty = false;
    this._picker = undefined;
    this._toast("Changes discarded");
  }

  private async _apply(): Promise<void> {
    const plan = this._plan();
    if (isEmpty(plan) || this._applying) return;
    this._applying = true;
    this._rows = plan.rows;
    await applyPlan(this.hass, plan, (rows) => {
      this._rows = [...rows];
    });
    // The service calls have returned, but Sonos keeps re-syncing for a beat after.
    // Wait for the live topology to actually converge to what we asked for before
    // reporting done — mirror what the Sonos app does.
    const intended = this._bondSignature(roomsToLayout(this._rooms));
    const fresh = await this._awaitConvergence(intended);
    const failed = this._rows.filter((r) => r.status === "error").length;
    this._applying = false;
    this._dirty = false;
    if (fresh) {
      // Push the settled graph straight to the panel (no extra round-trip).
      this.dispatchEvent(
        new CustomEvent("chorus-graph", { detail: fresh, bubbles: true, composed: true })
      );
    } else {
      this.dispatchEvent(new CustomEvent("chorus-refresh", { bubbles: true, composed: true }));
    }
    this._toast(failed ? `Applied with ${failed} error${failed === 1 ? "" : "s"}` : "Applied");
  }

  // A stable fingerprint of the bonding topology (each speaker's role + anchor),
  // ignoring names/rooms — so convergence tracks the actual bonds, not transient labels.
  private _bondSignature(map: ReturnType<typeof roomsToLayout>): string {
    return Object.keys(map)
      .sort()
      .map((u) => `${u}:${map[u].role}:${map[u].anchorUid}`)
      .join(";");
  }

  // Re-discover (forcing a fresh Sonos scan) until the live bonding matches `intended`
  // or we exhaust the budget; returns the last graph we saw.
  private async _awaitConvergence(intended: string): Promise<BondGraph | undefined> {
    let last: BondGraph | undefined;
    for (let i = 0; i < 5; i++) {
      let fresh: BondGraph;
      try {
        fresh = await this.hass.connection.sendMessagePromise<BondGraph>({ type: "chorus/refresh" });
      } catch {
        return last;
      }
      last = fresh;
      // Converged only when the topology matches AND every speaker has a resolved
      // name — a freshly-bonded satellite's name lags the bond by a beat, and we
      // must not show its raw UID ("RINCON…").
      if (
        this._bondSignature(roomsToLayout(buildRooms(fresh))) === intended &&
        this._namesResolved(fresh)
      ) {
        return fresh;
      }
      await new Promise((r) => window.setTimeout(r, 1500));
    }
    return last;
  }

  private _namesResolved(graph: BondGraph): boolean {
    return (graph.units ?? []).every((u) =>
      u.members.every((m) => !!m.name && m.name !== m.uid)
    );
  }

  public override render(): TemplateResult {
    const rooms = this._rooms;
    if (!rooms.length) {
      return html`<div class="empty">No Sonos speakers discovered yet.</div>
        <chorus-toast></chorus-toast>`;
    }
    const room = this._room();
    const plan = this._plan();
    const rows = this._applying ? this._rows : plan.rows;
    return html`
      <div class="grid" data-detail=${room ? "on" : "off"}>
        <div class="col-list">
          <div class="eyebrow">Rooms</div>
          <div class="list">${rooms.map((r) => this._roomButton(r, room))}</div>
        </div>
        <div class="col-detail">${room ? this._detail(room) : nothing}</div>
      </div>
      ${this._pickerOverlay()}
      <chorus-changebar
        .rows=${rows}
        .busy=${this._applying}
        @apply=${this._apply}
        @discard=${this._discard}
      ></chorus-changebar>
      <chorus-toast></chorus-toast>
    `;
  }

  // ---- room list ------------------------------------------------------
  private _roomGlyphModel(r: Room): string {
    return r.ht?.bar.model ?? r.pairs[0]?.L?.model ?? r.tray[0]?.model ?? "";
  }

  private _roomTint(r: Room): string {
    if (r.ht) return "t-bar";
    if (r.pairs.length) return "t-front";
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
    const parts: string[] = [];
    if (r.ht) {
      const n = CHANNELS.filter((c) => c !== "SW" && r.ht!.slots[c]).length;
      parts.push(`Home theater · ${n}.${r.ht.slots.SW ? "1" : "0"}`);
    }
    if (r.pairs.length) parts.push(r.pairs.length === 1 ? "Stereo pair" : `${r.pairs.length} pairs`);
    const solo = r.tray.length;
    if (solo && !r.ht) parts.push(solo === 1 ? "1 speaker" : `${solo} speakers`);
    return parts.join(" · ") || "No speakers";
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
        ${r.area ? nothing : html`<span class="kind">No HA area</span>`}
      </div>
      ${r.ht ? this._htStage(r, r.ht) : nothing}
      ${r.pairs.length
        ? html`<div class="paircards">${r.pairs.map((p, i) => this._pairCard(r, p, i))}</div>`
        : nothing}
      ${this._traySection(r)}
    `;
  }

  private _htStage(r: Room, ht: HTLayout): TemplateResult {
    return html`
      <div class="stage">
        <div class="tv">${TV_ART}</div>
        <div class="postile bar t-bar">
          <span class="badge t-bar">${iconFor(ht.bar.model)}</span>
          <span class="pmeta"><b>${ht.bar.name}</b><span>${shortModel(ht.bar.model) || "Center"}</span></span>
        </div>
        <div class="prow fronts">${this._pos(r, ht, "LF")}${this._pos(r, ht, "RF")}</div>
        <div class="lp"><div class="couch">${COUCH_ART}</div><small>Listening position</small></div>
        <div class="prow rear">${this._pos(r, ht, "LR")}${this._pos(r, ht, "RR")}</div>
        <div class="psub">${this._pos(r, ht, "SW")}</div>
      </div>
    `;
  }

  private _pos(r: Room, ht: HTLayout, ch: Channel): TemplateResult {
    const sp = ht.slots[ch];
    const eligible = r.tray.some((s) => positionAccepts(ch, s.model));
    if (!sp) {
      return html`
        <button
          type="button"
          class="postile empty ${eligible ? "actionable" : ""}"
          ?disabled=${!eligible}
          title=${eligible ? `Add ${CHANNEL_NAME[ch]}` : "No eligible speaker in this room"}
          @click=${() => eligible && (this._picker = { roomKey: r.key, ch })}
        >
          <span class="badge empty-badge">${ch}</span>
          <span class="pmeta"><b>${CHANNEL_NAME[ch]}</b><span>${eligible ? "Tap to add" : "Empty"}</span></span>
        </button>
      `;
    }
    return html`
      <div class="postile">
        <span class="badge ${CH_TINT[ch]}">${iconFor(sp.model)}</span>
        <span class="pmeta">
          <b>${sp.name}</b>
          <span>${CHANNEL_NAME[ch]} · ${shortModel(sp.model)}</span>
        </span>
        <button type="button" class="x" title="Remove" @click=${() => this._clear(r.key, ch, sp)}>×</button>
      </div>
    `;
  }

  // ---- pairs ----------------------------------------------------------
  private _pairCard(r: Room, p: EditorPair, index: number): TemplateResult {
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
        <button type="button" class="pc-sep" title="Separate pair" @click=${() => this._separate(r.key, index)}>
          Separate
        </button>
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

  // ---- lone speakers / available pool --------------------------------
  private _traySection(r: Room): TemplateResult | typeof nothing {
    if (!r.tray.length) {
      return r.ht || r.pairs.length ? nothing : html`<div class="empty">No speakers in this room.</div>`;
    }
    const heading = r.ht || r.pairs.length ? "Available speakers" : "Speakers";
    return html`
      <div class="sec">${heading}</div>
      <div class="rows">${r.tray.map((s) => this._speakerRow(s))}</div>
    `;
  }

  private _speakerRow(s: EditorSpeaker): TemplateResult {
    return html`
      <div class="row">
        <span class="rt">${iconFor(s.model)}</span>
        <span class="rx"><b>${s.name}</b><span>${shortModel(s.model)}</span></span>
      </div>
    `;
  }

  // ---- picker overlay (tap-to-assign) --------------------------------
  private _pickerOverlay(): TemplateResult | typeof nothing {
    if (!this._picker) return nothing;
    const { roomKey, ch } = this._picker;
    const room = this._rooms.find((r) => r.key === roomKey);
    const candidates = (room?.tray ?? []).filter((s) => positionAccepts(ch, s.model));
    return html`
      <div class="backdrop" @click=${() => (this._picker = undefined)}>
        <div class="sheet" @click=${(e: Event) => e.stopPropagation()}>
          <div class="sheet-h">Add ${CHANNEL_NAME[ch]}</div>
          ${candidates.length
            ? candidates.map(
                (s) => html`
                  <button type="button" class="sheet-item" @click=${() => this._assign(roomKey, ch, s)}>
                    <span class="rt">${iconFor(s.model)}</span>
                    <span class="rx"><b>${s.name}</b><span>${shortModel(s.model)}</span></span>
                  </button>
                `
              )
            : html`<div class="sheet-empty">No eligible speaker in this room.</div>`}
          <button type="button" class="sheet-cancel" @click=${() => (this._picker = undefined)}>Cancel</button>
        </div>
      </div>
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

    .stage {
      padding: 8px 0 18px;
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
      fill: var(--primary-background-color, var(--card-background-color, #fff));
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
      position: relative;
    }
    button.postile {
      font: inherit;
      color: var(--primary-text-color);
      text-align: left;
      cursor: pointer;
    }
    .postile.bar {
      min-width: 200px;
    }
    .postile.empty {
      background: none;
      border: 1.5px dashed var(--divider-color);
      box-shadow: none;
    }
    .postile.empty.actionable:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    .postile.empty[disabled] {
      cursor: default;
      opacity: 0.75;
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
    .x {
      position: absolute;
      top: 6px;
      right: 8px;
      border: none;
      background: none;
      color: var(--secondary-text-color);
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 6px;
    }
    .x:hover {
      color: var(--error-color, #d32f2f);
      background: var(--secondary-background-color);
    }

    .paircards {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
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
    .pc-sep {
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--secondary-text-color);
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      border-radius: 999px;
      padding: 5px 12px;
      cursor: pointer;
    }
    .pc-sep:hover {
      color: var(--error-color, #d32f2f);
      border-color: var(--error-color, #d32f2f);
    }

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

    /* ---- picker sheet ---- */
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.32);
      display: grid;
      place-items: center;
      z-index: 50;
    }
    .sheet {
      background: var(--card-background-color, #fff);
      border-radius: 18px;
      box-shadow: 0 24px 70px -20px rgba(0, 0, 0, 0.5);
      width: 320px;
      max-width: 92vw;
      max-height: 80vh;
      overflow-y: auto;
      padding: 8px;
    }
    .sheet-h {
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      padding: 12px 10px 8px;
    }
    .sheet-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      border: none;
      background: none;
      font: inherit;
      color: var(--primary-text-color);
      text-align: left;
      padding: 10px 12px;
      border-radius: 12px;
      cursor: pointer;
    }
    .sheet-item:hover {
      background: var(--secondary-background-color);
    }
    .sheet-empty {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 13px;
    }
    .sheet-cancel {
      width: 100%;
      border: none;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font: inherit;
      font-weight: 600;
      padding: 11px;
      border-radius: 12px;
      cursor: pointer;
      margin-top: 5px;
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
