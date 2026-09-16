import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { BondGraph, HomeAssistant } from "./types.js";
import {
  buildRooms,
  setKind,
  CHANNELS,
  AVAILABLE_SUBS_KEY,
  type Room,
  type BondedSet,
  type EditorSpeaker,
} from "./model.js";
import { iconFor, shortModel } from "./icons.js";
import { parseRoute, buildPath, type View } from "./route.js";
import "./chorus-editor.js";
import "./chorus-help.js";

// One "who lives here" row in a room card's contents: a channel label (or null
// for a lone speaker) plus the speaker to name. Derived from the room's bonded
// sets + tray, so the card mirrors the editor's model, not the raw units.
interface RoomEntry {
  ch: string | null;
  name: string;
  model: string;
}

// A visually-boxed group of member rows in a room card — one per bonded SET
// (home theater / stereo pair / speaker + sub), plus one for the room's loose
// tray speakers. The caption is the group's kind label (see _roomGroups).
interface RoomGroup {
  label: string;
  entries: RoomEntry[];
}

const CHANNEL_LABEL: Record<string, string> = {
  CC: "Soundbar",
  LF: "Front L",
  RF: "Front R",
  LR: "Rear L",
  RR: "Rear R",
  SW: "Sub",
};

const CHANNEL_TINT: Record<string, string> = {
  CC: "var(--chorus-cc)",
  LF: "var(--chorus-front)",
  RF: "var(--chorus-front)",
  LR: "var(--chorus-rear)",
  RR: "var(--chorus-rear)",
  SW: "var(--chorus-sub)",
};

@customElement("chorus-panel")
export class ChorusPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public narrow = false;
  // HA passes the URL sub-path under the panel: { prefix: "/chorus", path: "/editor/<room>" }.
  @property({ attribute: false }) public route?: { prefix?: string; path?: string };

  @state() private _view: View = "editor";
  @state() private _graph?: BondGraph;
  @state() private _error?: string;
  @state() private _loading = true;
  @state() private _help = false;
  // Room key to pre-select when the user jumps into the editor via a card's
  // pencil. Fed to <chorus-editor>.selectRoom (see _editor / _openInEditor).
  @state() private _editRoom?: string;

  private _pollTimer?: number;
  private _polling = false;

  public override firstUpdated(): void {
    void this._load();
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    // Live updates while the panel is open: force a fresh Sonos re-discovery every
    // few seconds so speakers appear/disappear as the network changes. Only runs
    // while connected, so it costs nothing when the panel is closed.
    this._pollTimer = window.setInterval(() => void this._poll(), 12000);
    // Deep links: restore the view/room from the URL, and follow the browser's
    // back/forward buttons.
    window.addEventListener("popstate", this._onPop);
    this._applyPath(this._currentPath());
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._pollTimer) {
      window.clearInterval(this._pollTimer);
      this._pollTimer = undefined;
    }
    window.removeEventListener("popstate", this._onPop);
  }

  protected override willUpdate(changed: PropertyValues): void {
    // HA (re)passes `route` on load and navigation — reflect it into view/room.
    if (changed.has("route")) this._applyPath(this._currentPath());
  }

  // ---- routing (deep links: /chorus/editor/<room>, /chorus/overview) --
  private _onPop = (): void => this._applyPath(this._currentPath());

  private _prefix(): string {
    return this.route?.prefix || "/chorus";
  }

  /** The panel-relative sub-path, e.g. "/editor/media_room". */
  private _currentPath(): string {
    if (this.route?.path != null) return this.route.path;
    const p = window.location.pathname;
    const pre = this._prefix();
    return p.startsWith(pre) ? p.slice(pre.length) : "";
  }

  private _applyPath(path: string): void {
    const { view, room } = parseRoute(path);
    this._view = view;
    this._editRoom = room;
  }

  /** Navigate to a view/room: update the URL (no reload) and the local state. */
  private _go(view: View, room?: string): void {
    const url = this._prefix() + buildPath(view, room);
    if (window.location.pathname !== url) {
      history.pushState(null, "", url);
      this.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true }));
    }
    this._view = view;
    this._editRoom = room;
  }

  private async _poll(): Promise<void> {
    if (this._polling || !this.hass) return;
    this._polling = true;
    try {
      this._graph = await this.hass.connection.sendMessagePromise<BondGraph>({
        type: "chorus/refresh",
      });
    } catch {
      /* transient — keep the last graph */
    } finally {
      this._polling = false;
    }
  }

  private async _load(fresh = false): Promise<void> {
    this._loading = true;
    this._error = undefined;
    try {
      // `chorus/refresh` forces a fresh Sonos re-discovery (used after Apply so the
      // reloaded graph reflects the settled device, not the mid-cycle cache).
      this._graph = await this.hass.connection.sendMessagePromise<BondGraph>({
        type: fresh ? "chorus/refresh" : "chorus/bond_graph",
      });
    } catch (err) {
      this._error =
        (err as { message?: string; code?: string })?.message ||
        (err as { code?: string })?.code ||
        "unknown error";
    } finally {
      this._loading = false;
    }
  }

  public override render(): TemplateResult {
    return html`
      <div class="wrap">
        ${this._header()}
        ${this._view === "overview" ? this._overview() : this._editor()}
      </div>
      <chorus-help .open=${this._help} @close=${() => (this._help = false)}></chorus-help>
    `;
  }

  private _header(): TemplateResult {
    return html`
      <header>
        <img class="mark" src="/chorus_static/chorus-icon.png" alt="" />
        <h1>Chorus</h1>
        <span class="tag">Pair. Surround. Bond.</span>
        <span class="spacer"></span>
        <div class="seg" role="tablist">
          <button
            class=${this._view === "editor" ? "on" : ""}
            role="tab"
            aria-selected=${this._view === "editor"}
            @click=${() => this._go("editor", this._editRoom)}
          >
            Editor
          </button>
          <button
            class=${this._view === "overview" ? "on" : ""}
            role="tab"
            aria-selected=${this._view === "overview"}
            @click=${() => this._go("overview")}
          >
            Overview
          </button>
        </div>
        <button class="refresh" title="Refresh" aria-label="Refresh" @click=${() => this._load(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z"
            />
          </svg>
        </button>
        <button
          class="refresh"
          title="How it works"
          aria-label="How it works"
          @click=${() => (this._help = true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M11 18h2v-2h-2v2zm1-16A10 10 0 1 0 22 12 10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-14a4 4 0 0 0-4 4h2a2 2 0 1 1 4 0c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5a4 4 0 0 0-4-4z"
            />
          </svg>
        </button>
      </header>
    `;
  }

  private _editor(): TemplateResult {
    if (this._loading && !this._graph) {
      return html`<div class="msg">Reading your speakers…</div>`;
    }
    if (this._error) {
      return html`<div class="msg err">Couldn't load the speaker graph: ${this._error}</div>`;
    }
    return html`<chorus-editor
      .hass=${this.hass}
      .graph=${this._graph}
      .narrow=${this.narrow}
      .selectRoom=${this._editRoom}
      @room-change=${(e: Event) => this._go("editor", (e as CustomEvent).detail || undefined)}
      @chorus-graph=${(e: Event) => {
        this._graph = (e as CustomEvent).detail as BondGraph;
        this._loading = false;
      }}
      @chorus-refresh=${() => this._load(true)}
    ></chorus-editor>`;
  }

  private _overview(): TemplateResult {
    if (this._loading && !this._graph) {
      return html`<div class="msg">Reading your speakers…</div>`;
    }
    if (this._error) {
      return html`<div class="msg err">Couldn't load the speaker graph: ${this._error}</div>`;
    }
    // Same grouping the editor uses: bond graph → rooms by HA Area. The unbonded-subs
    // pool is a pseudo-room (never a real place) — pull it aside for its own card so a
    // free-floating sub, which belongs to no room, is still visible on the overview.
    const allRooms = buildRooms(this._graph);
    const rooms = allRooms.filter((r) => r.key !== AVAILABLE_SUBS_KEY);
    const freeSubs = allRooms.find((r) => r.key === AVAILABLE_SUBS_KEY)?.tray ?? [];
    if (!rooms.length && !freeSubs.length) {
      return html`<div class="msg">No Sonos speakers discovered yet.</div>`;
    }
    // Home theaters first, then rooms with stereo pairs, then the rest; alpha within
    // each tier (numeric-aware so "Bedroom 2" sorts after "Bedroom 10" sanely).
    const sorted = [...rooms].sort(
      (a, b) =>
        this._roomRank(a) - this._roomRank(b) ||
        a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    return html`
      <div class="grid">
        ${sorted.map((r) => this._roomCard(r))}
        ${freeSubs.length ? this._freeSubsCard(freeSubs) : nothing}
      </div>
      ${this._supportNote()}
    `;
  }

  // A card for subs bonded to nothing — they have no room, so they'd otherwise be
  // invisible on the overview. Sits at the end of the grid, tinted with the sub color.
  private _freeSubsCard(subs: EditorSpeaker[]): TemplateResult {
    const group: RoomGroup = {
      label: subs.length === 1 ? "Unbonded sub" : "Unbonded subs",
      entries: subs.map((sp) => ({ ch: "SW", name: this._spName(sp), model: sp.model })),
    };
    return html`
      <div class="card">
        <div class="rhead">
          <span class="ric t-sub" aria-hidden="true">${iconFor(subs[0]?.model ?? "Sonos Sub")}</span>
          <div class="rmeta">
            <h2 class="rname">Unbonded subs</h2>
            <span class="rsum"
              >${subs.length === 1 ? "1 sub" : `${subs.length} subs`} · not bonded to a set</span
            >
          </div>
        </div>
        <div class="groups">${this._groupBox(group)}</div>
      </div>
    `;
  }

  // Chorus is free; if it earned its keep, we point goodwill at wildlife instead of
  // a tip jar. Links to the README's "How to support" section (which has the donate link).
  private _supportNote(): TemplateResult {
    return html`
      <a
        class="support"
        href="https://github.com/willblaschko/chorus#how-to-support"
        target="_blank"
        rel="noopener noreferrer"
        title="Chorus is free — if you'd like to give back, support wildlife"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21s-6.7-4.35-9.33-8.24C1.1 10.36 1.62 7.3 3.9 5.9c1.9-1.17 4.2-.6 5.5 1 .3.37.45.6.6.82.15-.22.3-.45.6-.82 1.3-1.6 3.6-2.17 5.5-1 2.28 1.4 2.8 4.46 1.23 6.86C18.7 16.65 12 21 12 21z"
          />
        </svg>
        Love Chorus? Donate to wildlife →
      </a>
    `;
  }

  // ---- room derivations (mirror chorus-editor's private helpers) -------
  private _htSet(r: Room): BondedSet | undefined {
    return r.sets.find((s) => setKind(s) === "home_theater");
  }
  private _pairSets(r: Room): BondedSet[] {
    return r.sets.filter((s) => setKind(s) === "stereo_pair");
  }

  private _roomRank(r: Room): number {
    if (this._htSet(r)) return 0;
    if (this._pairSets(r).length) return 1;
    return 2;
  }

  // The glyph model for the room's icon: prefer the soundbar, else the first bonded
  // set's anchor, else the first loose speaker (mirrors the editor's _roomGlyphModel).
  private _roomGlyphModel(r: Room): string {
    return this._htSet(r)?.primary.model ?? r.sets[0]?.primary.model ?? r.tray[0]?.model ?? "";
  }

  // Tint the round room icon by what's in the room: a home theater gets the center
  // ("bar") tint, a room with stereo pairs the front tint, otherwise neutral. Uses
  // the panel's own --chorus-* vars (see :host) so light/dark both theme correctly.
  private _roomTint(r: Room): string {
    if (this._htSet(r)) return "t-bar";
    if (this._pairSets(r).length) return "t-front";
    return "t-neutral";
  }

  // The muted subline under the room name — same phrasing as chorus-editor's
  // _roomSummary: "Home theater · N.M", "Stereo pair"/"K pairs", "1 speaker"/…
  private _roomSummary(r: Room): string {
    const parts: string[] = [];
    const ht = this._htSet(r);
    if (ht) {
      const n = CHANNELS.filter((c) => c !== "SW" && ht.slots[c]).length;
      parts.push(`Home theater · ${n}.${ht.slots.SW ? "1" : "0"}`);
    }
    const pairs = this._pairSets(r).length;
    if (pairs) parts.push(pairs === 1 ? "Stereo pair" : `${pairs} pairs`);
    const solo = r.tray.length;
    if (solo && !ht) parts.push(solo === 1 ? "1 speaker" : `${solo} speakers`);
    return parts.join(" · ") || "No speakers";
  }

  // Never surface a raw "RINCON_…" uid: fall back to the model while a name resolves
  // (mirrors chorus-editor's _name).
  private _spName(sp: EditorSpeaker): string {
    return sp.name && !/^RINCON_/i.test(sp.name) ? sp.name : shortModel(sp.model) || "Speaker";
  }

  // Group a room's contents by bonded SET: each home theater / stereo pair /
  // speaker+sub becomes its own captioned group of member rows, so a room with
  // (say) one theater AND one pair renders as two clearly separate boxes. Loose
  // tray speakers get their own trailing group. Labels mirror the editor's
  // section wording (_detail): "Home theater" / "Stereo pair" / "Speaker + sub".
  private _roomGroups(r: Room): RoomGroup[] {
    const groups: RoomGroup[] = [];
    const entry = (ch: string | null, sp: EditorSpeaker): RoomEntry => ({
      ch,
      name: this._spName(sp),
      model: sp.model,
    });
    for (const set of r.sets) {
      const kind = setKind(set);
      const entries: RoomEntry[] = [];
      if (kind === "home_theater") {
        entries.push(entry("CC", set.primary));
        for (const ch of CHANNELS) {
          const sp = set.slots[ch];
          if (sp) entries.push(entry(ch, sp));
        }
        groups.push({ label: "Home theater", entries });
      } else if (kind === "stereo_pair") {
        entries.push(entry("LF", set.primary));
        if (set.slots.RF) entries.push(entry("RF", set.slots.RF));
        if (set.slots.SW) entries.push(entry("SW", set.slots.SW));
        groups.push({ label: "Stereo pair", entries });
      } else {
        entries.push(entry(null, set.primary));
        if (set.slots.SW) entries.push(entry("SW", set.slots.SW));
        groups.push({ label: "Speaker + sub", entries });
      }
    }
    if (r.tray.length) {
      groups.push({
        label: r.sets.length ? "Other speakers" : "Speakers",
        entries: r.tray.map((sp) => entry(null, sp)),
      });
    }
    return groups;
  }

  private _openInEditor(r: Room): void {
    // buildRooms keys rooms the same way <chorus-editor>.selectRoom matches, so the
    // editor lands on this exact room (and the URL becomes /editor/<room>).
    this._go("editor", r.key);
  }

  private _roomCard(r: Room): TemplateResult {
    const groups = this._roomGroups(r);
    return html`
      <div class="card">
        <div class="rhead">
          <span class="ric ${this._roomTint(r)}" aria-hidden="true"
            >${iconFor(this._roomGlyphModel(r))}</span
          >
          <div class="rmeta">
            <h2 class="rname">${r.name}</h2>
            <span class="rsum">${this._roomSummary(r)}</span>
          </div>
          <button
            class="edit"
            title="Edit in editor"
            aria-label=${`Edit ${r.name} in the editor`}
            @click=${() => this._openInEditor(r)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
              />
            </svg>
          </button>
        </div>
        ${groups.length
          ? html`<div class="groups">${groups.map((g) => this._groupBox(g))}</div>`
          : nothing}
      </div>
    `;
  }

  // One bordered, captioned box for a single bonded set (or the tray group).
  private _groupBox(g: RoomGroup): TemplateResult {
    return html`
      <div class="group" role="group" aria-label=${g.label}>
        <div class="gcap">${g.label}</div>
        <div class="members">${g.entries.map((e) => this._entryRow(e))}</div>
      </div>
    `;
  }

  private _entryRow(e: RoomEntry): TemplateResult {
    const label = e.ch ? CHANNEL_LABEL[e.ch] ?? e.ch : "Speaker";
    const tint = e.ch ? CHANNEL_TINT[e.ch] ?? "var(--chorus-cc)" : "";
    const sub = shortModel(e.model);
    return html`
      <div class="member">
        <span class="chip ${e.ch ? "" : "solo"}" style=${tint ? `background:${tint}` : nothing}
          >${label}</span
        >
        <span class="m-main">
          <span class="m-name">${e.name}</span>
          ${sub ? html`<span class="m-sub">${sub}</span>` : nothing}
        </span>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      color: var(--primary-text-color);
      --chorus-front: #2f6fed;
      --chorus-rear: #129d9d;
      --chorus-sub: #6a4bd8;
      --chorus-cc: #8a8f98;
    }
    .wrap {
      max-width: 1000px;
      margin: 0 auto;
      padding: 16px 16px 48px;
    }
    header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 8px 4px 20px;
      flex-wrap: wrap;
    }
    .mark {
      width: 30px;
      height: 30px;
      flex: none;
      display: block;
    }
    h1 {
      font-size: 22px;
      font-weight: 600;
      margin: 0;
      letter-spacing: 0.2px;
    }
    .tag {
      color: var(--secondary-text-color);
      font-size: 13px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .seg {
      display: inline-flex;
      background: var(--secondary-background-color);
      border-radius: 999px;
      padding: 3px;
      gap: 2px;
    }
    .seg button {
      border: none;
      background: none;
      color: var(--secondary-text-color);
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 5px 14px;
      border-radius: 999px;
      cursor: pointer;
    }
    .seg button.on {
      background: var(--card-background-color, #fff);
      color: var(--primary-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
    /* Phones: keep the whole header on one row (logo + tabs + buttons). The tagline is
       decorative, so drop it here to reclaim the vertical space. */
    @media (max-width: 520px) {
      header {
        gap: 8px;
        margin: 6px 2px 14px;
      }
      .tag {
        display: none;
      }
      h1 {
        font-size: 18px;
      }
      .seg button {
        padding: 4px 11px;
        font-size: 12.5px;
      }
    }
    button.refresh {
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--secondary-text-color);
      border-radius: 50%;
      width: 34px;
      height: 34px;
      padding: 0;
      display: inline-grid;
      place-items: center;
      cursor: pointer;
    }
    button.refresh svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    button.refresh:hover {
      background: var(--secondary-background-color);
      color: var(--primary-color);
    }
    button.refresh:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    /* Unobtrusive footer link under the overview grid: "support wildlife instead". */
    .support {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 22px auto 4px;
      width: fit-content;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      text-decoration: none;
      border: 1px solid var(--divider-color);
      transition: color 0.15s, border-color 0.15s;
    }
    .support:hover {
      color: var(--chorus-front, var(--primary-color));
      border-color: color-mix(in srgb, var(--chorus-front, var(--primary-color)) 45%, transparent);
    }
    .support svg {
      width: 15px;
      height: 15px;
      fill: currentColor;
      flex: none;
    }
    .card {
      background: var(--card-background-color, var(--ha-card-background));
      border-radius: 12px;
      border: 1px solid var(--divider-color);
      padding: 14px 16px;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.08));
    }
    /* Room-card header: tinted round icon + name/summary + edit pencil, echoing
       the editor's room-list row (.ric / .rmeta) but scaled up for the page. */
    .rhead {
      display: flex;
      align-items: center;
      gap: 13px;
    }
    .ric {
      width: 44px;
      height: 44px;
      border-radius: 13px;
      flex: none;
      display: grid;
      place-items: center;
    }
    .ric svg {
      width: 26px;
      height: 26px;
    }
    /* Icon tints — mirror the editor's t-* classes, but keyed to this panel's own
       --chorus-* vars. color-mix over the card surface keeps them legible in both
       light and dark themes. */
    .t-front {
      background: color-mix(in srgb, var(--chorus-front) 16%, var(--card-background-color));
      color: var(--chorus-front);
    }
    .t-bar {
      /* Home theaters get the accent (matches the editor's room list), not the muted
         center-channel grey — so the marquee kind pops. */
      background: color-mix(in srgb, var(--primary-color) 20%, var(--card-background-color));
      color: var(--primary-color);
    }
    .t-neutral {
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
    }
    .t-sub {
      background: color-mix(in srgb, var(--chorus-sub) 18%, var(--card-background-color));
      color: var(--chorus-sub);
    }
    .rmeta {
      flex: 1;
      min-width: 0;
    }
    .rname {
      font-size: 17px;
      font-weight: 600;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: 0.1px;
    }
    .rsum {
      display: block;
      font-size: 12px;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .edit {
      flex: none;
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      border-radius: 8px;
      background: none;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .edit:hover {
      color: var(--primary-color);
      background: var(--secondary-background-color);
    }
    .edit:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .edit svg {
      display: block;
    }
    /* Grouped contents: each bonded set (home theater / stereo pair / speaker +
       sub) and the loose tray get their own bordered box, stacked with a small
       gap, so multiple groups in one room read as visually separate. */
    .groups {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .group {
      border: 1px solid var(--divider-color);
      border-radius: 11px;
      padding: 9px 11px 11px;
    }
    .gcap {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: var(--secondary-text-color);
      margin-bottom: 8px;
    }
    .members {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .member {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .chip {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
      color: #fff;
      border-radius: 6px;
      padding: 2px 7px;
      min-width: 52px;
      text-align: center;
      flex: none;
    }
    .chip.solo {
      background: var(--secondary-text-color);
    }
    .m-main {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .m-name {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .m-sub {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .msg {
      padding: 40px 8px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 15px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .msg.err {
      color: var(--error-color, #d32f2f);
    }
    .msg b {
      color: var(--primary-text-color);
      font-size: 17px;
    }
    .link {
      border: none;
      background: none;
      color: var(--primary-color);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "chorus-panel": ChorusPanel;
  }
}
