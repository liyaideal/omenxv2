import { NotStartedPage } from "./shell";

type P = { isMobile: boolean };

export const LiteContentPage = (_: P) => (
  <NotStartedPage
    id="lite-content"
    title="内容页（Glossary · 法务）"
    route="/glossary · /privacy-policy · /terms-of-service"
    what="覆盖范围：共用 SeoPageLayout（现有豁免），改版时作为一轮统一处理。About / FAQ / Methodology 已改跳帮助中心 help.omenxfoundation.org（CPO 2026-09-28），不再做站内页。"
  />
);
