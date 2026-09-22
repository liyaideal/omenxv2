/**
 * 榜单表格。desktop = 五列真表格（Figma 700:29638），mobile = 两列列表卡（Figma 711:33760）。
 * 两端是两套实现，不是一个响应式组件塞两个宽度。
 */
import {
  formatMetric,
  metricColumnLabel,
  rankChangeClass,
  rankChangeText,
  type LeaderboardUser,
  type SortType,
} from "./leaderboardKit";

export const CURRENT_USER_ROW_ID = "current-user-row";

const avatarBorder = (isCurrentUser: boolean) =>
  isCurrentUser ? "rgba(51,214,255,0.4)" : "rgba(28,31,38,0.4)";

const RowAvatar = ({ user, size, border, isCurrentUser }: { user: LeaderboardUser; size: number; border: number; isCurrentUser: boolean }) => (
  <img
    src={user.avatar}
    alt=""
    aria-hidden="true"
    loading="lazy"
    onError={(e) => {
      (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
    }}
    style={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: 9999,
      objectFit: "cover",
      boxSizing: "border-box",
      border: `${border}px solid ${avatarBorder(isCurrentUser)}`,
      background: "#14171B",
      display: "block",
    }}
  />
);

/* ----------------------------- 分页 ----------------------------- */

const Pagination = ({
  rangeLabel,
  page,
  pageCount,
  onPageChange,
  variant,
}: {
  rangeLabel: string;
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
  variant: "desktop" | "mobile";
}) => {
  const size = variant === "desktop" ? 32 : 40;
  const height = variant === "desktop" ? 56 : 64;
  const padX = variant === "desktop" ? 24 : 12;

  const cell = (content: string, opts: { active?: boolean; disabled?: boolean; onClick?: () => void; label?: string }) => (
    <button
      key={opts.label ?? content}
      type="button"
      aria-label={opts.label}
      aria-current={opts.active ? "page" : undefined}
      disabled={opts.disabled}
      onClick={opts.onClick}
      className="transition-colors"
      style={{
        width: size,
        height: size,
        border: 0,
        borderRadius: 8,
        background: opts.active ? "#33D6FF" : "transparent",
        color: opts.active ? "#090A0B" : "#9CA2AB",
        fontSize: 12,
        fontWeight: 500,
        lineHeight: "18px",
        opacity: opts.disabled ? 0.35 : 1,
        cursor: opts.disabled ? "default" : "pointer",
      }}
    >
      {content}
    </button>
  );

  return (
    <div
      className="flex items-center justify-between"
      style={{ height, paddingInline: padX, borderTop: "1px solid #23262D" }}
    >
      <div style={{ fontSize: 11, fontWeight: 400, lineHeight: "16px", color: "#9CA2AB" }}>{rangeLabel}</div>
      <div className="flex items-center" style={{ gap: 4 }}>
        {cell("‹", { disabled: page === 1, onClick: () => onPageChange(page - 1), label: "Previous page" })}
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) =>
          cell(String(p), { active: p === page, onClick: () => onPageChange(p), label: `Page ${p}` })
        )}
        {cell("›", { disabled: page === pageCount, onClick: () => onPageChange(page + 1), label: "Next page" })}
      </div>
    </div>
  );
};

/* --------------------------- desktop --------------------------- */

const HEAD: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  lineHeight: "16px",
  color: "#9CA2AB",
};

export const LeaderboardTableDesktop = ({
  rows,
  sortType,
  currentUsername,
  rangeLabel,
  page,
  pageCount,
  onPageChange,
}: {
  rows: LeaderboardUser[];
  sortType: SortType;
  currentUsername?: string;
  rangeLabel: string;
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
}) => (
  <div className="trading-card overflow-hidden">
    <div className="flex items-center justify-between" style={{ height: 51, paddingInline: 48 }}>
      <div style={{ ...HEAD, width: 56 }}>RANK</div>
      <div style={{ ...HEAD, flex: "1 1 0", minWidth: 200 }}>TRADER</div>
      <div style={{ ...HEAD, width: 160, textAlign: "right" }}>TRADES</div>
      <div style={{ ...HEAD, width: 200, textAlign: "right" }}>{metricColumnLabel(sortType)}</div>
      <div style={{ ...HEAD, width: 160, textAlign: "right" }}>CHANGE</div>
    </div>

    {rows.map((user) => {
      const isCurrentUser = !!currentUsername && user.username === currentUsername;
      return (
        <div
          key={user.rank}
          id={isCurrentUser ? CURRENT_USER_ROW_ID : undefined}
          className="flex items-center justify-between transition-colors hover:bg-white/[0.02]"
          style={{ height: 56, paddingInline: 48, borderBottom: "1px solid #23262D" }}
        >
          <div style={{ width: 56, fontSize: 12, fontWeight: 500, lineHeight: "18px", color: "#9CA2AB" }}>
            {user.rank}
          </div>
          <div className="flex min-w-0 items-center" style={{ flex: "1 1 0", gap: 12 }}>
            <RowAvatar user={user} size={32} border={0.889} isCurrentUser={isCurrentUser} />
            <span
              className="truncate"
              style={{ fontSize: 14, fontWeight: 500, lineHeight: "18px", color: "#F2F3F5" }}
            >
              {user.username}
            </span>
          </div>
          <div style={{ width: 160, textAlign: "right", fontSize: 12, lineHeight: "16px", color: "#9CA2AB" }}>
            {user.trades} trades
          </div>
          <div
            className="font-display text-trading-green"
            style={{ width: 200, textAlign: "right", fontSize: 14, fontWeight: 700, lineHeight: "20px" }}
          >
            {formatMetric(user, sortType)}
          </div>
          <div
            className={rankChangeClass(user.rankChange)}
            style={{ width: 160, textAlign: "right", fontSize: 11, lineHeight: "16px" }}
          >
            {rankChangeText(user.rankChange)}
          </div>
        </div>
      );
    })}

    <Pagination rangeLabel={rangeLabel} page={page} pageCount={pageCount} onPageChange={onPageChange} variant="desktop" />
  </div>
);

/* ---------------------------- mobile ---------------------------- */

export const LeaderboardListMobile = ({
  rows,
  sortType,
  currentUsername,
  rangeLabel,
  page,
  pageCount,
  onPageChange,
}: {
  rows: LeaderboardUser[];
  sortType: SortType;
  currentUsername?: string;
  rangeLabel: string;
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
}) => (
  <div className="trading-card overflow-hidden">
    <div className="flex items-center justify-between" style={{ height: 40, paddingInline: 12 }}>
      <div style={HEAD}>RANK / TRADER</div>
      <div style={HEAD}>{metricColumnLabel(sortType)}</div>
    </div>

    {rows.map((user) => {
      const isCurrentUser = !!currentUsername && user.username === currentUsername;
      return (
        <div
          key={user.rank}
          id={isCurrentUser ? CURRENT_USER_ROW_ID : undefined}
          className="flex items-center"
          style={{ height: 64, paddingInline: 12, gap: 8, borderBottom: "1px solid #23262D" }}
        >
          <div
            className="shrink-0"
            style={{ width: 16, fontSize: 12, fontWeight: 500, lineHeight: "18px", color: "#9CA2AB" }}
          >
            {user.rank}
          </div>
          <RowAvatar user={user} size={28} border={0.778} isCurrentUser={isCurrentUser} />
          <div className="min-w-0 flex-1">
            <div className="truncate" style={{ fontSize: 12, fontWeight: 500, lineHeight: "18px", color: "#F2F3F5" }}>
              {user.username}
            </div>
            <div style={{ fontSize: 11, lineHeight: "16px", color: "#9CA2AB" }}>{user.trades} trades</div>
          </div>
          <div className="shrink-0 text-right" style={{ width: 92 }}>
            <div className="font-display text-trading-green" style={{ fontSize: 14, fontWeight: 700, lineHeight: "20px" }}>
              {formatMetric(user, sortType)}
            </div>
            <div className={rankChangeClass(user.rankChange)} style={{ fontSize: 11, lineHeight: "16px" }}>
              {rankChangeText(user.rankChange)}
            </div>
          </div>
        </div>
      );
    })}

    <Pagination rangeLabel={rangeLabel} page={page} pageCount={pageCount} onPageChange={onPageChange} variant="mobile" />
  </div>
);
