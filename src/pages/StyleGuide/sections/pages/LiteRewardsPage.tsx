import { LitePage } from "./shell";
import { RewardsStatesSection } from "../RewardsStatesSection";
import { RewardsSection } from "../RewardsSection";
import { RewardsMobileSection } from "../RewardsMobileSection";

type P = { isMobile: boolean };

export const LiteRewardsPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-rewards"
    title="Rewards"
    route="/rewards · /rewards/campaign/:id"
    status="done"
    note="本页 = 产品页 /rewards 的状态字典 · 样式与布局看生产页，状态与判定看本页。"
  >
    <div className="space-y-1 rounded-lg border border-[#CFFF4A]/30 bg-[#CFFF4A]/5 px-3 py-2 text-[12px] text-foreground">
      <div>
        本页 = 产品页 <code className="font-mono">/rewards</code> 的状态字典 ·
        样式与布局 → 生产页；状态与判定 → 本页；表里没有列出的组合视为不存在
      </div>
      <div>
        字段名 / 文案 / 公式 / 术语 → <code className="font-mono">docs/copy-dictionary.md</code>（顶部有 Lite 术语对照表）
      </div>
      <div>
        流程 / 口径 / 前后端分工 → <code className="font-mono">docs/delivery/lite-rewards-spec-v1.md</code>
      </div>
    </div>

    <RewardsStatesSection />

    <div className="rounded-md border border-trading-yellow/25 bg-trading-yellow/5 px-3 py-2 text-xs leading-5 text-trading-yellow">
      ⚠️ 以下为旧版节 —— 已被上方 RW 编号分区逐步接管，仅作并账基线保留，<strong>不可作为研发规格</strong>。已迁移的模块请看上方对应 RW 编号；本节将在 M3b 并账完成后整体删除。
    </div>
    {/* ── 以下为旧版节（并账后删除）── */}
    <RewardsSection isMobile={isMobile} />
    <RewardsMobileSection isMobile={isMobile} />
  </LitePage>
);
