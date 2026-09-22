/**
 * 榜单筛选行。Figma desktop 700:29478 / mobile 711:33604。
 * desktop：分段器 360×48 + 右侧 7 Days 90×40 + Share 96×40
 * mobile ：分段器满宽 48 + 下一行 Time range 标签 + 下拉 84×38（无 Share，入口在顶栏与 Your Ranking）
 */
import { ChevronDown, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERIOD_TABS, SORT_TABS, type PeriodType, type SortType } from "./leaderboardKit";

const periodLabel = (p: PeriodType) => PERIOD_TABS.find((t) => t.key === p)?.label ?? "";

const PeriodDropdown = ({
  period,
  onPeriodChange,
  width,
  height,
  fontSize,
}: {
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  width: number;
  height: number;
  fontSize: number;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className="flex items-center justify-center gap-1.5 rounded-xl transition-colors hover:bg-[rgba(28,31,38,0.7)]"
        style={{
          width,
          height,
          background: "rgba(28,31,38,0.4)",
          border: "1px solid rgba(28,31,38,0.3)",
          color: "#9CA2AB",
          fontSize,
          fontWeight: 500,
        }}
      >
        {periodLabel(period)}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="border-border bg-card">
      {PERIOD_TABS.map((tab) => (
        <DropdownMenuItem
          key={tab.key}
          onClick={() => onPeriodChange(tab.key)}
          className={`cursor-pointer text-sm ${period === tab.key ? "text-[#33D6FF]" : ""}`}
        >
          {tab.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const SortSegment = ({
  sortType,
  onSortChange,
  tabWidth,
  containerWidth,
}: {
  sortType: SortType;
  onSortChange: (s: SortType) => void;
  tabWidth?: number;
  containerWidth?: number;
}) => (
  <div
    className="flex items-center overflow-hidden rounded-xl"
    style={{ width: containerWidth, height: 48, background: "#131519", padding: 4, gap: 8 }}
  >
    {SORT_TABS.map((tab) => {
      const active = sortType === tab.key;
      return (
        <button
          key={tab.key}
          type="button"
          onClick={() => onSortChange(tab.key)}
          aria-pressed={active}
          className="font-display rounded-xl transition-colors"
          style={{
            width: tabWidth,
            flex: tabWidth ? undefined : "1 1 0",
            height: 40,
            background: active ? "#33D6FF" : "transparent",
            color: active ? "#1C1F26" : "#9CA2AB",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: "20px",
          }}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

export const LeaderboardFiltersDesktop = ({
  sortType,
  onSortChange,
  period,
  onPeriodChange,
  onShare,
}: {
  sortType: SortType;
  onSortChange: (s: SortType) => void;
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  onShare: () => void;
}) => (
  <div className="flex items-center justify-between">
    <SortSegment sortType={sortType} onSortChange={onSortChange} tabWidth={112} containerWidth={360} />
    <div className="flex items-center" style={{ gap: 8 }}>
      <PeriodDropdown period={period} onPeriodChange={onPeriodChange} width={90} height={40} fontSize={14} />
      <button
        type="button"
        onClick={onShare}
        className="flex items-center justify-center gap-2 rounded-xl transition-colors hover:bg-[rgba(51,214,255,0.3)]"
        style={{
          width: 96,
          height: 40,
          background: "rgba(51,214,255,0.2)",
          border: "1px solid rgba(51,214,255,0.3)",
          color: "#33D6FF",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Share
      </button>
    </div>
  </div>
);

export const LeaderboardFiltersMobile = ({
  sortType,
  onSortChange,
  period,
  onPeriodChange,
}: {
  sortType: SortType;
  onSortChange: (s: SortType) => void;
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
}) => (
  <div>
    <SortSegment sortType={sortType} onSortChange={onSortChange} />
    <div className="flex items-center justify-between" style={{ height: 40, marginTop: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 500, lineHeight: "18px", color: "#9CA2AB" }}>Time range</span>
      <PeriodDropdown period={period} onPeriodChange={onPeriodChange} width={84} height={38} fontSize={12} />
    </div>
  </div>
);
