// ============================================================
// Approved hand-authored lynx line art. Coordinates are LOCKED —
// never redraw, simplify, reflow or round any value.
// Filled elements (pupils, nose, spots, tail tip) render with
// fill="currentColor" stroke="none"; everything else is stroked.
// ============================================================

/** Head mark geometry, viewBox 0 0 120 98. */
export const LynxHeadArt = () => (
  <>
    <path d="M34,12 L29,4" />
    <path d="M34,12 L34.5,3" />
    <path d="M86,12 L91,4" />
    <path d="M85.5,12 L85,3" />
    <path d="M28,40 L34,12 L52,26" />
    <path d="M92,40 L86,12 L68,26" />
    <path d="M52,26 L56,22.5 L60,26 L64,22.5 L68,26" />
    <path d="M54,31 L53,37" />
    <path d="M60,30 L60,36" />
    <path d="M66,31 L67,37" />
    <path d="M28,40 C24,46 23,52 26,57 L20,59.5 L26,62 L21,67 L28,68 L25,72 L33,72.5" />
    <path d="M33,72.5 C39,80 81,80 87,72.5" />
    <path d="M92,40 C96,46 97,52 94,57 L100,59.5 L94,62 L99,67 L92,68 L95,72 L87,72.5" />
    <path d="M39,50 L53,54" />
    <path d="M81,50 L67,54" />
    <circle fill="currentColor" stroke="none" cx="46.5" cy="57.5" r="2.7" />
    <circle fill="currentColor" stroke="none" cx="73.5" cy="57.5" r="2.7" />
    <path d="M58,46 L58.5,50" />
    <path d="M62,46 L61.5,50" />
    <path fill="currentColor" stroke="none" d="M56,63.5 L64,63.5 L60,68 Z" />
    <path d="M60,68 L60,70.5" />
    <path d="M54,74 Q60,71.5 66,74" />
    <path d="M34,59 L41,60.5" />
    <path d="M86,59 L79,60.5" />
    <path d="M12,57 L26,59" />
    <path d="M14,64 L26,62.5" />
    <path d="M108,57 L94,59" />
    <path d="M106,64 L94,62.5" />
  </>
);

/** Chibi body group, appended under the head for LynxFigure. */
export const LynxBodyArt = () => (
  <g transform="translate(60,74) scale(0.62) translate(-60,-74)" strokeWidth={4.2}>
    <path d="M37,76 C31,88 29,104 31,118 C32,131 35,140 44,144" />
    <path d="M83,76 C89,88 91,104 89,118 C88,131 85,140 76,144" />
    <path d="M44,144 C44,147.2 57,147.2 57,143.5 L57,138.5 C57,135 63,135 63,138.5 L63,143.5 C63,147.2 76,147.2 76,144" />
    <path d="M49,146 L49,143" />
    <path d="M52.5,146.4 L52.5,143.2" />
    <path d="M67.5,146.4 L67.5,143.2" />
    <path d="M71,146 L71,143" />
    <circle fill="currentColor" stroke="none" cx="38" cy="108" r="1.9" />
    <circle fill="currentColor" stroke="none" cx="42" cy="120" r="1.9" />
    <circle fill="currentColor" stroke="none" cx="39.5" cy="128" r="1.6" />
    <circle fill="currentColor" stroke="none" cx="82" cy="108" r="1.9" />
    <circle fill="currentColor" stroke="none" cx="78" cy="120" r="1.9" />
    <circle fill="currentColor" stroke="none" cx="80.5" cy="128" r="1.6" />
    <path d="M80.5,135.5 C90,135.5 95.5,129.5 94.5,122 C94.2,118.8 98.8,118 99.6,121.4 C101,130.5 93,141 80.5,140.5" />
    <path d="M92,133 L97.6,130.2" />
    <circle fill="currentColor" stroke="none" cx="97" cy="120.6" r="2" />
  </g>
);

export interface LynxProps {
  /** Rendered height in px. Width derives from the viewBox aspect ratio. */
  size?: number;
  /** Default 2.6. Use ~3.4 at size ≤ 48 so lines stay legible. */
  strokeWidth?: number;
  className?: string;
}
