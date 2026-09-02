// ============================================================
// /portfolio (Lite) async states — loading skeleton, fetch error, not found.
//
// Rules (CPO 工单 M6b §1):
//  · Skeleton renders ONLY on the first fetch with no cache. A cached
//    re-render or a background refresh never flashes a skeleton.
//  · Tabs and the Boost/Standard chips are static chrome — they render solid
//    and clickable on first paint and are deliberately NOT skeletoned.
//  · Neutral only: #171A1F card ground / #15181C block, one shared
//    `animate-pulse` on the module root (mirrors LiteEventsSkeletons).
//  · A failed list request never renders a fake $0.00 KPI — the three values
//    render `—` and the list area carries the retry affordance.
// ============================================================
import { useNavigate } from "react-router-dom";

const GROUND = "#171A1F";
const BLOCK = "#15181C";

/** Neutral filled block — the single primitive the skeleton is built from. */
const Blk = ({
  w,
  h,
  r = 4,
}: {
  w?: number | string;
  h: number;
  r?: number;
}) => (
  <span
    aria-hidden
    className="block shrink-0"
    style={{ width: w ?? "100%", height: h, borderRadius: r, background: BLOCK }}
  />
);

/** KPI placeholder — same box as KpiCard (rounded-[12px] px-[14px] py-[12px]). */
const KpiSkel = () => (
  <div className="rounded-[12px] px-[14px] py-[12px]" style={{ background: GROUND }}>
    <Blk w={54} h={10} />
    <div className="pt-[9px]">
      <Blk w={88} h={18} />
    </div>
    <div className="pt-[7px]">
      <Blk w={62} h={10} />
    </div>
  </div>
);

/** List row placeholder — mirrors the live row / settled row two-line body. */
const RowSkel = () => (
  <div
    className="flex items-center gap-3 px-4 py-[13px]"
    style={{ borderBottom: "1px solid rgba(28,31,38,.8)" }}
  >
    <div className="min-w-0 flex-1">
      <Blk w="62%" h={13} />
      <div className="pt-[7px]">
        <Blk w="40%" h={10} />
      </div>
    </div>
    <Blk w={64} h={14} />
  </div>
);

/**
 * First-load placeholder for the /portfolio body: KPI grid (desktop 3 /
 * mobile 2) + three list rows. Tabs and chips are NOT part of it.
 */
export const PortfolioSkeleton = ({
  cols = 3,
  part = "all",
}: {
  cols?: 2 | 3;
  /** The page renders the two halves around the static chips row. */
  part?: "all" | "kpi" | "rows";
}) => (
  <div className="animate-pulse" aria-busy="true" aria-label="Loading your positions">
    {part !== "rows" && (
      <div className="px-4 lg:px-0 pb-1 pt-3.5">
        <div className={cols === 2 ? "grid grid-cols-2 gap-2" : "grid grid-cols-3 gap-3"}>
          {Array.from({ length: cols }).map((_, i) => (
            <KpiSkel key={i} />
          ))}
        </div>
      </div>
    )}
    {part !== "kpi" && (
      <div className="pt-3">
        {[0, 1, 2].map((i) => (
          <RowSkel key={i} />
        ))}
      </div>
    )}
  </div>
);

/**
 * Live tab empty state. Lives here (not inline in the page) so the style guide
 * mounts the same production render instead of a hand-copied div.
 */
export const PortfolioEmptyLive = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center gap-3 py-14">
      <p className="text-[13px] text-[#6B7280]">No live calls yet</p>
      <button
        type="button"
        onClick={() => navigate("/events")}
        className="h-10 rounded-[10px] px-4 text-[13px] font-semibold text-[#F2F3F5]"
        style={{ border: "1px solid #2A2F38" }}
      >
        Browse events
      </button>
    </div>
  );
};

/** Placeholder KPI value when the request failed — never a fake zero. */
export const KPI_DASH = "—";

/** List-area error state: one sentence + an outlined Retry. */
export const PortfolioFetchError = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="flex flex-col items-center gap-3 py-14" role="alert">
    <p className="text-sm text-[#6B7280]">Couldn't load your positions.</p>
    <button
      type="button"
      onClick={onRetry}
      className="h-10 rounded-[10px] px-4 text-[13px] font-semibold text-[#F2F3F5]"
      style={{ border: "1px solid #2A2F38" }}
    >
      Retry
    </button>
  </div>
);

/**
 * Settlement detail Not found — rendered identically whether the id does not
 * exist or belongs to somebody else. Never leaks another user's event or money.
 */
export const PortfolioNotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <p className="text-[15px] font-semibold text-[#F2F3F5]">Position not found</p>
      <p className="text-[13px] text-[#6B7280]">
        It may have been removed, or the link is wrong.
      </p>
      <button
        type="button"
        onClick={() => navigate("/portfolio?tab=settled")}
        className="mt-2 h-10 rounded-[10px] px-4 text-[13px] font-semibold text-[#F2F3F5]"
        style={{ border: "1px solid #2A2F38" }}
      >
        Back to settled
      </button>
    </div>
  );
};
