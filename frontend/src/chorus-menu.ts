import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

/** A single selectable action in the sheet. */
export interface MenuItem {
  id: string; // returned in the `select` event
  label: string;
  sub?: string; // optional secondary line
  danger?: boolean; // render in the destructive/error color
  disabled?: boolean;
}

/**
 * A dumb, reusable contextual action menu / bottom-sheet.
 *
 * It is purely presentational: it renders from props, emits `select` (detail =
 * the chosen item's id) and `close`, and holds no business logic — it never
 * talks to Home Assistant. Drive it by setting `open`, `heading`, `subheading`
 * and `items`; react to the `select`/`close` events on the host.
 *
 * Both events are composed + bubbling so a parent across the shadow boundary can
 * listen. Selecting an item fires `select` then `close`; the backdrop, the
 * Cancel button, and the Escape key each fire `close` only.
 */
@customElement("chorus-menu")
export class ChorusMenu extends LitElement {
  @property({ type: String }) public heading = ""; // sheet title (optional)
  @property({ type: String }) public subheading = ""; // optional subtitle
  @property({ attribute: false }) public items: MenuItem[] = [];
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

  private _select(item: MenuItem): void {
    if (item.disabled) return;
    this.dispatchEvent(
      new CustomEvent("select", { detail: item.id, bubbles: true, composed: true })
    );
    this._close();
  }

  // Clicks that reach the backdrop (not the sheet) dismiss the menu.
  private _onBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) this._close();
  }

  public override render(): TemplateResult | typeof nothing {
    if (!this.open) return nothing;
    return html`
      <div class="backdrop" @click=${this._onBackdrop}>
        <div
          class="sheet"
          role="dialog"
          aria-modal="true"
          aria-label=${this.heading || "Actions"}
        >
          ${this.heading || this.subheading
            ? html`<div class="head">
                ${this.heading ? html`<b>${this.heading}</b>` : nothing}
                ${this.subheading ? html`<span>${this.subheading}</span>` : nothing}
              </div>`
            : nothing}
          <div class="items">
            ${this.items.map(
              (item) => html`
                <button
                  type="button"
                  class="item ${item.danger ? "danger" : ""}"
                  ?disabled=${item.disabled}
                  aria-disabled=${item.disabled ? "true" : "false"}
                  @click=${() => this._select(item)}
                >
                  <span class="label">${item.label}</span>
                  ${item.sub ? html`<span class="sub">${item.sub}</span>` : nothing}
                </button>
              `
            )}
          </div>
          <button type="button" class="cancel" @click=${this._close}>Cancel</button>
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

    .sheet {
      width: 360px;
      max-width: 100%;
      max-height: 82vh;
      overflow-y: auto;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 20px;
      box-shadow: 0 24px 70px -20px rgba(0, 0, 0, 0.55);
      padding: 8px;
      margin-bottom: max(8px, env(safe-area-inset-bottom));
      animation: rise 0.24s cubic-bezier(0.34, 1.4, 0.6, 1);
    }
    /* Center it as a true action-sheet on wider viewports. */
    @media (min-width: 560px) {
      .backdrop {
        align-items: center;
      }
    }

    .head {
      text-align: center;
      padding: 13px 12px 10px;
    }
    .head b {
      display: block;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .head span {
      display: block;
      font-size: 12.5px;
      color: var(--secondary-text-color);
      margin-top: 3px;
    }

    .items {
      display: flex;
      flex-direction: column;
    }

    .item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;
      border: none;
      background: none;
      font: inherit;
      color: var(--primary-text-color);
      text-align: left;
      padding: 12px 14px;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.12s ease;
    }
    .item + .item {
      border-top: 1px solid var(--divider-color);
      border-radius: 0;
    }
    .item:hover {
      background: var(--secondary-background-color);
    }
    .item:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }
    .item .label {
      font-size: 15px;
      line-height: 1.3;
    }
    .item .sub {
      font-size: 12.5px;
      color: var(--secondary-text-color);
      line-height: 1.3;
    }

    .item.danger .label {
      color: var(--error-color, #d32f2f);
    }
    .item.danger:hover {
      background: color-mix(in srgb, var(--error-color, #d32f2f) 12%, transparent);
    }

    .item:disabled {
      cursor: default;
      opacity: 0.4;
    }
    .item:disabled:hover {
      background: none;
    }

    .cancel {
      width: 100%;
      border: none;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      margin-top: 6px;
      transition: filter 0.12s ease;
    }
    .cancel:hover {
      filter: brightness(0.95);
    }
    .cancel:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
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
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "chorus-menu": ChorusMenu;
  }
}
