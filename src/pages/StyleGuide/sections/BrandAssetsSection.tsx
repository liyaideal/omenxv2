// ============================================================
// Brand assets · IP 插画 —— 素材台账（静态）
// 零运行时 fetch、零日期函数：入仓日期一律写死字面量。
// 只增不删：资产被替换时保留旧行并打 LEGACY 徽标。
// ============================================================
import { SectionWrapper, SubSection } from "../components/SectionWrapper";

/* ---- 真实 import：缩略图必须渲染仓库里的那一枚，禁止手抄路径字符串当展示 ---- */
import heroThread from "@/assets/wallet/hero-thread.webp";
import heroThreadMobile from "@/assets/wallet/hero-thread-mobile.png";
import lynxEmptyActivity from "@/assets/wallet/lynx-empty-activity.png";
import lynxEmptyAddresses from "@/assets/wallet/lynx-empty-addresses.png";
import lynxEmptyRecovery from "@/assets/wallet/lynx-empty-recovery.png";
import omenxLogo from "@/assets/omenx-logo.svg";
import hedgeEntryBanner from "@/assets/hedge-entry-banner.png";
import hedgeEntryBannerMobile from "@/assets/hedge-entry-banner-mobile.png";
import hedgeHeroV3 from "@/assets/hedge-hero-v3.png.asset.json";
import hedgeHeroV2 from "@/assets/hedge-hero-v2.png.asset.json";
import hedgeHeroPop from "@/assets/hedge-hero-pop.png.asset.json";
import hedgeHero from "@/assets/hedge-hero.png";
import hedgeHeroMobile from "@/assets/hedge-hero-mobile.png";
import hedgeBannerHero from "@/assets/hedge-banner-hero.png";
import bannerHedge from "@/assets/banner-hedge.jpg";
import bannerMainnetLaunch from "@/assets/banner-mainnet-launch.jpg";
import mainnetCoin from "@/assets/mainnet-coin.png";
import mainnetLaunchCoin from "@/assets/mainnet-launch-coin.jpg";
import bonusBadge from "@/assets/bonus-badge.gif";
import penguinGiftBox from "@/assets/penguin-gift-box.gif";
import rewardsGiftBoxGif from "@/assets/rewards-gift-box.gif";
import rewardsGiftBoxPng from "@/assets/rewards-gift-box.png";
import treasureChest from "@/assets/treasure-chest.gif";
import treasureDropSuccess from "@/assets/treasure-drop-success.gif";
import treasurePenguin from "@/assets/treasure-penguin.gif";
import soccerBall from "@/assets/soccer-ball.png.asset.json";
import trophySilhouette from "@/assets/trophy-silhouette.png.asset.json";
import kvWorldCup from "@/assets/campaigns/kv-worldcup.jpg.asset.json";
import kvStarter from "@/assets/campaigns/kv-starter.jpg.asset.json";
import kvLaowang from "@/assets/campaigns/kv-laowang.jpg.asset.json";
import kvCpi from "@/assets/campaigns/kv-cpi.jpg.asset.json";
import laowangAvatar from "@/assets/campaigns/laowang-avatar.jpg.asset.json";

interface Props {
  isMobile: boolean;
}

interface AssetRow {
  src: string;
  path: string;
  size: string;
  format: string;
  usage: string;
  added: string;
  legacy?: boolean;
}

/* ---------------- Ⓐ Wallet（R-W2 / R-W3 本轮入仓） ---------------- */
const WALLET: AssetRow[] = [
  {
    src: heroThread,
    path: "src/assets/wallet/hero-thread.webp",
    size: "1920 × 286",
    format: "WEBP",
    usage: "/wallet 桌面 hero 艺术底（HeroEquityCard 桌面分支）",
    added: "2026-09-03",
  },
  {
    src: heroThreadMobile,
    path: "src/assets/wallet/hero-thread-mobile.png",
    size: "1074 × 774",
    format: "PNG",
    usage: "/wallet 移动 hero 整幅扁平图（HeroEquityCard compact 分支）",
    added: "2026-09-03",
  },
  {
    src: lynxEmptyActivity,
    path: "src/assets/wallet/lynx-empty-activity.png",
    size: "330 × 330",
    format: "PNG",
    usage: "/wallet 流水空态（TransactionHistory · 无筛选时）",
    added: "2026-09-03",
  },
  {
    src: lynxEmptyAddresses,
    path: "src/assets/wallet/lynx-empty-addresses.png",
    size: "330 × 330",
    format: "PNG",
    usage: "/wallet 地址簿空态（桌面卡 + 移动 drawer）",
    added: "2026-09-03",
  },
  {
    src: lynxEmptyRecovery,
    path: "src/assets/wallet/lynx-empty-recovery.png",
    size: "330 × 330",
    format: "PNG",
    usage: "/wallet/recovery 列表空态（No recovery requests yet）",
    added: "2026-09-03",
  },
];

/* ---------------- Ⓑ 品牌标识 ---------------- */
const BRAND: AssetRow[] = [
  {
    src: omenxLogo,
    path: "src/assets/omenx-logo.svg",
    size: "矢量",
    format: "SVG",
    usage: "品牌主标识：Design tokens 节、Leaderboard、H2E campaign 详情",
    added: "2026-07-23",
  },
];

/* ---------------- Ⓒ 首页 / Events lynx 插画（public） ---------------- */
const HOME: AssetRow[] = [
  {
    src: "/assets/desktop/hero-lynx.png",
    path: "public/assets/desktop/hero-lynx.png",
    size: "1920 × 347",
    format: "WEBP（.png 后缀）",
    usage: "首页 Hero 桌面插画（HomeHero）",
    added: "2026-08-29",
  },
  {
    src: "/assets/mobile/hero-lynx.png",
    path: "public/assets/mobile/hero-lynx.png",
    size: "716 × 178",
    format: "PNG",
    usage: "首页 Hero 移动插画（HomeHero）",
    added: "2026-08-29",
  },
  {
    src: "/assets/desktop/will-it-happen.png",
    path: "public/assets/desktop/will-it-happen.png",
    size: "798 × 745",
    format: "PNG",
    usage: "/events 桌面身份卡插画",
    added: "2026-08-29",
  },
  {
    src: "/assets/mobile/will-it-happen.png",
    path: "public/assets/mobile/will-it-happen.png",
    size: "748 × 180",
    format: "PNG",
    usage: "/events 移动 110px 目录横幅插画",
    added: "2026-08-29",
  },
  {
    src: "/assets/desktop/whats-worth-watching.png",
    path: "public/assets/desktop/whats-worth-watching.png",
    size: "798 × 745",
    format: "PNG",
    usage: "未接线（备用：目录第二身份卡方向）",
    added: "2026-08-29",
  },
  {
    src: "/assets/mobile/whats-worth-watching.png",
    path: "public/assets/mobile/whats-worth-watching.png",
    size: "748 × 180",
    format: "PNG",
    usage: "未接线（备用：目录第二身份卡方向）",
    added: "2026-08-29",
  },
  {
    src: "/assets/desktop/empty-celebrate.png",
    path: "public/assets/desktop/empty-celebrate.png",
    size: "220 × 227",
    format: "PNG",
    usage: "未接线（备用：结算完成 / 全清空态）",
    added: "2026-08-29",
  },
  {
    src: "/assets/desktop/empty-error.png",
    path: "public/assets/desktop/empty-error.png",
    size: "160 × 220",
    format: "PNG",
    usage: "未接线（备用：错误态）",
    added: "2026-08-29",
  },
  {
    src: "/assets/desktop/empty-no-boost.png",
    path: "public/assets/desktop/empty-no-boost.png",
    size: "348 × 220",
    format: "PNG",
    usage: "未接线（备用：无 Boost 持仓空态）",
    added: "2026-08-29",
  },
  {
    src: "/assets/desktop/empty-no-starred-event.png",
    path: "public/assets/desktop/empty-no-starred-event.png",
    size: "300 × 310",
    format: "PNG",
    usage: "未接线（备用：Watchlist 空态）",
    added: "2026-08-29",
  },
  {
    src: "/assets/mobile/empty-celebrate.png",
    path: "public/assets/mobile/empty-celebrate.png",
    size: "220 × 227",
    format: "PNG",
    usage: "未接线（备用：移动同款）",
    added: "2026-08-29",
  },
  {
    src: "/assets/mobile/empty-error.png",
    path: "public/assets/mobile/empty-error.png",
    size: "160 × 220",
    format: "PNG",
    usage: "未接线（备用：移动同款）",
    added: "2026-08-29",
  },
  {
    src: "/assets/mobile/empty-no-boost.png",
    path: "public/assets/mobile/empty-no-boost.png",
    size: "348 × 220",
    format: "PNG",
    usage: "未接线（备用：移动同款）",
    added: "2026-08-29",
  },
  {
    src: "/assets/mobile/empty-no-starred-event.png",
    path: "public/assets/mobile/empty-no-starred-event.png",
    size: "300 × 310",
    format: "PNG",
    usage: "未接线（备用：移动同款）",
    added: "2026-08-29",
  },
  {
    src: "/lynx-auth-placeholder.png",
    path: "public/lynx-auth-placeholder.png",
    size: "393 × 364",
    format: "PNG",
    usage: "登录 / 注册页插画（AuthContent）",
    added: "2026-08-24",
  },
  {
    src: "/event-art-samples/f1-drivers-2026.png",
    path: "public/event-art-samples/f1-drivers-2026.png",
    size: "1024 × 1024",
    format: "PNG",
    usage: "style-guide「Event 美术方向」批准样张",
    added: "2026-07-31",
  },
  {
    src: "/event-art-samples/us-coin-updown-20260731.png",
    path: "public/event-art-samples/us-coin-updown-20260731.png",
    size: "1024 × 1024",
    format: "PNG",
    usage: "style-guide「Event 美术方向」批准样张",
    added: "2026-07-31",
  },
];

/* ---------------- Ⓓ Rewards / Campaign KV ---------------- */
const CAMPAIGN: AssetRow[] = [
  {
    src: kvWorldCup.url,
    path: "src/assets/campaigns/kv-worldcup.jpg.asset.json",
    size: "CDN 资产",
    format: "JPG（CDN）",
    usage: "Rewards campaign KV — World Cup",
    added: "2026-08-07",
  },
  {
    src: kvStarter.url,
    path: "src/assets/campaigns/kv-starter.jpg.asset.json",
    size: "CDN 资产",
    format: "JPG（CDN）",
    usage: "Rewards campaign KV — Starter",
    added: "2026-08-07",
  },
  {
    src: kvLaowang.url,
    path: "src/assets/campaigns/kv-laowang.jpg.asset.json",
    size: "CDN 资产",
    format: "JPG（CDN）",
    usage: "Rewards campaign KV — 老王",
    added: "2026-08-07",
  },
  {
    src: laowangAvatar.url,
    path: "src/assets/campaigns/laowang-avatar.jpg.asset.json",
    size: "CDN 资产",
    format: "JPG（CDN）",
    usage: "Rewards campaign 头像 — 老王",
    added: "2026-08-07",
  },
  {
    src: kvCpi.url,
    path: "src/assets/campaigns/kv-cpi.jpg.asset.json",
    size: "CDN 资产",
    format: "JPG（CDN）",
    usage: "旧 CPI campaign KV — 站内已无引用",
    added: "2026-08-07",
    legacy: true,
  },
];

/* ---------------- Ⓔ Hedge / H2E ---------------- */
const HEDGE: AssetRow[] = [
  {
    src: hedgeEntryBanner,
    path: "src/assets/hedge-entry-banner.png",
    size: "1920 × 480",
    format: "PNG",
    usage: "Hedge 入口横幅（桌面）",
    added: "2026-07-23",
  },
  {
    src: hedgeEntryBannerMobile,
    path: "src/assets/hedge-entry-banner-mobile.png",
    size: "1920 × 640",
    format: "PNG",
    usage: "Hedge 入口横幅（移动）",
    added: "2026-07-23",
  },
  {
    src: hedgeHeroV3.url,
    path: "src/assets/hedge-hero-v3.png.asset.json",
    size: "CDN 资产",
    format: "PNG（CDN）",
    usage: "Hedge hero 现行版（HedgeHero）",
    added: "2026-07-23",
  },
  {
    src: hedgeHeroV2.url,
    path: "src/assets/hedge-hero-v2.png.asset.json",
    size: "CDN 资产",
    format: "PNG（CDN）",
    usage: "Hedge hero 第二版 — 已被 v3 取代",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: hedgeHeroPop.url,
    path: "src/assets/hedge-hero-pop.png.asset.json",
    size: "CDN 资产",
    format: "PNG（CDN）",
    usage: "Hedge hero pop 版 — 已被 v3 取代",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: hedgeHero,
    path: "src/assets/hedge-hero.png",
    size: "1448 × 1086",
    format: "PNG",
    usage: "Hedge hero 初版 — 站内已无引用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: hedgeHeroMobile,
    path: "src/assets/hedge-hero-mobile.png",
    size: "1920 × 640",
    format: "PNG",
    usage: "Hedge hero 初版移动 — 站内已无引用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: hedgeBannerHero,
    path: "src/assets/hedge-banner-hero.png",
    size: "1793 × 877",
    format: "PNG",
    usage: "Hedge 横幅初版 — 站内已无引用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: bannerHedge,
    path: "src/assets/banner-hedge.jpg",
    size: "1916 × 821",
    format: "PNG（.jpg 后缀）",
    usage: "Hedge 首页横幅初版 — 站内已无引用",
    added: "2026-07-23",
    legacy: true,
  },
];

/* ---------------- Ⓕ Mainnet / Rewards 旧动效 ---------------- */
const LEGACY_MOTION: AssetRow[] = [
  {
    src: bannerMainnetLaunch,
    path: "src/assets/banner-mainnet-launch.jpg",
    size: "1916 × 821",
    format: "PNG（.jpg 后缀）",
    usage: "Mainnet 上线横幅 — 站内已无引用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: mainnetCoin,
    path: "src/assets/mainnet-coin.png",
    size: "1254 × 1254",
    format: "PNG",
    usage: "Mainnet 金币 — 站内已无引用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: mainnetLaunchCoin,
    path: "src/assets/mainnet-launch-coin.jpg",
    size: "1672 × 941",
    format: "PNG（.jpg 后缀）",
    usage: "Mainnet 上线金币 — 站内已无引用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: bonusBadge,
    path: "src/assets/bonus-badge.gif",
    size: "640 × 640",
    format: "GIF",
    usage: "Trial bonus 徽标动效 — 站内已无引用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: treasureChest,
    path: "src/assets/treasure-chest.gif",
    size: "640 × 640",
    format: "GIF",
    usage: "Mystery box 宝箱 — mainnet 已停用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: treasureDropSuccess,
    path: "src/assets/treasure-drop-success.gif",
    size: "340 × 282",
    format: "GIF",
    usage: "Mystery box 开箱成功 — mainnet 已停用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: treasurePenguin,
    path: "src/assets/treasure-penguin.gif",
    size: "332 × 284",
    format: "GIF",
    usage: "Mystery box 企鹅 — mainnet 已停用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: penguinGiftBox,
    path: "src/assets/penguin-gift-box.gif",
    size: "332 × 284",
    format: "GIF",
    usage: "Rewards 礼盒企鹅 — 站内已无引用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: rewardsGiftBoxGif,
    path: "src/assets/rewards-gift-box.gif",
    size: "400 × 400",
    format: "GIF",
    usage: "Rewards 礼盒动效 — 站内已无引用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: rewardsGiftBoxPng,
    path: "src/assets/rewards-gift-box.png",
    size: "1024 × 1024",
    format: "PNG",
    usage: "Rewards 礼盒静帧 — 站内已无引用",
    added: "2026-07-23",
    legacy: true,
  },
  {
    src: soccerBall.url,
    path: "src/assets/soccer-ball.png.asset.json",
    size: "CDN 资产",
    format: "PNG（CDN）",
    usage: "World Cup 装饰件",
    added: "2026-07-23",
  },
  {
    src: trophySilhouette.url,
    path: "src/assets/trophy-silhouette.png.asset.json",
    size: "CDN 资产",
    format: "PNG（CDN）",
    usage: "World Cup 奖杯剪影装饰件",
    added: "2026-07-23",
  },
];

const ALL_GROUPS: Array<[string, AssetRow[]]> = [
  ["Ⓐ Wallet（R-W2 / R-W3）", WALLET],
  ["Ⓑ 品牌标识", BRAND],
  ["Ⓒ 首页 / Events / Auth lynx 插画", HOME],
  ["Ⓓ Rewards campaign KV", CAMPAIGN],
  ["Ⓔ Hedge / H2E", HEDGE],
  ["Ⓕ Mainnet / Rewards 动效与装饰", LEGACY_MOTION],
];

const TOTAL = ALL_GROUPS.reduce((n, [, rows]) => n + rows.length, 0);
const LEGACY_COUNT = ALL_GROUPS.reduce(
  (n, [, rows]) => n + rows.filter((r) => r.legacy).length,
  0,
);

const AssetCard = ({ row, isMobile }: { row: AssetRow; isMobile: boolean }) => (
  <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/40 bg-background/60">
      <img
        src={row.src}
        alt=""
        aria-hidden
        draggable={false}
        className="max-h-full max-w-full object-contain pointer-events-none select-none"
      />
    </div>
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="break-all font-mono text-[11px] text-foreground">{row.path}</span>
        {row.legacy && (
          <span className="shrink-0 rounded-full border border-trading-yellow/30 bg-trading-yellow/10 px-2 py-0.5 text-[10px] text-trading-yellow">
            LEGACY · 已弃用
          </span>
        )}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {row.size} · {row.format} · 入仓 {row.added}
      </div>
      <div className={isMobile ? "text-[11px] text-foreground/80" : "text-xs text-foreground/80"}>
        {row.usage}
      </div>
    </div>
  </div>
);

export const BrandAssetsSection = ({ isMobile }: Props) => (
  <SectionWrapper
    id="foundations-brand-assets"
    title="Brand assets · IP 插画"
    platform="shared"
  >
    <p className="mb-5 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-xs leading-5 text-foreground/85">
      素材入仓流程：设计导出 → CPO 上传 Lovable → 工单接线 → 本节同轮登记（只增不删）。素材找不到先来这里。
    </p>

    <p className="mb-6 text-xs text-muted-foreground">
      台账共 {TOTAL} 枚（其中 {LEGACY_COUNT} 枚标 LEGACY）。缩略图为仓库真实资产渲染。
      不入账：qa-* 取证目录、纯功能图标（chain-logos / company-logos / token-logos /
      platform-logos / brand-logos / favicon / placeholder.svg）、类目底图 card-bg 与事件配图
      event-images。
    </p>

    <div className="space-y-8">
      {ALL_GROUPS.map(([title, rows]) => (
        <SubSection key={title} title={`${title} · ${rows.length}`}>
          <div className={isMobile ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}>
            {rows.map((row) => (
              <AssetCard key={row.path} row={row} isMobile={isMobile} />
            ))}
          </div>
        </SubSection>
      ))}
    </div>
  </SectionWrapper>
);
