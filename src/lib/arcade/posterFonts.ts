// ============================================================
// Quick Play poster fonts for the exported PNG. html-to-image renders the
// poster inside an SVG image, where page web fonts don't apply; the site's
// ShareModal exports with skipFonts, which is fine for system-font posters but
// would turn the arcade poster's Jersey 10 numbers into a fallback face.
// This builds an @font-face block with the self-hosted woff2 files inlined as
// data URLs (fetched once, cached) and hands it to html-to-image as
// fontEmbedCSS. Same files the page already serves — nothing from Google.
// ============================================================
const FILES = [
  { family: "Jersey 10", weight: 400, url: "/fonts/arcade/jersey-10-latin-400-normal.woff2" },
  { family: "Archivo", weight: 500, url: "/fonts/archivo-latin-500-normal.woff2" },
  { family: "Archivo", weight: 600, url: "/fonts/archivo-latin-600-normal.woff2" },
  { family: "Archivo", weight: 700, url: "/fonts/archivo-latin-700-normal.woff2" },
  // the combo poster (designer 2026-11-06): Chakra Petch for its text, Russo One for the COMBO word
  { family: "Chakra Petch", weight: 500, url: "/fonts/arcade/chakra-petch-latin-500-normal.woff2" },
  { family: "Chakra Petch", weight: 600, url: "/fonts/arcade/chakra-petch-latin-600-normal.woff2" },
  { family: "Chakra Petch", weight: 700, url: "/fonts/arcade/chakra-petch-latin-700-normal.woff2" },
  { family: "Russo One", weight: 400, url: "/fonts/arcade/russo-one-latin-400-normal.woff2" },
];

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });

let cache: Promise<string> | null = null;

export const arcadePosterFontCSS = (): Promise<string> => {
  if (!cache) {
    cache = Promise.all(
      FILES.map(async (f) => {
        const res = await fetch(f.url);
        if (!res.ok) throw new Error(`font ${f.url} ${res.status}`);
        const data = await toDataUrl(await res.blob());
        return `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};src:url(${data}) format('woff2');}`;
      }),
    )
      .then((rules) => rules.join("\n"))
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
};
