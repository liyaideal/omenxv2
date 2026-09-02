import { LitePage } from "./shell";
import { VouchersStatesSection } from "../VouchersStatesSection";

type P = { isMobile: boolean };

export const LiteVouchersPage = (_props: P) => (
  <LitePage
    id="lite-vouchers"
    title="Vouchers"
    route="/rewards?tab=vouchers（/vouchers 重定向）"
    status="done"
    note="本页 = 产品页 /rewards?tab=vouchers 的状态字典 · 样式与布局看生产页，状态与判定看本页。"
  >
    <div className="space-y-1 rounded-lg border border-[#CFFF4A]/30 bg-[#CFFF4A]/5 px-3 py-2 text-[12px] text-foreground">
      <div>
        本页 = 产品页 <code className="font-mono">/rewards?tab=vouchers</code> 的状态字典 ·
        样式与布局 → 生产页；状态与判定 → 本页；表里没有列出的组合视为不存在
      </div>
      <div>
        字段名 / 文案 / 公式 / 术语 → <code className="font-mono">docs/copy-dictionary.md</code>（顶部有 Lite 术语对照表）
      </div>
      <div>
        流程 / 口径 / 前后端分工 → <code className="font-mono">docs/delivery/lite-vouchers-spec-v1.md</code>
      </div>
    </div>

    <VouchersStatesSection />
  </LitePage>
);
