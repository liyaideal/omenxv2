import { Suspense, lazy, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { previewRegistry } from "./registry";

/**
 * Chrome-free preview route consumed by <DeviceFrame> / <SectionFrame> via iframe.
 *
 * URL forms:
 *   /style-guide/preview?c=<key>                    single case
 *   /style-guide/preview?c=<k1>,<k2>,<k3>&l=<a|b|c> batched section (ONE React root)
 *
 * Batching matters for perf: every iframe boots its own React root + document,
 * so a section with 10 cases used to cost 10 boots. One iframe per section per
 * device collapses that to a single boot, and cases sharing a chunk evaluate
 * that chunk exactly once.
 *
 * The iframe has its own viewport so Tailwind `md:` breakpoints resolve
 * against the iframe width (375 → true mobile), not the parent window.
 * Reports its scrollHeight to the parent so the frame can auto-size.
 */
const Case = ({ id, label }: { id: string; label?: string }) => {
  const Component = useMemo(() => {
    const loader = previewRegistry[id];
    if (!loader) return null;
    return lazy(async () => ({ default: await loader() }));
  }, [id]);

  return (
    <section className="space-y-2">
      {label && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
            {label}
          </span>
          <span className="h-px flex-1 bg-border/40" />
        </div>
      )}
      {Component ? (
        <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-muted/20" aria-hidden />}>
          <Component />
        </Suspense>
      ) : (
        <div className="text-sm text-muted-foreground">
          Unknown preview key: <code className="font-mono">{id}</code>
        </div>
      )}
    </section>
  );
};

const StyleGuidePreview = () => {
  const [params] = useSearchParams();
  const raw = params.get("c") ?? "";
  const key = raw;
  // Frame id — desktop and mobile frames of one section share the same `c=`,
  // so height messages MUST be addressed per frame or the two cross-talk.
  const fid = params.get("fid") ?? raw;
  const ref = useRef<HTMLDivElement>(null);

  const keys = useMemo(() => raw.split(",").map((k) => k.trim()).filter(Boolean), [raw]);
  const labels = useMemo(() => (params.get("l") ?? "").split("|"), [params]);

  // Auto-height: measure the CONTENT wrapper, never documentElement.
  // documentElement.scrollHeight is floored by the iframe's own height, so it
  // can only ratchet upward — content that shrinks (or is shorter than the
  // parent's placeholder minHeight) would leave a permanent blank band.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const post = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h <= 0) return;
      window.parent?.postMessage({ __styleGuidePreview: true, key, fid, height: h }, "*");
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(post);
    };
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    // Late layout shifts (fonts, lazy chunks, images) after first paint.
    const t1 = window.setTimeout(schedule, 300);
    const t2 = window.setTimeout(schedule, 1200);
    window.addEventListener("load", schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("load", schedule);
    };
  }, [key, fid]);

  return (
    <div ref={ref} className="min-h-0 bg-background text-foreground p-4 space-y-8">
      {keys.length === 0 ? (
        <div className="text-sm text-muted-foreground">Missing preview key.</div>
      ) : (
        keys.map((k, i) => (
          <Case key={k} id={k} label={keys.length > 1 ? labels[i] || k : undefined} />
        ))
      )}
    </div>
  );
};

export default StyleGuidePreview;
