import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

/** One tip row: an icon tile, a bold title and a one-line description. */
interface Tip {
  /** Accent class applied to the icon tile. */
  accent: "front" | "rear" | "sub" | "neutral";
  /** Inline SVG markup for the tile glyph. */
  icon: TemplateResult;
  title: string;
  text: string;
}

// Minimal, single-stroke glyphs. `currentColor` lets each tile tint its own icon.
const stroke = { fill: "none", width: "1.7" } as const;

const iconTap = html`<svg
  viewBox="0 0 24 24"
  fill=${stroke.fill}
  stroke="currentColor"
  stroke-width=${stroke.width}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M9 11V6a2 2 0 0 1 4 0v5" />
  <path d="M13 8a2 2 0 0 1 4 0v3" />
  <path d="M17 9.5a2 2 0 0 1 4 0V15a6 6 0 0 1-6 6h-2.5a5 5 0 0 1-4-2l-3-4a2 2 0 0 1 3-2.6L9 11" />
</svg>`;

const iconPalette = html`<svg
  viewBox="0 0 24 24"
  fill=${stroke.fill}
  stroke="currentColor"
  stroke-width=${stroke.width}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="3" y="4" width="5.5" height="16" rx="1.6" />
  <rect x="9.25" y="4" width="5.5" height="16" rx="1.6" />
  <rect x="15.5" y="4" width="5.5" height="16" rx="1.6" />
</svg>`;

const iconDots = html`<svg
  viewBox="0 0 24 24"
  fill="currentColor"
  stroke="none"
>
  <circle cx="5" cy="12" r="1.8" />
  <circle cx="12" cy="12" r="1.8" />
  <circle cx="19" cy="12" r="1.8" />
</svg>`;

const iconCheck = html`<svg
  viewBox="0 0 24 24"
  fill=${stroke.fill}
  stroke="currentColor"
  stroke-width=${stroke.width}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M4 12.5l5 5L20 6" />
</svg>`;

const iconOverview = html`<svg
  viewBox="0 0 24 24"
  fill=${stroke.fill}
  stroke="currentColor"
  stroke-width=${stroke.width}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
  <path d="M3.5 9.5h17" />
  <path d="M8.5 9.5v10" />
</svg>`;

const TIPS: readonly Tip[] = [
  {
    accent: "front",
    icon: iconTap,
    title: "Tap or drag to assign",
    text: "Tap an empty channel — or drag a speaker onto it — to add it to a home theater.",
  },
  {
    accent: "rear",
    icon: iconPalette,
    title: "Channels are color-coded",
    text: "Front is blue, Rear is teal, Sub is indigo.",
  },
  {
    accent: "neutral",
    icon: iconDots,
    title: "••• for actions",
    text: "Room, pair, and speaker menus: separate, swap L/R, audio settings, move to another room, identify.",
  },
  {
    accent: "sub",
    icon: iconCheck,
    title: "Nothing changes until Apply",
    text: "Edits stage locally; the change bar shows what's pending, and Apply pushes it to your speakers.",
  },
  {
    accent: "neutral",
    icon: iconOverview,
    title: "Overview tab",
    text: "A read-only, at-a-glance view of everything currently bonded.",
  },
];

/**
 * A dumb, presentational "how this works" help modal for Chorus.
 *
 * It renders static overview content and nothing else: no business logic, no
 * Home Assistant calls. Drive it by setting `open`; it emits a composed +
 * bubbling `close` event when the user taps "Got it", clicks the backdrop, or
 * presses Escape. The host is responsible for flipping `open` back to false.
 */
@customElement("chorus-help")
export class ChorusHelp extends LitElement {
  @property({ type: Boolean }) public open = false;

  private readonly _onKeyDown = (ev: KeyboardEvent): void => {
    if (this.open && ev.key === "Escape") {
      ev.stopPropagation();
      this._close();
    }
  };

  public override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this._onKeyDown);
  }

  public override disconnectedCallback(): void {
    window.removeEventListener("keydown", this._onKeyDown);
    super.disconnectedCallback();
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  // Clicks that reach the backdrop (not the card) dismiss the modal.
  private _onBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) this._close();
  }

  public override render(): TemplateResult | typeof nothing {
    if (!this.open) return nothing;
    return html`
      <div class="backdrop" @click=${this._onBackdrop}>
        <div
          class="card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chorus-help-title"
        >
          <header class="head">
            <div class="dots" aria-hidden="true">
              <i class="d-front"></i>
              <i class="d-rear"></i>
              <i class="d-sub"></i>
              <i class="d-rear"></i>
              <i class="d-front"></i>
            </div>
            <h2 id="chorus-help-title">Chorus</h2>
            <p class="sub">Configure Sonos bonding — no cloud, all local.</p>
          </header>

          <ul class="tips">
            ${TIPS.map(
              (tip) => html`
                <li class="tip">
                  <div class="tile ${tip.accent}" aria-hidden="true">${tip.icon}</div>
                  <div class="tt">
                    <b>${tip.title}</b>
                    <span>${tip.text}</span>
                  </div>
                </li>
              `
            )}
          </ul>

          <button type="button" class="done" @click=${this._close}>Got it</button>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: contents;
      /* Channel accents, shared by the flourish dots and the tip tiles.
         Front = blue, Rear = teal, Sub = indigo. */
      --c-front: var(--info-color, #2196f3);
      --c-rear: #009688;
      --c-sub: #3f51b5;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 1100;
      background: rgba(0, 0, 0, 0.32);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: fade 0.2s ease;
    }

    .card {
      /* ~404px with 26px padding keeps the body copy to a comfortable measure. */
      width: 404px;
      max-width: 100%;
      max-height: 86vh;
      overflow-y: auto;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 20px;
      box-shadow: 0 30px 90px -24px rgba(0, 0, 0, 0.55);
      padding: 26px;
      animation: rise 0.24s cubic-bezier(0.34, 1.4, 0.6, 1);
    }

    .head {
      text-align: center;
      margin-bottom: 18px;
    }

    /* Decorative flourish: a centered row of five small colored marks,
       symmetric front · rear · sub · rear · front. */
    .dots {
      display: flex;
      gap: 7px;
      justify-content: center;
      margin: 0 0 16px;
    }
    .dots i {
      display: block;
      width: 11px;
      height: 11px;
      border-radius: 50%;
    }
    .d-front {
      background: var(--c-front);
    }
    .d-rear {
      background: var(--c-rear);
    }
    .d-sub {
      background: var(--c-sub);
    }

    .head h2 {
      margin: 0 0 5px;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--primary-text-color);
    }
    .head .sub {
      margin: 0;
      font-size: 13.5px;
      line-height: 1.5;
      color: var(--secondary-text-color);
    }

    .tips {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .tip {
      display: flex;
      align-items: flex-start;
      gap: 13px;
      padding: 8px 0;
    }

    .tile {
      flex: 0 0 auto;
      width: 40px;
      height: 40px;
      border-radius: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Tint the tile from an accent color mixed into the card background. */
      background: color-mix(in srgb, var(--tile-accent) 16%, transparent);
      color: var(--tile-accent);
    }
    .tile svg {
      width: 22px;
      height: 22px;
    }
    /* Front = blue, Rear = teal, Sub = indigo; neutral falls back to the theme. */
    .tile.front {
      --tile-accent: var(--c-front);
    }
    .tile.rear {
      --tile-accent: var(--c-rear);
    }
    .tile.sub {
      --tile-accent: var(--c-sub);
    }
    .tile.neutral {
      --tile-accent: var(--primary-color);
    }

    .tt {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }
    .tt b {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.3;
      color: var(--primary-text-color);
    }
    .tt span {
      font-size: 12.5px;
      line-height: 1.45;
      color: var(--secondary-text-color);
    }

    .done {
      width: 100%;
      border: none;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      padding: 12px;
      border-radius: 980px;
      cursor: pointer;
      margin-top: 18px;
      transition: filter 0.12s ease, transform 0.12s ease;
    }
    .done:hover {
      filter: brightness(1.06);
    }
    .done:active {
      transform: scale(0.98);
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
      .card,
      .done {
        animation: none;
        transition: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "chorus-help": ChorusHelp;
  }
}
