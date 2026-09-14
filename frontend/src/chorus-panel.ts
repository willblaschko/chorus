import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { BondGraph, BondUnit, BondMember, HomeAssistant } from "./types.js";
import "./chorus-editor.js";
import "./chorus-help.js";

type View = "editor" | "overview";

const KIND_LABEL: Record<string, string> = {
  home_theater: "Home theater",
  stereo_pair: "Stereo pair",
  standalone: "Standalone",
};

const CHANNEL_LABEL: Record<string, string> = {
  CC: "Center",
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

const KIND_ORDER: Record<string, number> = {
  home_theater: 0,
  stereo_pair: 1,
  standalone: 2,
};

@customElement("chorus-panel")
export class ChorusPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public narrow = false;

  @state() private _view: View = "editor";
  @state() private _graph?: BondGraph;
  @state() private _error?: string;
  @state() private _loading = true;
  @state() private _help = false;

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
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._pollTimer) {
      window.clearInterval(this._pollTimer);
      this._pollTimer = undefined;
    }
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
    const units = this._graph?.units?.length ?? 0;
    return html`
      <header>
        <span class="mark"><i></i></span>
        <h1>Chorus</h1>
        <span class="tag">Sonos speaker manager</span>
        <span class="spacer"></span>
        <div class="seg" role="tablist">
          <button
            class=${this._view === "editor" ? "on" : ""}
            role="tab"
            aria-selected=${this._view === "editor"}
            @click=${() => (this._view = "editor")}
          >
            Editor
          </button>
          <button
            class=${this._view === "overview" ? "on" : ""}
            role="tab"
            aria-selected=${this._view === "overview"}
            @click=${() => (this._view = "overview")}
          >
            Overview
          </button>
        </div>
        ${this._view === "overview" && units
          ? html`<span class="count">${units} unit${units === 1 ? "" : "s"}</span>`
          : nothing}
        <button class="refresh" @click=${() => this._load(true)}>Refresh</button>
        <button class="refresh" title="How it works" @click=${() => (this._help = true)}>?</button>
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
    const units = this._graph?.units ?? [];
    if (!units.length) {
      return html`<div class="msg">No Sonos speakers discovered yet.</div>`;
    }
    const sorted = [...units].sort(
      (a, b) =>
        (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9) ||
        (a.name ?? "").localeCompare(b.name ?? "")
    );
    return html`<div class="grid">${sorted.map((u) => this._card(u))}</div>`;
  }

  private _card(unit: BondUnit): TemplateResult {
    return html`
      <div class="card">
        <h2>
          ${unit.name || unit.primary_uid}
          <span class="kind">${KIND_LABEL[unit.kind] ?? unit.kind}</span>
        </h2>
        <div class="members">${unit.members.map((m) => this._member(m))}</div>
      </div>
    `;
  }

  private _member(m: BondMember): TemplateResult {
    const label = m.channel ? CHANNEL_LABEL[m.channel] ?? m.channel : "Speaker";
    const tint = m.channel ? CHANNEL_TINT[m.channel] ?? "var(--chorus-cc)" : "";
    const sub = [m.model, m.ip].filter(Boolean).join(" · ");
    return html`
      <div class="member">
        <span
          class="chip ${m.channel ? "" : "solo"}"
          style=${tint ? `background:${tint}` : nothing}
          >${label}</span
        >
        <span class="m-main">
          <span class="m-name">${m.name || m.uid}</span>
          ${sub ? html`<span class="m-sub">${sub}</span>` : nothing}
        </span>
        ${m.invisible ? html`<span class="inv">bonded</span>` : nothing}
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
      width: 26px;
      height: 26px;
      border-radius: 7px;
      background: var(--primary-text-color);
      display: grid;
      place-items: center;
      flex: none;
    }
    .mark i {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2.4px solid var(--card-background-color, #fff);
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
    .count {
      color: var(--secondary-text-color);
      font-size: 13px;
    }
    button.refresh {
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 13px;
      cursor: pointer;
    }
    button.refresh:hover {
      background: var(--secondary-background-color);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .card {
      background: var(--card-background-color, var(--ha-card-background));
      border-radius: 12px;
      border: 1px solid var(--divider-color);
      padding: 14px 16px;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.08));
    }
    .card h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .kind {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 1px 7px;
      font-weight: 600;
    }
    .members {
      margin-top: 12px;
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
    .inv {
      font-size: 11px;
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 0 6px;
      margin-left: auto;
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
