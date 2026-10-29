// ============================================================
// Sprite frames as blob URLs. Swapping an <img>'s src between four PNGs
// every few frames made the browser revalidate each one against the CDN
// (the files ship without Cache-Control), tens of thousands of requests
// per session (QA 2026-10-29). Fetch each frame once and hand out an
// object URL; the fallback is the original path.
// ============================================================
const cache = new Map<string, Promise<string>>();

export const spriteUrl = (url: string): Promise<string> => {
  if (typeof window === "undefined") return Promise.resolve(url);
  let p = cache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => URL.createObjectURL(b))
      .catch(() => url);
    cache.set(url, p);
  }
  return p;
};

export const spriteUrls = (urls: string[]) => Promise.all(urls.map(spriteUrl));
