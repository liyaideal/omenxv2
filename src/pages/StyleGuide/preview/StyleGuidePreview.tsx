import { Suspense, lazy, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { previewRegistry } from "./registry";

/**
 * Chrome-free preview route consumed by <DeviceFrame> via iframe.
 * URL: /style-guide/preview?c=<registry-key>
 *
 * The iframe has its own viewport so Tailwind `md:` breakpoints resolve
 * against the iframe width (375 → true mobile), not the parent window.
 * Reports its scrollHeight to the parent so the frame can auto-size.
 *
 * The registry hands back a dynamic-import loader, so this route only ever
 * downloads the chunk for the requested case.
 */
const StyleGuidePreview = () => {
  const [params] = useSearchParams();
  const key = params.get("c") ?? "";
  const ref = useRef<HTMLDivElement>(null);

  const Component = useMemo(() => {
    const loader = previewRegistry[key];
    if (!loader) return null;
    return lazy(async () => ({ default: await loader() }));
  }, [key]);

  useEffect(() => {
    if (!ref.current) return;
    const post = () => {
      const h = document.documentElement.scrollHeight;
      window.parent?.postMessage({ __styleGuidePreview: true, key, height: h }, "*");
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [key]);

  return (
    <div ref={ref} className="min-h-0 bg-background text-foreground p-4">
      {Component ? (
        <Suspense
          fallback={<div className="h-24 animate-pulse rounded-md bg-muted/20" aria-hidden />}
        >
          <Component />
        </Suspense>
      ) : (
        <div className="text-sm text-muted-foreground">
          Unknown preview key: <code className="font-mono">{key}</code>
        </div>
      )}
    </div>
  );
};

export default StyleGuidePreview;
