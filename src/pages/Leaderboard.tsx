import { useEffect, useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { BottomNav } from "@/components/BottomNav";
// Mobile Header System v1: no page draws its own top bar (DESIGN.md §10).
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useReferral } from "@/hooks/useReferral";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { SeoFooter } from "@/components/seo/SeoFooter";
import heroDesktop from "@/assets/leaderboard-hero-desktop.webp";
import heroMobile from "@/assets/leaderboard-hero-mobile.webp";
import { formatMetric } from "@/components/leaderboard/leaderboardKit";
import { LeaderboardFiltersDesktop, LeaderboardFiltersMobile } from "@/components/leaderboard/LeaderboardFilters";
import { LeaderboardPodium } from "@/components/leaderboard/LeaderboardPodium";
import { CURRENT_USER_ROW_ID, LeaderboardListMobile, LeaderboardTableDesktop } from "@/components/leaderboard/LeaderboardTable";
import { YourRankingBarDesktop, YourRankingCardMobile, type YourRankingData } from "@/components/leaderboard/YourRankingBar";
import { RankLocator } from "@/components/leaderboard/RankLocator";
import { ShareRankModal } from "@/components/leaderboard/ShareRankModal";

type SortType = "pnl" | "roi" | "volume";
type PeriodType = "daily" | "7d" | "30d" | "180d";


interface LeaderboardUser {
  rank: number;
  username: string;
  avatar: string;
  pnl: number;
  roi: number;
  volume: number;
  trades: number;
  rankChange: number; // positive = up, negative = down, 0 = no change
}

// Mock data for leaderboard (30 users max)
const mockLeaderboardData: LeaderboardUser[] = [
  { rank: 1, username: "CryptoWhale", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=whale&backgroundColor=b6e3f4", pnl: 125430, roi: 342.5, volume: 2450000, trades: 156, rankChange: 0 },
  { rank: 2, username: "TradingMaster", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=master&backgroundColor=c0aede", pnl: 89250, roi: 287.3, volume: 1890000, trades: 234, rankChange: 2 },
  { rank: 3, username: "ProfitHunter", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=hunter&backgroundColor=d1d4f9", pnl: 67890, roi: 198.7, volume: 1560000, trades: 189, rankChange: -1 },
  { rank: 4, username: "AlphaTrader", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=alpha&backgroundColor=ffd5dc", pnl: 45670, roi: 156.2, volume: 980000, trades: 145, rankChange: 3 },
  { rank: 5, username: "MarketMaker", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=maker&backgroundColor=ffdfbf", pnl: 34560, roi: 134.8, volume: 890000, trades: 178, rankChange: -2 },
  { rank: 6, username: "DiamondHands", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=diamond&backgroundColor=b6e3f4", pnl: 28900, roi: 112.4, volume: 750000, trades: 98, rankChange: 1 },
  { rank: 7, username: "MoonShot", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=moon&backgroundColor=c0aede", pnl: 23450, roi: 98.6, volume: 680000, trades: 167, rankChange: 0 },
  { rank: 8, username: "BullRunner", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=bull&backgroundColor=d1d4f9", pnl: 19870, roi: 87.3, volume: 590000, trades: 134, rankChange: -3 },
  { rank: 9, username: "SmartMoney", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=smart&backgroundColor=ffd5dc", pnl: 15690, roi: 76.5, volume: 480000, trades: 112, rankChange: 2 },
  { rank: 10, username: "TrendSurfer", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=trend&backgroundColor=ffdfbf", pnl: 12340, roi: 65.2, volume: 390000, trades: 89, rankChange: -1 },
  { rank: 11, username: "Hodler", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=hodler&backgroundColor=b6e3f4", pnl: 10200, roi: 58.3, volume: 320000, trades: 76, rankChange: 4 },
  { rank: 12, username: "BlockBuster", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=block&backgroundColor=c0aede", pnl: 8900, roi: 52.1, volume: 280000, trades: 68, rankChange: -2 },
  { rank: 13, username: "CryptoNinja", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=currentuser&backgroundColor=d1d4f9", pnl: 7650, roi: 45.8, volume: 245000, trades: 52, rankChange: 5 },
  { rank: 14, username: "SatoshiFan", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=satoshi&backgroundColor=ffd5dc", pnl: 6890, roi: 42.3, volume: 218000, trades: 45, rankChange: 1 },
  { rank: 15, username: "ChartWizard", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=wizard&backgroundColor=ffdfbf", pnl: 6120, roi: 38.7, volume: 195000, trades: 39, rankChange: -1 },
  { rank: 16, username: "RiskTaker", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=risk&backgroundColor=b6e3f4", pnl: 5450, roi: 35.2, volume: 178000, trades: 67, rankChange: 3 },
  { rank: 17, username: "TokenKing", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=token&backgroundColor=c0aede", pnl: 4890, roi: 32.1, volume: 156000, trades: 41, rankChange: 0 },
  { rank: 18, username: "WhaleWatcher", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=watcher&backgroundColor=d1d4f9", pnl: 4320, roi: 28.9, volume: 142000, trades: 33, rankChange: -2 },
  { rank: 19, username: "GainsGuru", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=gains&backgroundColor=ffd5dc", pnl: 3780, roi: 25.6, volume: 128000, trades: 29, rankChange: 2 },
  { rank: 20, username: "PumpPatrol", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=pump&backgroundColor=ffdfbf", pnl: 3250, roi: 22.4, volume: 115000, trades: 38, rankChange: -1 },
  { rank: 21, username: "DipBuyer", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=dip&backgroundColor=b6e3f4", pnl: 2890, roi: 19.8, volume: 98000, trades: 24, rankChange: 1 },
  { rank: 22, username: "MomentumX", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=momentum&backgroundColor=c0aede", pnl: 2540, roi: 17.3, volume: 87000, trades: 31, rankChange: 0 },
  { rank: 23, username: "ScalpKing", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=scalp&backgroundColor=d1d4f9", pnl: 2180, roi: 14.9, volume: 156000, trades: 89, rankChange: -3 },
  { rank: 24, username: "SwingTrader", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=swing&backgroundColor=ffd5dc", pnl: 1920, roi: 12.6, volume: 72000, trades: 18, rankChange: 2 },
  { rank: 25, username: "CoinCollector", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=coin&backgroundColor=ffdfbf", pnl: 1650, roi: 10.4, volume: 65000, trades: 22, rankChange: 1 },
  { rank: 26, username: "AltSeason", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=alt&backgroundColor=b6e3f4", pnl: 1380, roi: 8.2, volume: 54000, trades: 16, rankChange: -1 },
  { rank: 27, username: "FuturesFreak", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=futures&backgroundColor=c0aede", pnl: 1120, roi: 6.1, volume: 48000, trades: 27, rankChange: 0 },
  { rank: 28, username: "LeverageL", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=leverage&backgroundColor=d1d4f9", pnl: 890, roi: 4.3, volume: 42000, trades: 35, rankChange: -2 },
  { rank: 29, username: "PerpsPlayer", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=perps&backgroundColor=ffd5dc", pnl: 650, roi: 2.8, volume: 35000, trades: 14, rankChange: 1 },
  { rank: 30, username: "NewbieTrader", avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=newbie&backgroundColor=ffdfbf", pnl: 420, roi: 1.5, volume: 28000, trades: 8, rankChange: 0 },
];

// Current user mock ID - will be replaced with actual user data
const MOCK_CURRENT_USER_USERNAME = "CryptoNinja";



export default function Leaderboard() {
  const isMobile = useIsMobile();
  const { username, avatarUrl, user } = useUserProfile();
  const { referralCode } = useReferral();
  const [sortType, setSortType] = useState<SortType>("pnl");
  const [period, setPeriod] = useState<PeriodType>("7d");
  const [page, setPage] = useState(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const isLoggedIn = !!user;
  const currentUserUsername = user ? username || "You" : MOCK_CURRENT_USER_USERNAME;
  const currentUserAvatar = user ? avatarUrl || "" : "";

  /** 用真实用户信息替换 mock 里的占位用户 */
  const baseData = useMemo(
    () =>
      mockLeaderboardData.map((u) =>
        u.username === MOCK_CURRENT_USER_USERNAME
          ? { ...u, username: currentUserUsername, avatar: currentUserAvatar || u.avatar }
          : u
      ),
    [currentUserUsername, currentUserAvatar]
  );

  const sortedData = useMemo(
    () =>
      [...baseData]
        .sort((a, b) => b[sortType] - a[sortType])
        .map((u, idx) => ({ ...u, rank: idx + 1 })),
    [baseData, sortType]
  );

  const topThree = sortedData.slice(0, 3);
  const restOfList = sortedData.slice(3);

  const PAGE_SIZE = 10;
  const pageCount = Math.max(1, Math.ceil(restOfList.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = restOfList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = 4 + (safePage - 1) * PAGE_SIZE;
  const rangeLabel = `${rangeStart}–${rangeStart + pageRows.length - 1} of ${sortedData.length}`;

  /** 切指标或时间范围 → 回第 1 页（CPO 批的行为规则） */
  useEffect(() => {
    setPage(1);
  }, [sortType, period]);

  const currentUser = isLoggedIn
    ? sortedData.find((u) => u.username === currentUserUsername)
    : undefined;
  const isCurrentUserInTopThree = !!currentUser && currentUser.rank <= 3;

  /** 三个指标各自的名次（Your Ranking 三格用），未登录一律 null */
  const myRanks = useMemo(() => {
    const rankIn = (key: SortType) => {
      if (!isLoggedIn) return null;
      const idx = [...baseData]
        .sort((a, b) => b[key] - a[key])
        .findIndex((u) => u.username === currentUserUsername);
      return idx >= 0 ? idx + 1 : null;
    };
    return { pnl: rankIn("pnl"), roi: rankIn("roi"), volume: rankIn("volume") };
  }, [baseData, currentUserUsername, isLoggedIn]);

  const yourRanking: YourRankingData = {
    username: isLoggedIn ? currentUserUsername : "Not signed in",
    avatar: isLoggedIn ? currentUserAvatar : undefined,
    trades: currentUser?.trades ?? 0,
    ranks: myRanks,
    pnl: currentUser ? formatMetric(currentUser, "pnl") : "$0.00",
    roi: currentUser ? formatMetric(currentUser, "roi") : "0.00%",
    volume: currentUser ? formatMetric(currentUser, "volume") : "$0.00",
  };

  const YOUR_RANKING_ID = "your-ranking";

  /** 唯一分享入口：未登录先拉 Auth，否则开弹窗 */
  const openShare = () => {
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }
    setIsShareModalOpen(true);
  };

  const highlightRow = () => {
    const el = document.getElementById(CURRENT_USER_ROW_ID);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-[#33D6FF]");
    window.setTimeout(() => el.classList.remove("ring-2", "ring-[#33D6FF]"), 1500);
  };

  /** ① 定位器点击：已排名 → 翻到我所在页再滚到我那行；未排名 → 滚到 ② */
  const jumpToMe = () => {
    if (!currentUser || isCurrentUserInTopThree) {
      document.getElementById(YOUR_RANKING_ID)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const idx = restOfList.findIndex((u) => u.username === currentUserUsername);
    if (idx < 0) {
      document.getElementById(YOUR_RANKING_ID)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const targetPage = Math.floor(idx / PAGE_SIZE) + 1;
    if (targetPage !== safePage) {
      setPage(targetPage);
      window.setTimeout(highlightRow, 80);
    } else {
      highlightRow();
    }
  };

  const shareModal = (
    <ShareRankModal
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      user={currentUser || topThree[0]}
      referralCode={referralCode || "OMENX2025"}
      isMobile={isMobile}
    />
  );

  const locator = (
    <RankLocator
      user={currentUser}
      sortType={sortType}
      isLoggedIn={isLoggedIn}
      variant={isMobile ? "mobile" : "desktop"}
      anchorId={YOUR_RANKING_ID}
      onJump={jumpToMe}
      onSignIn={() => setAuthOpen(true)}
    />
  );

  /* ----------------------------- mobile ----------------------------- */
  if (isMobile) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <MobileHeader
            title="Leaderboard"
            showBack
            showLogo={false}
            rightContent={
              <div className="-mr-2 flex items-center gap-1">
                <MobileHeaderIconButton aria-label="Share" onClick={openShare}>
                  <Share2 className="h-5 w-5" strokeWidth={1.5} />
                </MobileHeaderIconButton>
              </div>
            }
          />

          {/* 头图：移动端是独立构图变体，不是桌面裁切；压暗层已烘进像素 */}
          <img
            src={heroMobile}
            alt=""
            aria-hidden="true"
            className="pointer-events-none block w-full select-none"
            style={{ aspectRatio: "390 / 113", objectFit: "cover" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <h1 className="sr-only">Leaderboard</h1>

          <div
            className="px-4"
            style={{ paddingTop: 16, paddingBottom: "calc(var(--bottom-nav-h, 76px) + 92px)" }}
          >
            <LeaderboardFiltersMobile
              sortType={sortType}
              onSortChange={setSortType}
              period={period}
              onPeriodChange={setPeriod}
            />

            <h2
              className="font-display"
              style={{ marginTop: 16, fontSize: 14, fontWeight: 700, lineHeight: "20px", color: "#F2F3F5" }}
            >
              Overall Ranking
            </h2>

            <div className="relative" style={{ marginTop: 16 }}>
              <LeaderboardPodium topThree={topThree} sortType={sortType} variant="mobile" />
            </div>

            <div className="relative z-10" style={{ marginTop: 16 }}>
              <LeaderboardListMobile
                rows={pageRows}
                sortType={sortType}
                currentUsername={isLoggedIn ? currentUserUsername : undefined}
                rangeLabel={rangeLabel}
                page={safePage}
                pageCount={pageCount}
                onPageChange={setPage}
              />
            </div>

            <div className="relative z-10" style={{ marginTop: 16 }}>
              <YourRankingCardMobile id={YOUR_RANKING_ID} data={yourRanking} onShare={openShare} />
            </div>
          </div>
        </div>

        <div className="bg-card/50" style={{ paddingBottom: "var(--bottom-nav-h, 76px)" }}>
          <SeoFooter />
        </div>

        {locator}
        <BottomNav />
        {shareModal}
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  /* ----------------------------- desktop ---------------------------- */
  return (
    <>
      <EventsDesktopHeader />

      {/*
        全宽舞台：头图 + 筛选行 + 领奖台。纵向坐标逐条对 Figma 绝对值（以头图顶为 0）：
        头图 0-384 / 筛选行 430-478 / 领奖台 526 起，版面占到 977 为止
        （领奖台实渲到 1204，227px 故意溢出，被下面不透明的表格卡盖住）
        地面渐变带 700:29476 = y815 h236，全宽 1440。
      */}
      <div className="relative bg-background">
        <img
          src={heroDesktop}
          alt=""
          aria-hidden="true"
          className="pointer-events-none block w-full select-none"
          style={{ aspectRatio: "1440 / 384", objectFit: "cover" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <h1 className="sr-only">Leaderboard</h1>

        <div className="mx-auto w-full max-w-7xl px-4 lg:px-6" style={{ paddingTop: 46 }}>
          <LeaderboardFiltersDesktop
            sortType={sortType}
            onSortChange={setSortType}
            period={period}
            onPeriodChange={setPeriod}
            onShare={openShare}
          />
          <div style={{ marginTop: 48 }}>
            <LeaderboardPodium topThree={topThree} sortType={sortType} variant="desktop" />
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0"
          style={{
            top: 815,
            height: 236,
            background: "linear-gradient(180deg, rgba(9,10,11,0) 6.568%, #090A0B 70.551%)",
          }}
        />
      </div>

      {/* 表格 y=1041（= 舞台底 977 + 64），Your Ranking 再 +24 */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 lg:px-6" style={{ paddingTop: 64 }}>
        <LeaderboardTableDesktop
          rows={pageRows}
          sortType={sortType}
          currentUsername={isLoggedIn ? currentUserUsername : undefined}
          rangeLabel={rangeLabel}
          page={safePage}
          pageCount={pageCount}
          onPageChange={setPage}
        />

        <div style={{ marginTop: 24 }}>
          <YourRankingBarDesktop
            id={YOUR_RANKING_ID}
            data={yourRanking}
            isLoggedIn={isLoggedIn}
            onShare={openShare}
          />
        </div>
      </main>

      <SeoFooter />
      {locator}
      {shareModal}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
