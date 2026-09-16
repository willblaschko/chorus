import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

export type RowStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface ChangeRow {
  summary: string; // plain-language, e.g. "Media Room — add Rear L"
  status: RowStatus;
}

/**
 * Presentational change bar for the Chorus editor.
 *
 * DUMB by design: renders from `rows` + `busy` and emits `discard` / `apply`
 * events. No business logic, no Home Assistant access. The host owns the plan
 * and drives status by mutating `rows`.
 *
 * Layout: a fixed pill-shaped bar centered along the bottom of the viewport.
 * The head shows a pending-count and two buttons (Discard / Apply). Clicking
 * the count area (or, while applying, always) reveals an expandable list of
 * each staged change with a per-row status indicator.
 */
@customElement("chorus-changebar")
export class ChorusChangebar extends LitElement {
  @property({ attribute: false }) public rows: ChangeRow[] = [];

  /** true while the host is applying the staged changes */
  @property({ type: Boolean }) public busy = false;

  /** live status string shown in the head during apply, e.g.
   *  "Reconnecting TV Left, TV Right… (1 of 2)". Falls back to "Applying…". */
  @property({ attribute: false }) public statusLabel = "";

  /** apply progress in [0, 1]; a NEGATIVE value means indeterminate (unknown). */
  @property({ type: Number }) public progress = -1;

  /** whether the details list is expanded (collapsed by default) */
  @state() private open = false;

  /** true once the bar has sat with pending changes untouched — pulses the Apply button
   *  so it doesn't get missed. Resets on every new edit and while applying. */
  @state() private _nudge = false;
  private _nudgeTimer?: number;
  private _lastSig = "";
  private static readonly NUDGE_DELAY = 5000;

  protected override updated(): void {
    // The host passes a FRESH rows array on every render, so compare CONTENT, not
    // reference — otherwise an unrelated re-render would reset the idle timer forever
    // and the pulse would never fire. Only a real change (new/changed row, or an apply
    // starting/finishing) restarts it.
    const sig = `${this.busy}|${this.rows.map((r) => `${r.summary}${r.status}`).join("")}`;
    if (sig !== this._lastSig) {
      this._lastSig = sig;
      this._resetNudge();
    }
  }

  private _resetNudge(): void {
    if (this._nudgeTimer) clearTimeout(this._nudgeTimer);
    this._nudgeTimer = undefined;
    this._nudge = false;
    if (!this.busy && this.rows.length > 0) {
      this._nudgeTimer = window.setTimeout(() => {
        this._nudge = true;
      }, ChorusChangebar.NUDGE_DELAY);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._nudgeTimer) clearTimeout(this._nudgeTimer);
  }

  private toggle(): void {
    // While applying, the list is force-open to show progress; ignore toggles.
    if (this.busy) return;
    this.open = !this.open;
  }

  private emit(name: "discard" | "apply"): void {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
  }

  private renderStatus(status: RowStatus): TemplateResult {
    if (status === "done") {
      return html`
        <span class="state done" aria-label="done" title="Done">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <polyline points="5 12.5 10 17 19 7.5" />
          </svg>
        </span>
      `;
    }
    if (status === "error") {
      return html`
        <span class="state error" aria-label="error" title="Error">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <line x1="7" y1="7" x2="17" y2="17" />
            <line x1="17" y1="7" x2="7" y2="17" />
          </svg>
        </span>
      `;
    }
    if (status === "running") {
      return html`<span class="state running" aria-label="running" title="Applying"></span>`;
    }
    if (status === "skipped") {
      return html`<span class="state skipped" aria-label="skipped" title="Skipped"></span>`;
    }
    // pending
    return html`<span class="state pending" aria-label="pending" title="Pending"></span>`;
  }

  override render(): TemplateResult | typeof nothing {
    const n = this.rows.length;
    if (n === 0) return nothing;

    const expanded = this.busy || this.open;
    const countLabel = `${n} pending change${n === 1 ? "" : "s"}`;
    // While applying, the head reports live status instead of a static count.
    const headLabel = this.busy ? this.statusLabel || "Applying…" : countLabel;
    const determinate = this.progress >= 0;
    const pct = Math.max(0, Math.min(1, this.progress)) * 100;

    return html`
      <div
        class="bar ${expanded ? "open" : ""} ${this.busy ? "busy" : ""} ${this._nudge ? "nudge" : ""}"
        role="region"
        aria-label="Pending changes"
      >
        <div class="head">
          <button
            type="button"
            class="info"
            @click=${this.toggle}
            ?disabled=${this.busy}
            aria-expanded=${expanded ? "true" : "false"}
          >
            <span class="dot"></span>
            <b>${headLabel}</b>
            ${this.busy
              ? nothing
              : html`<span class="tog">${this.open ? "Hide" : "Details"}</span>`}
          </button>

          <div class="acts">
            ${this.busy
              ? nothing
              : html`
                  <button type="button" class="discard" @click=${() => this.emit("discard")}>
                    Discard
                  </button>
                `}
            <button
              type="button"
              class="apply"
              ?disabled=${this.busy}
              @click=${() => this.emit("apply")}
              aria-busy=${this.busy ? "true" : "false"}
            >
              ${this.busy
                ? html`<span class="apply-spin" aria-hidden="true"></span>Applying…`
                : "Apply"}
            </button>
          </div>
        </div>

        <div class="list" ?hidden=${!expanded}>
          ${this.rows.map(
            (row) => html`
              <div class="row ${row.status}">
                ${this.renderStatus(row.status)}
                <span class="summary">${row.summary}</span>
              </div>
            `,
          )}
        </div>

        ${this.busy
          ? html`
              <div
                class="progress ${determinate ? "determinate" : "indeterminate"}"
                role="progressbar"
                aria-label="Apply progress"
                aria-valuemin="0"
                aria-valuemax=${determinate ? "100" : nothing}
                aria-valuenow=${determinate ? Math.round(pct) : nothing}
              >
                <span
                  class="progress-fill"
                  style=${determinate ? `width:${pct}%` : nothing}
                ></span>
              </div>
            `
          : nothing}
      </div>
    `;
  }

  static override styles = css`
    :host {
      /* Green for a completed step; falls back to the theme accent so we never
         hardcode a color that could clash with a custom HA theme. */
      --cb-done: var(--success-color, var(--primary-color));
      --cb-error: var(--error-color);
    }

    .bar {
      position: fixed;
      /* Centre under the editor content (set by chorus-editor), not the raw viewport
         — otherwise HA's sidebar pushes this bar left of the content. */
      left: var(--chorus-bar-left, 50%);
      bottom: 22px;
      transform: translateX(-50%);
      width: min(680px, calc(100vw - 32px));
      box-sizing: border-box;
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      box-shadow: var(--ha-card-box-shadow, 0 12px 40px -12px rgba(0, 0, 0, 0.4));
      color: var(--primary-text-color);
      z-index: 6;
      overflow: hidden;
    }

    .bar.busy {
      /* keep interactive (Apply announces progress) but signal locked state */
      cursor: default;
    }

    .head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 10px 10px 16px;
    }

    .info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      background: none;
      border: 0;
      font: inherit;
      color: var(--primary-text-color);
      cursor: pointer;
      text-align: left;
      padding: 6px 4px;
      border-radius: 8px;
      min-width: 0;
    }
    .info:disabled {
      cursor: default;
    }
    .info b {
      font-size: 14.5px;
      font-weight: 600;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color);
      flex: none;
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary-color) 20%, transparent);
    }

    .tog {
      font-size: 12.5px;
      color: var(--secondary-text-color);
      flex: none;
    }
    .bar.open .tog {
      color: var(--primary-color);
    }

    .acts {
      display: flex;
      gap: 6px;
      flex: none;
      align-items: center;
    }

    .discard {
      font: inherit;
      font-size: 13.5px;
      font-weight: 500;
      color: var(--secondary-text-color);
      background: none;
      border: 0;
      padding: 9px 13px;
      border-radius: 10px;
      cursor: pointer;
    }
    .discard:hover {
      background: var(--secondary-background-color);
    }

    .apply {
      font: inherit;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-primary-color, #fff);
      background: var(--primary-color);
      border: 0;
      padding: 9px 20px;
      border-radius: 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .apply:hover:not(:disabled) {
      filter: brightness(1.06);
    }
    .apply:disabled {
      cursor: default;
      opacity: 0.85;
    }
    /* Once the bar has sat untouched (see NUDGE_DELAY), a warm "flame" comet chases the
       border so pending changes don't get missed. A masked conic-gradient keeps it inside
       the bar's rounded box (which clips overflow). */
    .bar.nudge::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 3px;
      background: conic-gradient(
        from var(--chorus-flame, 0deg),
        transparent 0deg,
        #fbbf24 35deg,
        #f97316 70deg,
        #ef4444 105deg,
        #a855f7 145deg,
        transparent 195deg,
        transparent 360deg
      );
      -webkit-mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      mask-composite: exclude;
      animation: chorusFlame 2.4s linear infinite;
      pointer-events: none;
    }

    .apply-spin {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      border: 2px solid color-mix(in srgb, currentColor 40%, transparent);
      border-top-color: currentColor;
      animation: spin 0.7s linear infinite;
      flex: none;
    }

    button:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .list {
      max-height: 240px;
      overflow-y: auto;
      padding: 0 16px 10px;
    }
    .list[hidden] {
      display: none;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 2px;
      border-top: 1px solid var(--divider-color);
      font-size: 12.5px;
    }

    .summary {
      color: var(--primary-text-color);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .row.skipped .summary {
      color: var(--secondary-text-color);
    }

    /* Per-row status indicator: a fixed-size disc that each status restyles. */
    .state {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1.6px solid var(--divider-color);
      background: transparent;
      flex: none;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .state svg {
      width: 12px;
      height: 12px;
    }

    /* pending: hollow disc (the base .state look) */

    /* running: spinning ring */
    .state.running {
      border-color: var(--divider-color);
      border-top-color: var(--primary-color);
      animation: spin 0.7s linear infinite;
    }

    /* done: filled green with a check */
    .state.done {
      background: var(--cb-done);
      border-color: var(--cb-done);
    }
    .state.done svg {
      stroke: var(--text-primary-color, #fff);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* error: filled red with an x */
    .state.error {
      background: var(--cb-error);
      border-color: var(--cb-error);
    }
    .state.error svg {
      stroke: var(--text-primary-color, #fff);
      stroke-width: 3;
      stroke-linecap: round;
    }

    /* skipped: dimmed hollow disc */
    .state.skipped {
      border-style: dashed;
      opacity: 0.5;
    }

    /* Inline apply-progress strip: a thin footer inside the card (never
       floating). Track uses the divider color; fill uses the theme accent. */
    .progress {
      position: relative;
      height: 4px;
      margin: 0 16px 12px;
      border-radius: 999px;
      background: var(--divider-color);
      overflow: hidden;
    }

    .progress-fill {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      border-radius: inherit;
      background: var(--primary-color);
    }

    /* Determinate: fill width is driven by inline style; animate between
       updates so the bar glides rather than jumps. */
    .progress.determinate .progress-fill {
      width: 0;
      transition: width 0.3s ease;
    }

    /* Indeterminate: a short segment sweeps left→right on repeat. */
    .progress.indeterminate .progress-fill {
      width: 35%;
      animation: cb-sweep 1.2s ease-in-out infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Registered so the conic-gradient's start angle can be animated smoothly. */
    @property --chorus-flame {
      syntax: "<angle>";
      inherits: false;
      initial-value: 0deg;
    }
    @keyframes chorusFlame {
      to {
        --chorus-flame: 360deg;
      }
    }

    @keyframes cb-sweep {
      0% {
        left: -35%;
      }
      100% {
        left: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .apply-spin,
      .state.running {
        animation: none;
      }
      /* No motion — the static warm border arc still flags the pending Apply. */
      .bar.nudge::before {
        animation: none;
      }
      /* No sweep: show a static, subtly-filled bar so the strip still reads
         as "in progress" without motion. */
      .progress.indeterminate .progress-fill {
        animation: none;
        left: 0;
        width: 40%;
        opacity: 0.7;
      }
      .progress.determinate .progress-fill {
        transition: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "chorus-changebar": ChorusChangebar;
  }
}
