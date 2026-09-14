import { LitePage } from "./shell";
import { SubSection, DualDevicePreview } from "../../components";

type P = { isMobile: boolean };

/**
 * /affiliate — Affiliate Program marketing page (DESIGN.md §19 skeleton at scale L, §19.4).
 * Every demo below mounts the production component through the preview registry
 * (real breakpoints in the 375 iframe); no hand-copied markup.
 */
export const LiteAffiliatePage = (_: P) => (
  <LitePage
    id="lite-affiliate"
    title="Affiliate Program"
    route="/affiliate"
    status="done"
    note="对外营销页（KOL / BD 受众）。骨架走 §19（轨线 · 发丝线 · 幽灵编号 · Space Grotesk），尺度走 §19.4 L：单一底色不做交替带、display 标题 40/64px、数字为主角。文案冻结自 affiliateContent.ts，禁改写。B2B 营销面豁免 Lite 禁词（§19.4）。"
  >
    <SubSection
      title="AF-1 · 整页（桌面 / 375）"
      description="真路由组件 AffiliatePage：桌面态 EventsDesktopHeader + 六节 + SeoFooter；375 态自动切 AffiliatePageMobile（MobileHeader 内页形态 · 单列 · sticky Apply now 滚过 hero 才浮出）。Hero 插画位在资产落仓前显示开发占位框。"
      platform="shared"
    >
      <DualDevicePreview previewKey="affiliate-page" label="AffiliatePage · full route" minHeight={900} />
    </SubSection>

    <SubSection
      title="AF-2 · 收益账本 02.1（EarningsLedger）"
      description="三栏共享边框账本 + 合计条；结果数 40px volt、合计 64px。375 态 stacked=true 纵向三段。数字来自 HOW_YOU_EARN（冻结）。"
      platform="shared"
    >
      <DualDevicePreview previewKey="affiliate-earnings-ledger" label="EarningsLedger · desktop 3-col / mobile stacked" minHeight={640} />
    </SubSection>

    <SubSection
      title="AF-3 · 费率对比 02.2（FeeBaseComparison）"
      description="6.6× 头条（112px / 80px）+ 两行规格表；OmenX 行 accent 高亮。375 态每行展开为 2×2 指标格。"
      platform="shared"
    >
      <DualDevicePreview previewKey="affiliate-fee-base" label="FeeBaseComparison · desktop / mobile" minHeight={480} />
    </SubSection>

    <SubSection
      title="AF-4 · FAQ 两态（shadcn Accordion）"
      description="type=single collapsible；页面默认展开首条（AF-4b）。问 18px display、答 15px。"
      platform="shared"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <DualDevicePreview previewKey="affiliate-faq-collapsed" label="AF-4a · 全部收起" minHeight={420} />
        <DualDevicePreview previewKey="affiliate-faq-expanded" label="AF-4b · 首条展开（页面默认）" minHeight={420} />
      </div>
    </SubSection>

    <SubSection
      title="AF-5 · Hero 插画位（AffiliateHeroArt）"
      description="资产路径 public/assets/{desktop,mobile}/affiliate-hero-lynx.png（560×560 / 343×200，透明底）。文件缺失时：生产不渲染，开发显示虚线规格框（本帧即缺失态）。"
      platform="shared"
    >
      <DualDevicePreview previewKey="affiliate-hero-art-slot" label="AffiliateHeroArt · missing-asset state" minHeight={360} />
    </SubSection>
  </LitePage>
);
