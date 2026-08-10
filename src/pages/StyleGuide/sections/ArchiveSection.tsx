// ============================================================
// Archive — retired components. Kept renderable for reference only.
// Importing any of these into a product page is a defect.
// ============================================================
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { PageHeader } from "@/components/PageHeader";
import { PageTitle } from "@/components/PageTitle";

export const ArchiveSection = (_: { isMobile: boolean }) => (
  <SectionWrapper
    id="archive"
    title="Archive — 退役件"
    platform="shared"
    description="已退役组件的存档展示。产品页面导入其中任何一个都算缺陷；替代方案见 Foundations → 全站规范（开场体系 v2）。"
  >
    <div className="space-y-10">
      <SubSection
        title="PageTitle (RETIRED 2026-08-07)"
        description="栏目页大标题。退役理由：开场体系 v2 规定栏目页无 h1，实体名才配标题。"
      >
        <div className="rounded-xl border border-dashed border-border p-6 opacity-70">
          <PageTitle title="Vouchers" />
        </div>
      </SubSection>

      <SubSection
        title="PageHeader (RETIRED)"
        description="标题 + 副标题 + 右侧动作槽。退役理由同上；账户页改为数据开场，栏目页改为控件开场。"
      >
        <div className="space-y-4 rounded-xl border border-dashed border-border p-6 opacity-70">
          <PageHeader title="Wallet" subtitle="Deposit, withdraw and move funds between accounts." />
        </div>
      </SubSection>
    </div>
  </SectionWrapper>
);
