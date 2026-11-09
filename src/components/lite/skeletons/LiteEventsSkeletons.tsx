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

/* ---------------- Market cards ----------------
   Category rails/pills are static chrome — they render live on first
   load and are deliberately NOT skeletoned. */

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

/** Intraday stage card — header + 3-up coin tiles + "stocks closing today" rows. */
/* ---------------- Home · All view stage (首页 All 改版 D2-S3 / M-*, 2026-11-09) ----------------
   Mirrors the first two sections the viewer sees on first load: Sports (section
   head + day strip, left stage block, right table panel) and Crypto (head +
   clock, BTC block, ETH / SOL panel). The sections below the fold render when
   their own hooks land — no skeleton race. */

const SectionHeadSkeleton = ({ right }: { right?: number }) => (
  <div className="flex items-end justify-between" style={{ gap: 32 }}>
    <div className="flex flex-col" style={{ gap: 14 }}>
      <SkelBlock w={300} h={12} tone="secondary" />
      <SkelBlock w={420} h={44} r={8} />
    </div>
    {right ? <SkelBlock w={right} h={56} r={12} tone="secondary" /> : null}
  </div>
);

const TileSkeleton = () => (
  <div className="flex flex-col" style={{ gap: 10, padding: "14px 14px 12px", background: BLOCK_2, borderRadius: 12 }}>
    <div className="flex items-center justify-between">
      <SkelBlock w={30} h={30} r={15} />
      <SkelBlock w={48} h={16} tone="secondary" />
      <SkelBlock w={30} h={30} r={15} />
    </div>
    <SkelBlock w="60%" h={10} tone="secondary" className="mx-auto" />
    <div className="grid grid-cols-2" style={{ gap: 6 }}>
      <SkelBlock h={30} r={15} />
      <SkelBlock h={30} r={15} />
    </div>
  </div>
);

const RowSkeleton = () => (
  <div className="grid items-center" style={{ gridTemplateColumns: "52px 1fr 72px 72px", gap: 10, padding: "12px 0" }}>
    <div className="flex">
      <SkelBlock w={26} h={26} r={13} />
      <SkelBlock w={26} h={26} r={13} style={{ marginLeft: -5 }} />
    </div>
    <div className="flex flex-col" style={{ gap: 6 }}>
      <SkelBlock w="55%" h={14} />
      <SkelBlock w="40%" h={10} tone="secondary" />
    </div>
    <SkelBlock h={34} r={17} tone="secondary" />
    <SkelBlock h={34} r={17} tone="secondary" />
  </div>
);

/** Desktop Sports section (§1) — head + day strip, 5/7 split: stage + tiles | table panel. */
export const LiteSportsStageSkeleton = () => (
  <div style={{ padding: "56px 0" }}>
    <SectionHeadSkeleton right={376} />
    <div className="grid" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 20, marginTop: 44 }}>
      <div className="flex flex-col" style={{ gridColumn: "span 5", paddingRight: 28, gap: 14 }}>
        <SkelBlock w={240} h={12} tone="secondary" />
        <SkelBlock h={0} style={{ paddingTop: "56.25%", borderRadius: 12 }} />
        <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto 1fr", gap: 16, marginTop: 4 }}>
          <SkelBlock w={56} h={56} r={28} className="mx-auto" />
          <SkelBlock w={120} h={48} r={8} />
          <SkelBlock w={56} h={56} r={28} className="mx-auto" />
        </div>
        <div className="grid grid-cols-2" style={{ gap: 8 }}>
          <SkelBlock h={38} r={19} tone="secondary" />
          <SkelBlock h={38} r={19} tone="secondary" />
        </div>
        <div className="grid grid-cols-2" style={{ gap: 10, marginTop: 18 }}>
          <TileSkeleton />
          <TileSkeleton />
          <TileSkeleton />
          <TileSkeleton />
        </div>
      </div>
      <div style={{ gridColumn: "span 7", background: BLOCK_2, borderRadius: 16, padding: "24px 28px" }}>
        <SkelBlock w={160} h={10} tone="secondary" />
        {Array.from({ length: 10 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

/** Desktop Crypto section (§2) — head + clock / tabs, BTC block 8 | ETH-SOL panel 4. */
export const LiteIntradayStageSkeleton = () => (
  <div style={{ padding: "56px 0", borderTop: "1px solid rgba(148,163,184,0.1)" }}>
    <SectionHeadSkeleton right={420} />
    <div className="grid" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 20, marginTop: 40 }}>
      <div className="flex flex-col" style={{ gridColumn: "span 8", paddingRight: 28, gap: 14 }}>
        <div className="flex items-center" style={{ gap: 14 }}>
          <SkelBlock w={34} h={34} r={17} />
          <SkelBlock w={60} h={20} />
          <SkelBlock w={160} h={12} tone="secondary" />
        </div>
        <SkelBlock w={360} h={76} r={10} />
        <SkelBlock h={206} r={12} tone="secondary" />
        <div className="grid items-center" style={{ gridTemplateColumns: "auto 1fr auto", gap: 14, marginTop: 12 }}>
          <SkelBlock w={120} h={44} r={22} />
          <SkelBlock h={8} r={4} tone="secondary" />
          <SkelBlock w={120} h={44} r={22} />
        </div>
      </div>
      <div className="flex flex-col" style={{ gridColumn: "span 4", background: BLOCK_2, borderRadius: 16, padding: "24px 28px", gap: 22 }}>
        {[0, 1].map((k) => (
          <div key={k} className="flex flex-col" style={{ gap: 14 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <SkelBlock w={26} h={26} r={13} />
              <SkelBlock w={44} h={14} />
              <SkelBlock w={90} h={18} />
            </div>
            <SkelBlock h={80} r={8} />
            <div className="grid items-center" style={{ gridTemplateColumns: "auto 1fr auto", gap: 10 }}>
              <SkelBlock w={78} h={34} r={17} />
              <SkelBlock h={5} r={3} tone="secondary" />
              <SkelBlock w={78} h={34} r={17} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Desktop "All" first load — Sports §1 then Crypto §2 (the two sections above the fold). */
const SEP = "1px solid rgba(148,163,184,0.1)";

/** Desktop Stocks section (§3) — head + market tabs / status line, two columns of five rows. */
export const LiteStocksStageSkeleton = () => (
  <div style={{ padding: "56px 0", borderTop: SEP }}>
    <SectionHeadSkeleton right={300} />
    <div className="flex items-center" style={{ gap: 18, marginTop: 34 }}>
      {[0, 1, 2].map((i) => (
        <SkelBlock key={i} w={84} h={16} tone="secondary" />
      ))}
      <SkelBlock w={280} h={12} tone="secondary" />
    </div>
    <div className="grid grid-cols-2" style={{ gap: 44, marginTop: 22 }}>
      {[0, 1].map((c) => (
        <div key={c} className="flex flex-col">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid items-center" style={{ gridTemplateColumns: "26px 1fr 96px 72px 88px 88px", gap: 12, padding: "13px 0" }}>
              <SkelBlock w={26} h={26} r={13} />
              <div className="flex flex-col" style={{ gap: 6 }}>
                <SkelBlock w="45%" h={13} />
                <SkelBlock w="65%" h={10} tone="secondary" />
              </div>
              <SkelBlock h={28} r={4} tone="secondary" />
              <SkelBlock h={14} />
              <SkelBlock h={34} r={17} tone="secondary" />
              <SkelBlock h={34} r={17} tone="secondary" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

/** Desktop Editor's Desk (§4) — head, three columns: number, eyebrow, title, note, two buttons. */
export const LiteDeskStageSkeleton = () => (
  <div style={{ padding: "56px 0", borderTop: SEP }}>
    <SectionHeadSkeleton />
    <div className="grid grid-cols-3" style={{ gap: 36, marginTop: 40 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col" style={{ gap: 12 }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <SkelBlock w={30} h={26} r={6} />
            <SkelBlock w={150} h={10} tone="secondary" />
          </div>
          <SkelBlock w="85%" h={18} />
          <SkelBlock w="60%" h={18} />
          <SkelBlock w="95%" h={11} tone="secondary" />
          <SkelBlock w="75%" h={11} tone="secondary" />
          <div className="flex" style={{ gap: 8, marginTop: 6 }}>
            <SkelBlock w={96} h={34} r={17} tone="secondary" />
            <SkelBlock w={96} h={34} r={17} tone="secondary" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Desktop More (§5) — head, three event rows: cover + question | outcomes / chance + Yes / No. */
export const LiteMoreStageSkeleton = () => (
  <div style={{ padding: "56px 0", borderTop: SEP }}>
    <SectionHeadSkeleton />
    <div className="flex flex-col" style={{ marginTop: 32 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid items-center" style={{ gridTemplateColumns: "minmax(0,1fr) 520px", gap: 40, padding: "22px 0", borderTop: i ? SEP : undefined }}>
          <div className="flex items-center" style={{ gap: 18 }}>
            <SkelBlock w={120} h={72} r={10} tone="secondary" />
            <div className="flex flex-col" style={{ gap: 8, flex: 1 }}>
              <SkelBlock w={180} h={10} tone="secondary" />
              <SkelBlock w="80%" h={18} />
              <SkelBlock w={140} h={10} tone="secondary" />
            </div>
          </div>
          <div className="flex flex-col" style={{ gap: 12 }}>
            {[0, 1].map((k) => (
              <div key={k} className="grid items-center" style={{ gridTemplateColumns: "136px 1fr 70px 70px", gap: 12 }}>
                <SkelBlock h={13} />
                <SkelBlock h={6} r={3} tone="secondary" />
                <SkelBlock h={28} r={14} tone="secondary" />
                <SkelBlock h={28} r={14} tone="secondary" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Desktop "All" first load — the five sections in page order (CPO 2026-11-09:
 * Sports · Crypto · Stocks · Editor's Desk · More). Shown only until the first
 * data lands (R6); each block mirrors its section's final layout.
 */
export const LiteAllStageSkeleton = () => (
  <div className="animate-pulse">
    <LiteSportsStageSkeleton />
    <LiteIntradayStageSkeleton />
    <LiteStocksStageSkeleton />
    <LiteDeskStageSkeleton />
    <LiteMoreStageSkeleton />
  </div>
);

/** Mobile Sports §1 — head, day strip, brand stage, match-up, tiles 2×2. */
export const LiteMobileSportsSkeleton = () => (
  <div className="flex flex-col" style={{ padding: "36px 0", gap: 18 }}>
    <SkelBlock w={240} h={11} tone="secondary" />
    <SkelBlock w={300} h={34} r={8} />
    {/* the real day strip scrolls sideways — the placeholder is cut at the edge, never widens the page */}
    <div className="flex overflow-hidden" style={{ gap: 8 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkelBlock key={i} w={56} h={56} r={12} tone="secondary" style={{ flex: "none" }} />
      ))}
    </div>
    <SkelBlock w={200} h={11} tone="secondary" />
    <SkelBlock h={0} style={{ paddingTop: "56.25%", borderRadius: 12 }} />
    <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto 1fr", gap: 12 }}>
      <SkelBlock w={44} h={44} r={22} className="mx-auto" />
      <SkelBlock w={100} h={40} r={8} />
      <SkelBlock w={44} h={44} r={22} className="mx-auto" />
    </div>
    <div className="grid grid-cols-2" style={{ gap: 8 }}>
      <SkelBlock h={38} r={19} tone="secondary" />
      <SkelBlock h={38} r={19} tone="secondary" />
    </div>
    <div className="grid grid-cols-2" style={{ gap: 10, marginTop: 10 }}>
      <TileSkeleton />
      <TileSkeleton />
      <TileSkeleton />
      <TileSkeleton />
    </div>
  </div>
);

/** Mobile Crypto §2 — clock line, tabs, BTC card. */
export const LiteMobileIntradaySkeleton = () => (
  <div className="flex flex-col" style={{ padding: "36px 0", gap: 14, borderTop: "1px solid rgba(148,163,184,0.1)" }}>
    <SkelBlock w={260} h={11} tone="secondary" />
    <SkelBlock w={280} h={34} r={8} />
    <SkelBlock w={220} h={24} r={6} tone="secondary" />
    <SkelBlock h={4} r={2} tone="secondary" />
    <div className="flex" style={{ gap: 20 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <SkelBlock key={i} w={28} h={14} tone="secondary" />
      ))}
    </div>
    <div className="flex items-center" style={{ gap: 10, marginTop: 8 }}>
      <SkelBlock w={28} h={28} r={14} />
      <SkelBlock w={48} h={18} />
      <SkelBlock w={120} h={11} tone="secondary" />
    </div>
    <SkelBlock w={220} h={44} r={8} />
    <SkelBlock h={150} r={12} tone="secondary" />
    <div className="grid grid-cols-2" style={{ gap: 8 }}>
      <SkelBlock h={44} r={22} />
      <SkelBlock h={44} r={22} />
    </div>
  </div>
);

/** Mobile Stocks §3 — head, tabs, five two-line rows. */
export const LiteMobileStocksSkeleton = () => (
  <div className="flex flex-col" style={{ padding: "36px 0", gap: 14, borderTop: SEP }}>
    <SkelBlock w={240} h={11} tone="secondary" />
    <SkelBlock w={290} h={34} r={8} />
    <div className="flex" style={{ gap: 16 }}>
      {[0, 1, 2].map((i) => (
        <SkelBlock key={i} w={64} h={14} tone="secondary" />
      ))}
    </div>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex flex-col" style={{ gap: 8, padding: "8px 0" }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <SkelBlock w={26} h={26} r={13} />
          <SkelBlock w={140} h={13} />
          <SkelBlock w={60} h={13} className="ml-auto" />
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          <SkelBlock w={120} h={26} r={4} tone="secondary" />
          <SkelBlock w={78} h={32} r={16} tone="secondary" className="ml-auto" />
          <SkelBlock w={78} h={32} r={16} tone="secondary" />
        </div>
      </div>
    ))}
  </div>
);

/** Mobile Editor's Desk §4 — head, three stacked picks. */
export const LiteMobileDeskSkeleton = () => (
  <div className="flex flex-col" style={{ padding: "36px 0", gap: 14, borderTop: SEP }}>
    <SkelBlock w={180} h={11} tone="secondary" />
    <SkelBlock w={260} h={34} r={8} />
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex flex-col" style={{ gap: 10, padding: "12px 0", borderTop: SEP }}>
        <SkelBlock w={170} h={10} tone="secondary" />
        <SkelBlock w="85%" h={16} />
        <SkelBlock w="95%" h={10} tone="secondary" />
        <div className="flex" style={{ gap: 8 }}>
          <SkelBlock w={90} h={32} r={16} tone="secondary" />
          <SkelBlock w={90} h={32} r={16} tone="secondary" />
        </div>
      </div>
    ))}
  </div>
);

/** Mobile More §5 — head, two event rows (cover 96×58 + question, then buttons). */
export const LiteMobileMoreSkeleton = () => (
  <div className="flex flex-col" style={{ padding: "36px 0", gap: 14, borderTop: SEP }}>
    <SkelBlock w={180} h={11} tone="secondary" />
    <SkelBlock w={230} h={34} r={8} />
    {[0, 1].map((i) => (
      <div key={i} className="flex flex-col" style={{ gap: 12, padding: "12px 0", borderTop: SEP }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <SkelBlock w={96} h={58} r={8} tone="secondary" />
          <div className="flex flex-col" style={{ gap: 7, flex: 1 }}>
            <SkelBlock w="60%" h={10} tone="secondary" />
            <SkelBlock w="90%" h={15} />
          </div>
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          <SkelBlock w={90} h={30} r={6} />
          <SkelBlock w={84} h={34} r={17} tone="secondary" className="ml-auto" />
          <SkelBlock w={84} h={34} r={17} tone="secondary" />
        </div>
      </div>
    ))}
  </div>
);

/** Mobile "All" first load — the five sections in page order (CPO 2026-11-09). */
export const LiteMobileStageSkeleton = () => (
  <div className="animate-pulse">
    <LiteMobileSportsSkeleton />
    <LiteMobileIntradaySkeleton />
    <LiteMobileStocksSkeleton />
    <LiteMobileDeskSkeleton />
    <LiteMobileMoreSkeleton />
  </div>
);
