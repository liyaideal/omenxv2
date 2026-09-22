/**
 * ① 浮动定位器 —— 只回答「我第几、我多少」，不承载分享。
 * 设计稿里没有这一件，是 2026-09-22 CPO 拍板新增（「自己在哪个位置很重要」）。
 *
 * 显示规则（CPO 批）：
 * - 出现：视口在 Hero → 表格之间，且 ② Your Ranking 未进入视口
 * - 淡出：② 任意部分进入视口 → 150ms opacity + 4px 下移
 * - 点击（已排名）：翻到我所在页 → 滚到我那行 → 高亮 1.5s
 * - 点击（未排名）：滚到 ②
 * - 未登录：整条变 CTA，点击拉 Auth
 * - 移动端：left/right 16，bottom = var(--bottom-nav-h) + 12，永不盖底导
 */
import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { formatMetric, type LeaderboardUser, type SortType } from "./leaderboardKit";

/** 观察 ② 是否进入视口；进入即隐藏定位器 */
const useHiddenWhenAnchorVisible = (anchorId: string) => {
  const [anchorVisible, setAnchorVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById(anchorId);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => setAnchorVisible(entries[0]?.isIntersecting ?? false), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [anchorId]);
  return anchorVisible;
};

export const RankLocator = ({
  user,
  sortType,
  isLoggedIn,
  variant,
  anchorId,
  onJump,
  onSignIn,
}: {
  /** 已登录且已排名时给，否则 undefined = 未排名态 */
  user?: LeaderboardUser;
  sortType: SortType;
  isLoggedIn: boolean;
  variant: "desktop" | "mobile";
  anchorId: string;
  onJump: () => void;
  onSignIn: () => void;
}) => {
  const anchorVisible = useHiddenWhenAnchorVisible(anchorId);

  const shell: React.CSSProperties =
    variant === "desktop"
      ? { position: "fixed", right: 24, bottom: 24, width: 344 }
      : {
          position: "fixed",
          left: 16,
          right: 16,
          bottom: "calc(var(--bottom-nav-h, 76px) + 12px)",
          width: "auto",
        };

  const ranked = isLoggedIn && !!user;

  return (
    <div
      style={{
        ...shell,
        height: 56,
        zIndex: 40,
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: 12,
        boxShadow: ranked
          ? "0 0 0 1px rgba(51,214,255,0.18), 0 16px 40px rgba(0,0,0,0.55)"
          : "0 16px 40px rgba(0,0,0,0.55)",
        padding: isLoggedIn ? "0 10px 0 12px" : "0 10px 0 16px",
        display: "flex",
        alignItems: "center",
        gap: isLoggedIn ? 10 : 12,
        opacity: anchorVisible ? 0 : 1,
        transform: anchorVisible ? "translateY(4px)" : "translateY(0)",
        pointerEvents: anchorVisible ? "none" : "auto",
        transition: "opacity 150ms ease, transform 150ms ease",
      }}
      aria-hidden={anchorVisible || undefined}
    >
      {!isLoggedIn ? (
        <>
          <div
            className="min-w-0 flex-1 truncate"
            style={{ fontSize: 13, fontWeight: 500, lineHeight: "18px", color: "#F2F3F5" }}
          >
            See where you rank
          </div>
          <button
            type="button"
            onClick={onSignIn}
            className="btn-primary shrink-0"
            style={{ height: 36, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
          >
            Sign in
          </button>
        </>
      ) : (
        <>
          <div className="relative shrink-0" style={{ width: 32, height: 32 }}>
            {ranked && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: -3,
                  top: -3,
                  width: 38,
                  height: 38,
                  borderRadius: 9999,
                  background: "rgba(51,214,255,0.3)",
                  filter: "blur(4px)",
                  opacity: 0.7,
                }}
              />
            )}
            <img
              src={user?.avatar}
              alt=""
              aria-hidden="true"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
              }}
              style={{
                position: "relative",
                width: 32,
                height: 32,
                borderRadius: 9999,
                objectFit: "cover",
                boxSizing: "border-box",
                border: ranked ? "1.25px solid rgba(51,214,255,0.6)" : "1px solid rgba(28,31,38,0.9)",
                background: "#14171B",
                display: "block",
              }}
            />
          </div>

          <span
            className="font-display shrink-0"
            style={{
              padding: ranked ? "2px 8px" : "2px 10px",
              borderRadius: 9999,
              background: ranked ? "rgba(51,214,255,0.12)" : "rgba(255,255,255,0.06)",
              color: ranked ? "#33D6FF" : "#9CA2AB",
              fontSize: 13,
              fontWeight: 700,
              lineHeight: "18px",
            }}
          >
            {ranked ? `#${user!.rank}` : "—"}
          </span>

          <div className="min-w-0 flex-1">
            <div
              className="truncate"
              style={{ fontSize: 13, fontWeight: 500, lineHeight: "16px", color: "#F2F3F5" }}
            >
              {user?.username}
            </div>
            {ranked ? (
              <div
                className="font-display text-trading-green"
                style={{ marginTop: 2, fontSize: 13, fontWeight: 700, lineHeight: "16px" }}
              >
                {formatMetric(user!, sortType)}
              </div>
            ) : (
              <div style={{ marginTop: 2, fontSize: 12, lineHeight: "16px", color: "#9CA2AB" }}>
                Unranked · {user?.trades ?? 0} trades
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onJump}
            aria-label={ranked ? "Jump to my row" : "Go to your ranking"}
            className="flex shrink-0 items-center justify-center transition-colors hover:bg-[#1C1F26]"
            style={{
              width: 36,
              height: 36,
              boxSizing: "border-box",
              border: "1px solid #262A31",
              borderRadius: 10,
              background: "transparent",
              color: "#F2F3F5",
            }}
          >
            <ArrowDown className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
};
