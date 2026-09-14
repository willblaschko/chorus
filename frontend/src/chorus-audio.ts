import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

/** Whether a control is a continuous slider or an on/off toggle. */
export type AudioControlKind = "slider" | "toggle";

/** A single audio-settings row, fully described by the host. */
export interface AudioControl {
  id: string; // returned in the change event
  kind: AudioControlKind;
  label: string;
  value: number | boolean; // slider -> number, toggle -> boolean
  group?: string; // optional section header to group rows under
  min?: number; // slider
  max?: number; // slider
  step?: number; // slider (default 1)
  format?: string; // optional unit suffix shown by the value, e.g. "%", "dB"
  disabled?: boolean;
}

/**
 * A dumb, reusable audio-settings sheet (EQ, sub/surround levels, night sound,
 * Trueplay, stereo balance, …).
 *
 * Purely presentational: it renders the controls it is given, emits `change`
 * (detail = `{ id, value }`) as each control is manipulated and `close` when
 * dismissed. It holds no business logic and never talks to Home Assistant — the
 * host binds `controls` values and reacts to the events.
 *
 * Both events are composed + bubbling so a parent across the shadow boundary can
 * listen. Drive it by setting `open`, `heading`, `subheading` and `controls`.
 * The backdrop, the Done button, and the Escape key each fire `close`.
 */
@customElement("chorus-audio")
export class ChorusAudio extends LitElement {
  @property({ type: String }) public heading = ""; // sheet title (optional)
  @property({ type: String }) public subheading = ""; // optional subtitle
  @property({ attribute: false }) public controls: AudioControl[] = [];
  @property({ type: Boolean }) public open = false;

  private readonly _onKeyDown = (ev: KeyboardEvent): void => {
    if (this.open && ev.key === "Escape") {
      ev.stopPropagation();
      this._close();
    }
  };

  public override connectedCallback(): void {
    super.connectedCallback();
    // Escape closes from anywhere while open; guarded inside the handler.
    window.addEventListener("keydown", this._onKeyDown);
  }

  public override disconnectedCallback(): void {
    window.removeEventListener("keydown", this._onKeyDown);
    super.disconnectedCallback();
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  // Clicks that reach the backdrop (not the sheet) dismiss the sheet.
  private _onBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) this._close();
  }

  private _emit(id: string, value: number | boolean): void {
    this.dispatchEvent(
      new CustomEvent("change", { detail: { id, value }, bubbles: true, composed: true })
    );
  }

  // Group rows by their `group`, preserving first-seen order. Ungrouped rows go
  // into an initial, label-less bucket so they render above the first header.
  private _grouped(): Array<{ group: string | undefined; rows: AudioControl[] }> {
    const order: Array<string | undefined> = [];
    const byGroup = new Map<string | undefined, AudioControl[]>();
    for (const c of this.controls) {
      const key = c.group;
      if (!byGroup.has(key)) {
        byGroup.set(key, []);
        order.push(key);
      }
      byGroup.get(key)!.push(c);
    }
    return order.map((group) => ({ group, rows: byGroup.get(group)! }));
  }

  private _pct(c: AudioControl): number {
    const min = c.min ?? 0;
    const max = c.max ?? 100;
    const value = typeof c.value === "number" ? c.value : 0;
    if (max === min) return 0;
    const clamped = Math.min(max, Math.max(min, value));
    return ((clamped - min) / (max - min)) * 100;
  }

  private _fill(pct: number): string {
    return `linear-gradient(90deg, var(--primary-color) ${pct}%, var(--divider-color) ${pct}%)`;
  }

  private _formatValue(c: AudioControl): string {
    const value = typeof c.value === "number" ? c.value : 0;
    return c.format ? `${value}${c.format}` : `${value}`;
  }

  // Live-update the fill + readout as the range is dragged, before the host has
  // had a chance to re-set `controls`, then emit for the host to persist.
  private _onSlider(c: AudioControl, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const value = Number(input.value);
    const min = c.min ?? 0;
    const max = c.max ?? 100;
    const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
    input.style.background = this._fill(pct);
    const readout = input
      .closest(".aset-row")
      ?.querySelector<HTMLElement>(".rv");
    if (readout) readout.textContent = c.format ? `${value}${c.format}` : `${value}`;
    this._emit(c.id, value);
  }

  private _onToggle(c: AudioControl, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this._emit(c.id, input.checked);
  }

  private _sliderRow(c: AudioControl): TemplateResult {
    const pct = this._pct(c);
    const value = typeof c.value === "number" ? c.value : 0;
    return html`
      <div class="aset-row ${c.disabled ? "disabled" : ""}">
        <label class="rl" for=${`sl-${c.id}`}>${c.label}</label>
        <div class="rc">
          <span class="rv">${this._formatValue(c)}</span>
          <input
            id=${`sl-${c.id}`}
            class="sl"
            type="range"
            min=${c.min ?? 0}
            max=${c.max ?? 100}
            step=${c.step ?? 1}
            .value=${String(value)}
            style=${`background:${this._fill(pct)}`}
            aria-label=${c.label}
            ?disabled=${c.disabled}
            @input=${(ev: Event) => this._onSlider(c, ev)}
          />
        </div>
      </div>
    `;
  }

  private _toggleRow(c: AudioControl): TemplateResult {
    const checked = c.value === true;
    return html`
      <div class="aset-row ${c.disabled ? "disabled" : ""}">
        <label class="rl" for=${`sw-${c.id}`}>${c.label}</label>
        <label class="sw">
          <input
            id=${`sw-${c.id}`}
            type="checkbox"
            .checked=${checked}
            aria-label=${c.label}
            ?disabled=${c.disabled}
            @change=${(ev: Event) => this._onToggle(c, ev)}
          />
          <span class="tr"></span>
          <span class="kn"></span>
        </label>
      </div>
    `;
  }

  private _row(c: AudioControl): TemplateResult {
    return c.kind === "toggle" ? this._toggleRow(c) : this._sliderRow(c);
  }

  public override render(): TemplateResult | typeof nothing {
    if (!this.open) return nothing;
    const groups = this._grouped();
    return html`
      <div class="backdrop" @click=${this._onBackdrop}>
        <div
          class="sheet"
          role="dialog"
          aria-modal="true"
          aria-label=${this.heading || "Audio settings"}
        >
          ${this.heading || this.subheading
            ? html`<div class="head">
                ${this.heading ? html`<b>${this.heading}</b>` : nothing}
                ${this.subheading ? html`<span>${this.subheading}</span>` : nothing}
              </div>`
            : nothing}
          ${groups.map(
            (g) => html`
              ${g.group ? html`<div class="aset-lbl">${g.group}</div>` : nothing}
              <div class="aset-group">${g.rows.map((c) => this._row(c))}</div>
            `
          )}
          <button type="button" class="done" @click=${this._close}>Done</button>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.42);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 16px;
      animation: fade 0.2s ease;
    }
    /* Center it as a true sheet on wider viewports. */
    @media (min-width: 560px) {
      .backdrop {
        align-items: center;
      }
    }

    .sheet {
      width: 380px;
      max-width: 100%;
      max-height: 82vh;
      overflow-y: auto;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 20px;
      box-shadow: 0 24px 70px -20px rgba(0, 0, 0, 0.55);
      padding: 20px;
      margin-bottom: max(8px, env(safe-area-inset-bottom));
      animation: rise 0.24s cubic-bezier(0.34, 1.4, 0.6, 1);
    }

    .head {
      text-align: center;
      padding: 2px 8px 4px;
    }
    .head b {
      display: block;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .head span {
      display: block;
      font-size: 12.5px;
      color: var(--secondary-text-color);
      margin-top: 3px;
    }

    .aset-lbl {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text-color);
      margin: 16px 4px 7px;
    }

    .aset-group {
      background: var(--secondary-background-color);
      border-radius: 13px;
      overflow: hidden;
    }

    .aset-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 10px 14px;
      min-height: 46px;
      box-sizing: border-box;
    }
    .aset-row + .aset-row {
      border-top: 0.5px solid var(--divider-color);
    }
    .aset-row.disabled {
      opacity: 0.4;
    }
    .aset-row.disabled .sl,
    .aset-row.disabled .sw,
    .aset-row.disabled input {
      pointer-events: none;
    }

    .rl {
      font-size: 14.5px;
      line-height: 1.3;
    }
    .rc {
      display: flex;
      align-items: center;
      gap: 11px;
    }
    .rv {
      font-family: var(--code-font-family, ui-monospace, "SF Mono", Menlo, monospace);
      font-size: 11px;
      color: var(--secondary-text-color);
      min-width: 48px;
      text-align: right;
    }

    /* ---- slider: thin track with a blue fill computed from the value ---- */
    .sl {
      -webkit-appearance: none;
      appearance: none;
      width: 148px;
      max-width: 40vw;
      height: 4px;
      border-radius: 2px;
      background: var(--divider-color);
      outline: none;
      cursor: pointer;
      vertical-align: middle;
      margin: 2px 0;
    }
    .sl::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--card-background-color, #fff);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.12);
      cursor: pointer;
    }
    .sl::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--card-background-color, #fff);
      border: 1px solid rgba(0, 0, 0, 0.12);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      cursor: pointer;
    }
    .sl:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 3px;
    }

    /* ---- iOS-style toggle: real checkbox styled as a switch ---- */
    .sw {
      position: relative;
      width: 44px;
      height: 26px;
      flex: none;
    }
    .sw input {
      opacity: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      cursor: pointer;
      position: relative;
      z-index: 2;
    }
    .sw .tr {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: var(--divider-color);
      transition: background 0.2s ease;
    }
    .sw .kn {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s ease;
    }
    .sw input:checked ~ .tr {
      background: var(--primary-color);
    }
    .sw input:checked ~ .kn {
      transform: translateX(18px);
    }
    .sw input:focus-visible ~ .tr {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .done {
      width: 100%;
      border: none;
      background: var(--primary-color);
      color: #fff;
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      margin-top: 18px;
      transition: filter 0.12s ease;
    }
    .done:hover {
      filter: brightness(0.95);
    }
    .done:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    @keyframes fade {
      from {
        opacity: 0;
      }
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(16px) scale(0.96);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .backdrop,
      .sheet {
        animation: none;
      }
      .sw .tr,
      .sw .kn,
      .done {
        transition: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "chorus-audio": ChorusAudio;
  }
}
