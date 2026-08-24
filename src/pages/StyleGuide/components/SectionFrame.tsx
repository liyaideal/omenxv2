import { useEffect, useRef, useState } from "react";

type Device = "desktop" | "mobile";

/**
 * One row of the trigger table under a case.
 * `when` MUST be a decidable expression (field / formula), never an adjective —
 * this document is read as a spec, not as a gallery.
 */
export type SectionSpecRow = {
  /** state name as it appears in the preview */
  state: string;
  /** the exact condition that produces it */
  when: string;
  /** what the user sees when the condition holds */
  visual: string;
  /** field / hook / component the condition comes from */
  source?: string;
};

export type SectionCase = {
  /** registry key */
  key: string;
  /** label rendered inside the iframe above the case */
  label: string;
  /** free-form supplementary note (context, not trigger rules) */
  note?: string;
  /** trigger table — one row per visual state */
  spec?: SectionSpecRow[];
};

/**
 * ONE iframe for a whole style-guide section (per device).
 *
 * Rationale: each iframe is an independent document + React root. Rendering a
 * frame per case meant a 12-case section paid 12 boots. Batching the section
 * into a single `/style-guide/preview?c=k1,k2,...` document collapses that to
 * one boot, and cases sharing a chunk evaluate it once. The iframe is still
 * required — it is the only way `md:` breakpoints resolve against a real
 * 375px viewport.
 *
 * Mounted lazily on approach, never unmounted (mount-once).
 */
export const SectionFrame = ({
  cases,
  device,
  minHeight = 320,
}: {
  cases: SectionCase[];
  device: Device;
  minHeight?: number;
}) => {
  const holderRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(minHeight);
  const [mounted, setMounted] = useState(false);

  const keyParam = cases.map((c) => c.key).join(",");
  const labelParam = cases.map((c) => c.label).join("|");
  const width = device === "mobile" ? 375 : null;

  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }
    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          near.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    near.observe(el);
    return () => near.disconnect();
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || !d.__styleGuidePreview) return;
      if (d.key !== keyParam) return;
      setHeight(Math.max(minHeight, d.height + 16));
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [keyParam, minHeight]);

  const src = `/style-guide/preview?c=${encodeURIComponent(keyParam)}&l=${encodeURIComponent(labelParam)}`;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/40 bg-background/40 p-3 overflow-x-auto">
        <div ref={holderRef} className="mx-auto" style={width ? { width, maxWidth: width } : undefined}>
          {mounted ? (
            <iframe
              title={`section-preview-${device}-${keyParam}`}
              src={src}
              loading="lazy"
              className="w-full block border-0 rounded-md bg-background"
              style={{ height }}
            />
          ) : (
            <div
              className="w-full rounded-md border border-dashed border-border/40 bg-muted/20 animate-pulse"
              style={{ height }}
              aria-hidden
            />
          )}
        </div>
      </div>
      <div className="text-[10px] font-mono text-muted-foreground/70">
        1 iframe · {cases.length} cases · {device === "mobile" ? "375px" : "100%"} · real breakpoint
      </div>
      <dl className="space-y-2">
        {cases
          .filter((c) => c.note)
          .map((c) => (
            <div key={c.key} className="text-[11px] leading-relaxed">
              <dt className="font-mono uppercase tracking-wider text-muted-foreground/80">{c.label}</dt>
              <dd className="text-muted-foreground">{c.note}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
};
