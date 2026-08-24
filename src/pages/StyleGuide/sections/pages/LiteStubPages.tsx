import { NotStartedPage } from "./shell";

type P = { isMobile: boolean };

export const LiteLeaderboardPage = (_: P) => (
  <NotStartedPage
    id="lite-leaderboard"
    title="Leaderboard"
    route="/leaderboard"
    what="覆盖范围：霓虹 hero（现有豁免）、榜单行、周期切换、我的排名条。"
  />
);

export const LiteSettingsPage = (_: P) => (
  <NotStartedPage
    id="lite-settings"
    title="Settings"
    route="/settings · /settings/transparency"
    what="覆盖范围：账户设置主页、通知/安全分组、transparency 子页（其现有 demo 暂存 Legacy 区，改版后迁入本节）。"
  />
);

export const LiteInsightsPage = (_: P) => (
  <NotStartedPage
    id="lite-insights"
    title="Insights"
    route="/insights"
    what="覆盖范围：洞察列表、文章详情、空态。"
  />
);

export const LiteContentPage = (_: P) => (
  <NotStartedPage
    id="lite-content"
    title="内容页（FAQ · Glossary · About · Methodology · 法务）"
    route="/faq · /glossary · /about · /methodology · /privacy-policy · /terms-of-service"
    what="覆盖范围：共用 SeoPageLayout（现有豁免），改版时作为一轮统一处理。"
  />
);
