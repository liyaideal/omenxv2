// ============================================================
// LITE EVENTS SKELETONS — module-level first-load placeholders for
// LiteEventsPage (`/` and `/events` on the Lite surface).
//
// Rules (CPO, 2026-08-13):
//  · Only on FIRST load (hook loading + no data). Cached re-renders and
//    tab switches render real content — never flash a skeleton.
//  · Each skeleton mirrors its module's final layout 1:1 (same card size,
//    radius, padding, row heights, badge slots) so CLS ≈ 0.
//  · Neutral only: #171A1F primary block / #15181C secondary block on the
//    production card chrome (#131519 / #1D2026). No volt, no #33D6FF.
//  · One shared pulse: `animate-pulse` on the module root.
// ============================================================
import { cn } from "@/lib/utils";

const BLOCK = "#171A1F";
const BLOCK_2 = "#15181C";

/** Neutral filled block — the single primitive every skeleton is built from. */
export const SkelBlock = ({
  w,
  h,
  r = 4,
  tone = "primary",
  className,
  style,
}: {
  w?: number | string;
  h: number | string;
  r?: number;
  tone?: "primary" | "secondary";
  className?: string;
  style?: React.CSSProperties;
}) => (
  <span
    aria-hidden
    className={cn("block shrink-0", className)}
    style={{
      width: w ?? "100%",
      height: h,
      borderRadius: r,
      background: tone === "primary" ? BLOCK : BLOCK_2,
      ...style,
    }}
  />
);

/* ---------------- Category rail / pills ---------------- */

/** Desktop category pill row (44px pills + right-end lens chips). */
export const LiteCategoryPillsSkeleton = () => (
  <div
    className="flex flex-wrap items-center gap-2 animate-pulse"
    style={{ marginTop: 16 }}
    aria-busy="true"
  >
    {[62, 84, 76, 70, 68, 74].map((w, i) => (
      <SkelBlock key={i} w={w} h={38} r={999} tone={i === 0 ? "primary" : "secondary"} />
    ))}
    <span aria-hidden style={{ width: 1, height: 22, background: "#1D2026", margin: "0 5px" }} />
    <SkelBlock w={76} h={38} r={999} tone="secondary" />
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <SkelBlock w={96} h={38} r={999} tone="secondary" />
      <SkelBlock w={44} h={38} r={999} tone="secondary" />
    </div>
  </div>
);

/** Mobile category row (44px chips + hairline, mirrors MobileCategoryRow). */
export const LiteMobileCategoryRowSkeleton = () => (
  <div
    className="flex items-center overflow-hidden animate-pulse"
    style={{ gap: 8, paddingBottom: 12, borderBottom: "1px solid #1D2026" }}
    aria-busy="true"
  >
    {[54, 82, 72, 66, 70].map((w, i) => (
      <SkelBlock key={i} w={w} h={44} r={999} tone={i === 0 ? "primary" : "secondary"} />
    ))}
    <span aria-hidden style={{ flex: "none", width: 1, height: 28, background: "#23262D" }} />
    <SkelBlock w={44} h={44} r={999} tone="secondary" />
  </div>
);

/* ---------------- Market cards ---------------- */

/** Desktop catalogue card — 130px art strip + 18px body + footer hairline. */
export const LiteEventCardSkeleton = () => (
  <div
    className="flex w-full flex-col overflow-hidden rounded-[16px] border border-[#1D2026] bg-[#131519] animate-pulse"
    aria-busy="true"
  >
    <div style={{ height: 130, background: BLOCK_2 }} />
    <div className="flex flex-1 flex-col p-[18px]">
      <SkelBlock w={88} h={10} tone="secondary" />
      <div className="mt-[7px] mb-4 flex min-h-[42px] flex-col gap-[6px]">
        <SkelBlock h={15} />
        <SkelBlock w="62%" h={15} />
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex gap-[10px]">
          <SkelBlock h={58} r={11} tone="secondary" />
          <SkelBlock h={58} r={11} tone="secondary" />
        </div>
      </div>
      <div className="mt-[14px] flex items-center justify-between border-t border-[#1D2026] pt-[10px]">
        <SkelBlock w={70} h={11} tone="secondary" />
        <SkelBlock w={96} h={11} tone="secondary" />
      </div>
    </div>
  </div>
);

/** Mobile catalogue card — 56px thumb + title, 44px chip pair. */
export const LiteMobileEventCardSkeleton = () => (
  <div
    className="flex w-full flex-col gap-3 rounded-[14px] border border-[#1D2026] bg-[#131519] p-3 animate-pulse"
    aria-busy="true"
  >
    <div className="flex items-start gap-3">
      <SkelBlock w={56} h={56} r={10} tone="secondary" />
      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <SkelBlock w={84} h={10} tone="secondary" />
        <SkelBlock h={14} />
        <SkelBlock w="55%" h={14} />
      </div>
    </div>
    <div className="flex gap-2">
      <SkelBlock h={44} r={10} tone="secondary" />
      <SkelBlock h={44} r={10} tone="secondary" />
    </div>
  </div>
);

/** Desktop catalogue grid — same 3-up grid and 18px gap as CardGrid. */
export const LiteMarketGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-[18px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <LiteEventCardSkeleton key={i} />
    ))}
  </div>
);

/** Mobile catalogue list — single column, 18px gap. */
export const LiteMarketListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-[18px]">
    {Array.from({ length: count }).map((_, i) => (
      <LiteMobileEventCardSkeleton key={i} />
    ))}
  </div>
);

/* ---------------- Stage cards (desktop All view) ---------------- */

/** Intraday stage card — dial rail + 2×2 round tiles. */
export const LiteIntradayStageSkeleton = () => (
  <div
    className="flex flex-col animate-pulse"
    style={{
      background: "#131519",
      border: "1px solid #1D2026",
      borderRadius: 16,
      padding: 14,
      gap: 14,
    }}
    aria-busy="true"
  >
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-[7px]">
        <SkelBlock w={150} h={10} tone="secondary" />
        <SkelBlock w={230} h={20} />
      </div>
      <SkelBlock w={210} h={38} r={10} tone="secondary" />
    </div>
    <div className="grid gap-[12px]" style={{ gridTemplateColumns: "1fr 1fr" }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col"
          style={{
            background: "#0F1114",
            border: "1px solid #1D2026",
            borderRadius: 14,
            padding: 13,
            gap: 11,
          }}
        >
          <div className="flex items-center" style={{ gap: 11 }}>
            <SkelBlock w={32} h={32} r={999} tone="secondary" />
            <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
              <SkelBlock w={90} h={9} tone="secondary" />
              <SkelBlock w={124} h={16} />
            </div>
            <SkelBlock w={62} h={20} tone="secondary" />
          </div>
          <SkelBlock h={52} r={9} tone="secondary" />
          <div className="flex" style={{ gap: 8 }}>
            <SkelBlock h={44} r={11} tone="secondary" />
            <SkelBlock h={44} r={11} tone="secondary" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Sports stage card — header, hero fixture, list rows, footer. */
export const LiteSportsStageSkeleton = () => (
  <div
    className="flex flex-col animate-pulse"
    style={{ background: "#131519", border: "1px solid #1D2026", borderRadius: 18 }}
    aria-busy="true"
  >
    <div className="flex flex-col gap-[8px]" style={{ padding: "20px 18px 14px" }}>
      <SkelBlock w={120} h={10} tone="secondary" />
      <SkelBlock w={190} h={20} />
    </div>
    <div className="flex flex-col gap-[10px]" style={{ padding: "0 18px 9px" }}>
      <SkelBlock h={64} r={12} tone="secondary" />
      <div className="flex gap-[10px]">
        <SkelBlock h={44} r={10} tone="secondary" />
        <SkelBlock h={44} r={10} tone="secondary" />
      </div>
    </div>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="flex items-center justify-between"
        style={{ padding: "13px 18px 14px", borderTop: "1px solid #16181D" }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
          <SkelBlock w={150} h={13} />
          <SkelBlock w={96} h={10} tone="secondary" />
        </div>
        <SkelBlock w={64} h={26} r={8} tone="secondary" />
      </div>
    ))}
    <div style={{ padding: "12px 18px 14px", borderTop: "1px solid #1D2026" }}>
      <SkelBlock w={130} h={12} tone="secondary" />
    </div>
  </div>
);

/** Desktop "All" stage — 62% intraday / 1fr sports, same grid as LiteAllStage. */
export const LiteAllStageSkeleton = () => (
  <div
    className="grid items-stretch gap-[16px]"
    style={{ gridTemplateColumns: "62% 1fr", marginTop: 20 }}
  >
    <LiteIntradayStageSkeleton />
    <LiteSportsStageSkeleton />
  </div>
);

/* ---------------- Mobile stage modules ---------------- */

/** Mobile intraday module — opening copy, round dial, coin tiles. */
export const LiteMobileIntradaySkeleton = () => (
  <section className="flex flex-col animate-pulse" style={{ gap: 12 }} aria-busy="true">
    <div className="flex flex-col" style={{ gap: 7 }}>
      <SkelBlock w={168} h={10} tone="secondary" />
      <SkelBlock w={240} h={22} />
      <SkelBlock w="86%" h={12} tone="secondary" />
    </div>
    <div
      className="flex items-center"
      style={{
        gap: 10,
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 12,
        padding: "8px 10px",
      }}
    >
      <SkelBlock w={44} h={10} tone="secondary" />
      <span className="flex flex-1" style={{ gap: 5 }}>
        {[0, 1, 2, 3].map((i) => (
          <SkelBlock key={i} w={58} h={44} r={9} tone="secondary" className="mr-[5px]" />
        ))}
      </span>
    </div>
    {[0, 1].map((i) => (
      <div
        key={i}
        className="flex flex-col"
        style={{
          background: "#131519",
          border: "1px solid #1D2026",
          borderRadius: 14,
          padding: "13px 14px",
          gap: 11,
        }}
      >
        <div className="flex items-center" style={{ gap: 11 }}>
          <SkelBlock w={32} h={32} r={999} tone="secondary" />
          <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <SkelBlock w={100} h={10} tone="secondary" />
            <SkelBlock w={140} h={18} />
          </div>
          <SkelBlock w={58} h={22} tone="secondary" />
        </div>
        <SkelBlock h={84} r={9} tone="secondary" />
        <SkelBlock w={150} h={12} tone="secondary" />
        <div className="flex" style={{ gap: 8 }}>
          <SkelBlock h={48} r={11} tone="secondary" />
          <SkelBlock h={48} r={11} tone="secondary" />
        </div>
      </div>
    ))}
  </section>
);

/** Mobile sports module — opening copy + fixture rows. */
export const LiteMobileSportsSkeleton = () => (
  <section className="flex flex-col animate-pulse" style={{ gap: 12 }} aria-busy="true">
    <div className="flex flex-col" style={{ gap: 7 }}>
      <SkelBlock w={140} h={10} tone="secondary" />
      <SkelBlock w={210} h={22} />
    </div>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="flex flex-col"
        style={{
          background: "#131519",
          border: "1px solid #1D2026",
          borderRadius: 14,
          padding: "13px 14px",
          gap: 11,
        }}
      >
        <div className="flex flex-col gap-[6px]">
          <SkelBlock w={110} h={10} tone="secondary" />
          <SkelBlock w="72%" h={15} />
        </div>
        <div className="flex" style={{ gap: 8 }}>
          <SkelBlock h={44} r={10} tone="secondary" />
          <SkelBlock h={44} r={10} tone="secondary" />
        </div>
      </div>
    ))}
  </section>
);

/** Mobile "All" stage — same 22px stack as LiteMobileAllStage. */
export const LiteMobileStageSkeleton = () => (
  <div className="flex flex-col" style={{ gap: 22, marginTop: 18 }}>
    <LiteMobileIntradaySkeleton />
    <LiteMobileSportsSkeleton />
  </div>
);
