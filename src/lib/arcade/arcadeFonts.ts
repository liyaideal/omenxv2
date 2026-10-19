// ============================================================
// Quick Play (arcade) fonts — Jersey 10 / VT323 / Chakra Petch, self-hosted
// under public/fonts/arcade (fonts.googleapis.com is unreachable from
// mainland China — same rule as /fonts/fonts.css). Loaded on demand by the
// arcade page and the Quick Play entry banner, not site-wide.
// ============================================================
const HREF = "/fonts/arcade/arcade-fonts.css";

export const ensureArcadeFonts = () => {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[href="${HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = HREF;
  document.head.appendChild(link);
};
