/**
 * SEO head helper (2026-09-28, omenx-seo-geo). Lovable has no SSR, so this
 * writes title / meta / canonical / hreflang / JSON-LD into <head> on mount —
 * enough for a rendering crawler and for QA of the spec; the real platform
 * must emit the same tags server-side (docs/delivery/lite-insights-seo-v1.md §5).
 */
import { useEffect } from "react";
import { SITE_URL } from "@/lib/site";
import { SITE_LANGUAGES } from "@/lib/languages";

export interface SeoHead {
  title: string;
  description: string;
  /** Path starting with "/" — canonical = SITE_URL + path. */
  path: string;
  /** JSON-LD objects; each becomes its own <script type="application/ld+json" data-seo>. */
  jsonLd?: object[];
  ogType?: "website" | "article";
  /** Emit hreflang alternates for all site languages (placeholder until the real platform decides URL prefixes). */
  hreflang?: boolean;
}

const upsertMeta = (attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel: string, href: string, extra?: Record<string, string>) => {
  const sel = extra?.hreflang ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (extra) for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
    el.setAttribute("data-seo", "1");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export const useSeoHead = (head: SeoHead, deps: unknown[] = []) => {
  useEffect(() => {
    const canonical = `${SITE_URL}${head.path}`;
    document.title = head.title;
    upsertMeta("name", "description", head.description);
    upsertMeta("property", "og:title", head.title);
    upsertMeta("property", "og:description", head.description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", head.ogType ?? "website");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", head.title);
    upsertMeta("name", "twitter:description", head.description);
    upsertLink("canonical", canonical);
    if (head.hreflang) {
      // Placeholder: same URL for every language until the platform fixes /en /zh prefixes.
      upsertLink("alternate", canonical, { hreflang: "x-default" });
      for (const l of SITE_LANGUAGES) upsertLink("alternate", canonical, { hreflang: l.code });
    }
    document.head.querySelectorAll('script[data-seo="jsonld"]').forEach((n) => n.remove());
    for (const obj of head.jsonLd ?? []) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-seo", "jsonld");
      s.text = JSON.stringify(obj);
      document.head.appendChild(s);
    }
    return () => {
      document.head.querySelectorAll('script[data-seo="jsonld"]').forEach((n) => n.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
