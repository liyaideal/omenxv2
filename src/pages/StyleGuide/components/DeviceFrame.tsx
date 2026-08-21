import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PreviewKey } from "../preview/registry";

type Device = "desktop" | "mobile";

const DEVICE_WIDTH: Record<Device, number | null> = {
  desktop: null, // 100% of column (real desktop viewport in-iframe)
  mobile: 375,
};

/**
 * Renders a style-guide case inside a same-origin iframe so Tailwind
 * responsive breakpoints resolve against the iframe's real viewport width
 * — not the parent container. Only true way to preview `md:` behavior.
 */
export const DeviceFrame = ({
  previewKey,
  device,
  minHeight = 200,
}: {
  previewKey: PreviewKey | string;
  device: Device;
  minHeight?: number;
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(minHeight);
  // Viewport windowing: each preview iframe boots a full copy of the app, so
  // they are mounted on approach (600px) and UNMOUNTED once far off-screen
  // (>1600px). Unmounting tears the iframe document down, which also kills its
  // realtime subscriptions and intervals. Measured height is kept so the
  // placeholder holds the same space and scrolling stays stable.
  const [mounted, setMounted] = useState(false);
  const width = DEVICE_WIDTH[device];

  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }
    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setMounted(true);
      },
      { rootMargin: "600px 0px" },
    );
    const far = new IntersectionObserver(
      (entries) => {
        if (entries.every((e) => !e.isIntersecting)) setMounted(false);
      },
      { rootMargin: "1600px 0px" },
    );
    near.observe(el);
    far.observe(el);
    return () => {
      near.disconnect();
      far.disconnect();
    };
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || !d.__styleGuidePreview) return;
      if (d.key !== previewKey) return;
      setHeight(Math.max(minHeight, d.height + 16));
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [previewKey, minHeight]);

  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3 overflow-x-auto">
      <div ref={holderRef} className="mx-auto" style={width ? { width, maxWidth: width } : undefined}>
        {mounted ? (
          <iframe
            ref={iframeRef}
            title={`preview-${previewKey}-${device}`}
            src={`/style-guide/preview?c=${encodeURIComponent(previewKey)}`}
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
  );
};

export const DualDevicePreview = ({
  previewKey,
  label,
  defaultDevice = "desktop",
  minHeight,
}: {
  previewKey: PreviewKey | string;
  label?: string;
  defaultDevice?: Device;
  minHeight?: number;
}) => {
  const [device, setDevice] = useState<Device>(defaultDevice);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {label && <div className="text-[11px] text-muted-foreground">{label}</div>}
        <div className="flex items-center gap-1 bg-muted/40 rounded-md p-0.5 ml-auto">
          <Button
            size="sm"
            variant={device === "desktop" ? "secondary" : "ghost"}
            className="h-7 px-2 gap-1.5"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="text-[11px]">Desktop</span>
          </Button>
          <Button
            size="sm"
            variant={device === "mobile" ? "secondary" : "ghost"}
            className="h-7 px-2 gap-1.5"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[11px]">Mobile · 375</span>
          </Button>
        </div>
      </div>
      <DeviceFrame previewKey={previewKey} device={device} minHeight={minHeight} />
      <div className={cn("text-[10px] font-mono text-muted-foreground/70")}>
        iframe · {device === "mobile" ? "375px" : "100%"} · real breakpoint
      </div>
    </div>
  );
};
