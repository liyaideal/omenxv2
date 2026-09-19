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
    note="对外营销页（KOL / BD 受众）。2026-09-18 按 Figma Omenx_Affiliate 设计稿（桌面 42:11744 / 移动 46:12621）整页回流：编号并入 eyebrow、h2 56/Medium/capitalize、卡片化分区、两处暗带（数据条 / CTA）、桌面左侧固定点导航、hero 为 X 视频循环、10 幅 lynx 插画由 AffiliateArt 按文件名解析（2026-09-19 已全部入仓）。文案冻结自 affiliateContent.ts，禁改写。B2B 营销面豁免 Lite 禁词（§19.4）。"
  >
    <SubSection
      title="AF-1 · 整页（桌面 / 375）"
      description="真路由组件 AffiliatePage：桌面态 EventsDesktopHeader + 六节 + 数据暗带 + Apply 插画带 + Veterans / Built on Base 全幅行 + CTA 暗带 + SeoFooter；375 态自动切 AffiliatePageMobile（MobileHeader 内页形态 · 24px 边距 · pill 跳转条 · sticky Apply now 滚过 hero 才浮出）。"
      platform="shared"
    >
      <DualDevicePreview previewKey="affiliate-page" label="AffiliatePage · full route" minHeight={900} />
    </SubSection>

    <SubSection
      title="AF-2 · 收益账本 02.1（EarningsLedger）"
      description="三张独立卡（#14161A · r8 · p24 · 阴影 0 18 25）+ volt 合计条（bg volt/5 · ring volt/15 · 64px）；结果数 30px 白 + volt 小标。375 态 stacked=true 纵向三卡 + 渐变合计条（44px volt）。数字来自 HOW_YOU_EARN（冻结）。"
      platform="shared"
    >
      <DualDevicePreview previewKey="affiliate-earnings-ledger" label="EarningsLedger · desktop 3-col / mobile stacked" minHeight={640} />
    </SubSection>

    <SubSection
      title="AF-3 · 费率对比 02.2（FeeBaseComparison）"
      description="卡内左右分栏：6.6× 头条（112px volt）+ 四列规格表（Space Grotesk 表头 10px · 值 18px · 总额 36px）；OmenX 行 volt/4 高亮圆角。375 态压缩成三行表（名 / “$10M · 0.40% · 50%” / 总额），OmenX 行 bg #192018、总额 16px Bold volt。"
      platform="shared"
    >
      <DualDevicePreview previewKey="affiliate-fee-base" label="FeeBaseComparison · desktop / mobile" minHeight={480} />
    </SubSection>

    <SubSection
      title="AF-4 · FAQ 两态（shadcn Accordion）"
      description="type=single collapsible；页面默认展开首条（AF-4b）。桌面 lg：问 18/28 display、chevron 18、答 14/24 max-w 672、分隔线 foreground/10；移动 md：问 17/25.5、chevron 16、答 14/1.4、border-t/b border/40。"
      platform="shared"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <DualDevicePreview previewKey="affiliate-faq-collapsed" label="AF-4a · 全部收起" minHeight={420} />
        <DualDevicePreview previewKey="affiliate-faq-expanded" label="AF-4b · 首条展开（页面默认）" minHeight={420} />
      </div>
    </SubSection>

    <SubSection
      title="AF-5 · Hero 视频循环 + 插画位（AffiliateHeroLoop / AffiliateArt）"
      description="Hero X 视觉是 9.8s MP4 循环（hero-x-loop.mp4，858×638），用 mix-blend-mode: screen 叠在页面底色上让视频自带的深蓝底消失，静音 / 自动播放 / inline / aria-hidden；桌面 661×496、移动 342×257。其余 10 幅插画共用 AffiliateArt：按文件名从 src/assets/affiliate/ 解析（import.meta.glob），缺文件时生产不渲染、开发显示虚线规格框。渐变叠加全部烘进导出图的 alpha，代码不再画渐变。台账见 Foundations「Brand assets」Ⓗ 组。"
      platform="shared"
    >
      <DualDevicePreview previewKey="affiliate-hero-art-slot" label="AffiliateHeroLoop + AffiliateArt(earn-band-desktop)" minHeight={360} />
    </SubSection>

    <SubSection
      title="AF-6 · 桌面点导航（AffiliateDotNav）"
      description="桌面专属：fixed left 40 / 垂直居中，≥1400px 视口才显示（1280 会压到容器）。JUMP_LINKS 六项一行一枚，IntersectionObserver 滚动联动：当前节显示编号 + 7.7px cyan 点，其余 4.8px #646972 点。字典帧里去 fixed 静态展示（无节可联动 → 恒 01）。"
      platform="desktop"
    >
      <DualDevicePreview previewKey="affiliate-dot-nav" label="AffiliateDotNav · static frame" minHeight={260} />
    </SubSection>
  </LitePage>
);
