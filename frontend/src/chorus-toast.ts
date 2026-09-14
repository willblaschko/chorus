import { LitElement, html, css, svg, nothing, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";

// Ported from the prototype's WAVE glyph: a small speaker + two sound arcs.
const WAVE = svg`
  <path d="M4 9.5v5h3.3L11.5 18V6L7.3 9.5H4z" fill="currentColor" stroke="none" />
  <path d="M15 9.3a4 4 0 0 1 0 5.4" />
  <path d="M17.7 6.5a8 8 0 0 1 0 11" />
`;

const DURATION_MS = 2700;

/**
 * Transient activity toast for the editor. A rounded pill pinned bottom-center that
 * confirms edits ("Bookshelf → Front L", "Home theater separated"), then auto-dismisses.
 *
 * Host-driven via the imperative `show(message)` API — there is one toast at a time:
 * a fresh `show()` before the timer fires swaps the message and restarts the clock
 * rather than stacking.
 */
@customElement("chorus-toast")
export class ChorusToast extends LitElement {
  @state() private _message = "";
  @state() private _visible = false;

  private _timer?: number;

  /**
   * Pop the toast with `message`, auto-hiding after ~2700ms. Calling again before the
   * timer fires clears the old timer, swaps the message, and restarts — no stacking.
   */
  public show(message: string): void {
    this._clearTimer();
    this._message = message;
    this._visible = true;
    this._timer = window.setTimeout(() => {
      this._visible = false;
      this._timer = undefined;
    }, DURATION_MS);
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearTimer();
  }

  private _clearTimer(): void {
    if (this._timer !== undefined) {
      window.clearTimeout(this._timer);
      this._timer = undefined;
    }
  }

  public override render(): TemplateResult | typeof nothing {
    // Nothing rendered until the first show(); after that the pill stays mounted so
    // the fade/slide-out animation has something to transition.
    if (!this._message) return nothing;
    return html`
      <div class="toast ${this._visible ? "on" : ""}" role="status" aria-live="polite">
        <span class="wave">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            ${WAVE}
          </svg>
        </span>
        <span class="msg">${this._message}</span>
      </div>
    `;
  }

  static override styles = css`
    :host {
      position: fixed;
      /* Centre under the editor content (var set by chorus-editor), not the viewport. */
      left: var(--chorus-bar-left, 50%);
      bottom: 30px;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      pointer-events: none;
    }
    .toast {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      max-width: min(90vw, 420px);
      padding: 12px 20px;
      border-radius: 980px;
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      box-shadow: var(--ha-card-box-shadow, 0 18px 44px -14px rgba(0, 0, 0, 0.4));
      color: var(--primary-text-color);
      font-size: 13.5px;
      font-weight: 500;
      opacity: 0;
      transform: translateY(10px) scale(0.97);
      transition: opacity 0.32s cubic-bezier(0.34, 1.4, 0.6, 1),
        transform 0.32s cubic-bezier(0.34, 1.4, 0.6, 1);
    }
    .toast.on {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .wave {
      display: grid;
      place-items: center;
      color: var(--primary-color);
      flex: none;
    }
    .wave svg {
      width: 17px;
      height: 17px;
      display: block;
    }
    .msg {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    @media (prefers-reduced-motion: reduce) {
      .toast {
        transition: none;
        transform: none;
      }
      .toast.on {
        transform: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "chorus-toast": ChorusToast;
  }
}
