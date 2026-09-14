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

  /** whether the details list is expanded (collapsed by default) */
  @state() private open = false;

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

    return html`
      <div
        class="bar ${expanded ? "open" : ""} ${this.busy ? "busy" : ""}"
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
            <b>${countLabel}</b>
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
      left: 50%;
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

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .apply-spin,
      .state.running {
        animation: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "chorus-changebar": ChorusChangebar;
  }
}
