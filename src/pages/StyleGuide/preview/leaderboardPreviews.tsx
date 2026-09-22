/**
 * Leaderboard previews（2026-09-22 Figma 回流，LB-1…21）。
 *
 * Truth Rule §16.1.1：每个 case 都挂生产组件本体 + fixture 注入，无手抄 markup。
 * 唯一的手写元素是间距包裹与「弹窗定位占位 div」（给 fixed inset-0 一个可测高度）。
 * fixture 全部为静态常量（铁律 4 确定性）：本页生产数据本身就是常量 mock，无运行时 fetch。
 */
import { useState } from "react";
import { LeaderboardFiltersDesktop, LeaderboardFiltersMobile } from "@/components/leaderboard/LeaderboardFilters";
import { LeaderboardPodium } from "@/components/leaderboard/LeaderboardPodium";
import { LeaderboardListMobile, LeaderboardTableDesktop } from "@/components/leaderboard/LeaderboardTable";
import { YourRankingBarDesktop, YourRankingCardMobile, type YourRankingData } from "@/components/leaderboard/YourRankingBar";
import { RankLocator } from "@/components/leaderboard/RankLocator";
import { ShareRankModal } from "@/components/leaderboard/ShareRankModal";
import { RankShareCard } from "@/components/leaderboard/RankShareCard";
import type { LeaderboardUser, PeriodType, SortType } from "@/components/leaderboard/leaderboardKit";
import Leaderboard from "@/pages/Leaderboard";

const noop = () => undefined;

const Pad = ({ children, wide }: { children: React.ReactNode; wide?: boolean }) => (
  <div className={wide ? "p-6" : "p-6 max-w-3xl"}>{children}</div>
);

/** 给 Radix / fixed inset-0 一个可测高度的定位占位（零视觉样式） */
const OverlayBox = ({ children, height }: { children: React.ReactNode; height: number }) => (
  <div className="relative" style={{ height }}>
    {children}
  </div>
);

/* ---------------- fixtures（照生产 mockLeaderboardData 快照造，冻结） ---------------- */

const avatar = (seed: string, bg: string) =>
  `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seed}&backgroundColor=${bg}`;

const U = (
  rank: number,
  username: string,
  seed: string,
  bg: string,
  pnl: number,
  roi: number,
  volume: number,
  trades: number,
  rankChange: number
): LeaderboardUser => ({ rank, username, avatar: avatar(seed, bg), pnl, roi, volume, trades, rankChange });

const TOP_THREE: LeaderboardUser[] = [
  U(1, "CryptoWhale", "whale", "b6e3f4", 125430, 342.5, 2450000, 156, 0),
  U(2, "TradingMaster", "master", "c0aede", 89250, 287.3, 1890000, 234, 2),
  U(3, "ProfitHunter", "hunter", "d1d4f9", 67890, 198.7, 1560000, 189, -1),
];

const PAGE_ONE: LeaderboardUser[] = [
  U(4, "AlphaTrader", "alpha", "ffd5dc", 45670, 156.2, 980000, 145, 3),
  U(5, "MarketMaker", "maker", "ffdfbf", 34560, 134.8, 890000, 178, -2),
  U(6, "DiamondHands", "diamond", "b6e3f4", 28900, 112.4, 750000, 98, 1),
  U(7, "MoonShot", "moon", "c0aede", 23450, 98.6, 680000, 167, 0),
  U(8, "BullRunner", "bull", "d1d4f9", 19870, 87.3, 590000, 134, -3),
  U(9, "SmartMoney", "smart", "ffd5dc", 15690, 76.5, 480000, 112, 2),
  U(10, "TrendSurfer", "trend", "ffdfbf", 12340, 65.2, 390000, 89, -1),
  U(11, "Hodler", "hodler", "b6e3f4", 10200, 58.3, 320000, 76, 4),
  U(12, "BlockBuster", "block", "c0aede", 8900, 52.1, 280000, 68, -2),
  U(13, "CryptoNinja", "currentuser", "d1d4f9", 7650, 45.8, 245000, 52, 5),
];

const PAGE_LAST: LeaderboardUser[] = [
  U(24, "SwingTrader", "swing", "ffd5dc", 1920, 12.6, 72000, 18, 2),
  U(25, "CoinCollector", "coin", "ffdfbf", 1650, 10.4, 65000, 22, 1),
  U(26, "AltSeason", "alt", "b6e3f4", 1380, 8.2, 54000, 16, -1),
  U(27, "FuturesFreak", "futures", "c0aede", 1120, 6.1, 48000, 27, 0),
  U(28, "LeverageL", "leverage", "d1d4f9", 890, 4.3, 42000, 35, -2),
  U(29, "PerpsPlayer", "perps", "ffd5dc", 650, 2.8, 35000, 14, 1),
  U(30, "NewbieTrader", "newbie", "ffdfbf", 420, 1.5, 28000, 8, 0),
];

const ME = PAGE_ONE[9];

const RANKED: YourRankingData = {
  username: "CryptoNinja",
  avatar: ME.avatar,
  trades: 52,
  ranks: { pnl: 13, roi: 9, volume: 11 },
  pnl: "$7,650.00",
  roi: "45.80%",
  volume: "$245,000",
};

const UNRANKED: YourRankingData = {
  username: "Flintpainter_Arrow",
  avatar: avatar("flint", "ffdfbf"),
  trades: 0,
  ranks: { pnl: null, roi: null, volume: null },
  pnl: "$0.00",
  roi: "0.00%",
  volume: "$0.00",
};

const TABLE_COMMON = {
  rangeLabel: "4–13 of 30",
  page: 1,
  pageCount: 3,
  onPageChange: noop,
};

/* ---------------- LB-1 整页 ---------------- */

export const LeaderboardPageGuestPreview = () => <Leaderboard />;

/* ---------------- LB-3 / 3b / 4 筛选行 ---------------- */

const FiltersHost = ({ variant }: { variant: "desktop" | "mobile" }) => {
  const [sortType, setSortType] = useState<SortType>("pnl");
  const [period, setPeriod] = useState<PeriodType>("7d");
  return (
    <Pad wide>
      {variant === "desktop" ? (
        <LeaderboardFiltersDesktop
          sortType={sortType}
          onSortChange={setSortType}
          period={period}
          onPeriodChange={setPeriod}
          onShare={noop}
        />
      ) : (
        <LeaderboardFiltersMobile
          sortType={sortType}
          onSortChange={setSortType}
          period={period}
          onPeriodChange={setPeriod}
        />
      )}
    </Pad>
  );
};

export const LeaderboardFiltersDesktopPreview = () => <FiltersHost variant="desktop" />;
export const LeaderboardFiltersMobilePreview = () => <FiltersHost variant="mobile" />;

/* ---------------- LB-5…7 领奖台 ---------------- */

/**
 * 生产里领奖台只占版面 451（mobile 160），其余向下溢出并被表格/列表卡盖住。
 * 字典帧下面没有东西可盖，若不补留白台阶会被帧高截平——这里补等量底部留白
 * （纯间距，不改组件、不改 reservedH，帧里看到的仍是生产的真实占版高度 + 完整台阶）。
 */
const PODIUM_OVERFLOW = { desktop: 227, mobile: 69 } as const;

const PodiumHost = ({ sortType, variant }: { sortType: SortType; variant: "desktop" | "mobile" }) => (
  <div className="p-6" style={{ paddingBottom: 24 + PODIUM_OVERFLOW[variant] }}>
    <LeaderboardPodium topThree={TOP_THREE} sortType={sortType} variant={variant} />
  </div>
);

export const LeaderboardPodiumPnlPreview = () => <PodiumHost sortType="pnl" variant="desktop" />;
export const LeaderboardPodiumPnlMobilePreview = () => <PodiumHost sortType="pnl" variant="mobile" />;
export const LeaderboardPodiumRoiPreview = () => <PodiumHost sortType="roi" variant="desktop" />;
export const LeaderboardPodiumVolumePreview = () => <PodiumHost sortType="volume" variant="desktop" />;

/* ---------------- LB-8…12 表格 / 列表 / 分页 ---------------- */

export const LeaderboardTablePreview = () => (
  <Pad wide>
    <LeaderboardTableDesktop rows={PAGE_ONE} sortType="pnl" {...TABLE_COMMON} />
  </Pad>
);

export const LeaderboardTableMePreview = () => (
  <Pad wide>
    <LeaderboardTableDesktop rows={PAGE_ONE} sortType="pnl" currentUsername="CryptoNinja" {...TABLE_COMMON} />
  </Pad>
);

export const LeaderboardTableLastPagePreview = () => (
  <Pad wide>
    <LeaderboardTableDesktop
      rows={PAGE_LAST}
      sortType="pnl"
      rangeLabel="24–30 of 30"
      page={3}
      pageCount={3}
      onPageChange={noop}
    />
  </Pad>
);

export const LeaderboardListMobilePreview = () => (
  <Pad wide>
    <LeaderboardListMobile rows={PAGE_ONE} sortType="pnl" {...TABLE_COMMON} />
  </Pad>
);

export const LeaderboardListMobileMePreview = () => (
  <Pad wide>
    <LeaderboardListMobile rows={PAGE_ONE} sortType="pnl" currentUsername="CryptoNinja" {...TABLE_COMMON} />
  </Pad>
);

/* ---------------- LB-13…15 Your Ranking ---------------- */

export const YourRankingRankedPreview = () => (
  <Pad wide>
    <YourRankingBarDesktop id="sg-yr-ranked" data={RANKED} isLoggedIn onShare={noop} />
  </Pad>
);

export const YourRankingUnrankedPreview = () => (
  <Pad wide>
    <YourRankingBarDesktop id="sg-yr-unranked" data={UNRANKED} isLoggedIn onShare={noop} />
  </Pad>
);

export const YourRankingGuestPreview = () => (
  <Pad wide>
    <YourRankingBarDesktop id="sg-yr-guest" data={UNRANKED} isLoggedIn={false} onShare={noop} />
  </Pad>
);

export const YourRankingMobilePreview = () => (
  <Pad wide>
    <YourRankingCardMobile id="sg-yr-m" data={RANKED} isLoggedIn onShare={noop} />
  </Pad>
);

export const YourRankingMobileGuestPreview = () => (
  <Pad wide>
    <YourRankingCardMobile id="sg-yr-mg" data={UNRANKED} isLoggedIn={false} onShare={noop} />
  </Pad>
);

/* ---------------- LB-16…18 浮动定位器（previewStatic） ---------------- */

const LocatorHost = ({
  user,
  isLoggedIn,
  variant,
}: {
  user?: LeaderboardUser;
  isLoggedIn: boolean;
  variant: "desktop" | "mobile";
}) => (
  <Pad wide>
    <RankLocator
      user={user}
      sortType="pnl"
      isLoggedIn={isLoggedIn}
      variant={variant}
      anchorId="sg-locator-anchor"
      onJump={noop}
      onSignIn={noop}
      previewStatic
    />
  </Pad>
);

export const RankLocatorRankedPreview = () => <LocatorHost user={ME} isLoggedIn variant="desktop" />;
export const RankLocatorRankedMobilePreview = () => <LocatorHost user={ME} isLoggedIn variant="mobile" />;
export const RankLocatorUnrankedPreview = () => (
  <LocatorHost user={{ ...ME, username: "Flintpainter_Arrow", trades: 0 }} isLoggedIn variant="desktop" />
);
export const RankLocatorGuestPreview = () => <LocatorHost isLoggedIn={false} variant="desktop" />;

/* ---------------- LB-19…21 分享弹窗 / 分享卡 ---------------- */

export const ShareModalPreview = () => (
  <OverlayBox height={680}>
    <ShareRankModal isOpen onClose={noop} user={ME} referralCode="75CN66" isMobile={false} />
  </OverlayBox>
);

export const ShareDrawerMobilePreview = () => (
  <OverlayBox height={760}>
    <ShareRankModal isOpen onClose={noop} user={ME} referralCode="75CN66" isMobile />
  </OverlayBox>
);

export const RankShareCardPreview = () => (
  <div className="p-6" style={{ maxWidth: 384 }}>
    <RankShareCard
      user={ME}
      referralCode="75CN66"
      shareHost="omenx.lovable.app"
      shareUrl="https://omenx.lovable.app?ref=75CN66"
    />
  </div>
);
