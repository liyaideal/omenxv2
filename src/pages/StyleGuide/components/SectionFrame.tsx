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
  // `minHeight` is ONLY a loading placeholder. Once the iframe reports its real
  // document height we follow it exactly — otherwise a case shorter than the
  // hand-guessed estimate leaves a blank band (and the errors accumulate down
  // the page).
  const [reported, setReported] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const height = reported ?? minHeight;

  const keyParam = cases.map((c) => c.key).join(",");
  const labelParam = cases.map((c) => c.label).join("|");
  const width = device === "mobile" ? 375 : null;
  const fid = `${device}::${keyParam}`;

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
      if (d.fid !== fid) return;
      setReported(Math.max(48, Math.ceil(d.height) + 4));
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [fid]);

  const src = `/style-guide/preview?c=${encodeURIComponent(keyParam)}&l=${encodeURIComponent(labelParam)}&fid=${encodeURIComponent(fid)}`;

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
      <div className="space-y-5">
        {cases
          .filter((c) => c.note || c.spec?.length)
          .map((c) => (
            <div key={c.key} className="space-y-2 text-[11px] leading-relaxed">
              <div className="font-mono uppercase tracking-wider text-muted-foreground/80">{c.label}</div>
              {c.note && <p className="text-muted-foreground">{c.note}</p>}
              {c.spec?.length ? (
                <div className="overflow-x-auto rounded-md border border-border/40">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        <th className="px-2 py-1.5 font-medium">状态</th>
                        <th className="px-2 py-1.5 font-medium">触发条件（字段 / 公式）</th>
                        <th className="px-2 py-1.5 font-medium">视觉结果</th>
                        <th className="px-2 py-1.5 font-medium">数据来源</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.spec.map((r) => (
                        <tr key={r.state} className="border-t border-border/30 align-top">
                          <td className="px-2 py-1.5 font-medium text-foreground/90">{r.state}</td>
                          <td className="px-2 py-1.5 font-mono text-[10.5px] text-muted-foreground">{r.when}</td>
                          <td className="px-2 py-1.5 text-muted-foreground">{r.visual}</td>
                          <td className="px-2 py-1.5 font-mono text-[10.5px] text-muted-foreground/70">
                            {r.source ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ))}
      </div>
    </div>
  );
};
