import { svg, type SVGTemplateResult } from "lit";
import { speakerKind } from "./model.js";
// Re-exported for existing importers; the impl lives in the pure model.ts now.
export { shortModel } from "./model.js";

// Speaker glyphs — ported verbatim from the prototype's ICON set. Keyed by the
// capability registry's `icon` field so a model string maps straight to a glyph.
const wrap = (inner: SVGTemplateResult): SVGTemplateResult =>
  svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

export const ICONS: Record<string, SVGTemplateResult> = {
  soundbar: wrap(
    svg`<rect x="2.8" y="9" width="18.4" height="6" rx="1.5"/><line x1="8" y1="10.7" x2="8" y2="13.3"/><line x1="12" y1="10.7" x2="12" y2="13.3"/><line x1="16" y1="10.7" x2="16" y2="13.3"/>`
  ),
  sub: wrap(svg`<rect x="5.5" y="4" width="13" height="16" rx="4"/><circle cx="12" cy="12" r="3.4"/>`),
  era: wrap(
    svg`<path d="M4.4 9.4 Q4.4 7 6.8 7 L17.2 7 Q19.6 7 19.6 9.4 L19.6 14.6 Q19.6 17 17.2 17 L6.8 17 Q4.4 17 4.4 14.6 Z"/><circle cx="12" cy="12" r="2.3"/><circle cx="12" cy="4.7" r="1"/>`
  ),
  book: wrap(svg`<rect x="7" y="3.5" width="10" height="17" rx="2.5"/><circle cx="12" cy="14" r="2.6"/><circle cx="12" cy="7" r="1"/>`),
  lamp: wrap(
    svg`<path d="M8 9 L16 9 L14.4 4.5 L9.6 4.5 Z"/><line x1="12" y1="9" x2="12" y2="18"/><line x1="8.5" y1="18" x2="15.5" y2="18"/>`
  ),
  frame: wrap(svg`<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><rect x="6.6" y="8.6" width="10.8" height="6.8" rx="1"/>`),
  connect: wrap(svg`<rect x="3.5" y="8" width="17" height="8" rx="2.5"/><circle cx="17" cy="12" r="1.1" fill="currentColor" stroke="none"/>`),
  driver: wrap(svg`<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4"/>`),
};

export function iconFor(model: string | null | undefined): SVGTemplateResult {
  return ICONS[speakerKind(model).icon] ?? ICONS.driver;
}
