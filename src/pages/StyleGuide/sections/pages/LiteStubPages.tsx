import { NotStartedPage } from "./shell";

type P = { isMobile: boolean };

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
