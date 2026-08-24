import { LitePage } from "./shell";
import { Vouchers2Section } from "../Vouchers2Section";

type P = { isMobile: boolean };

export const LiteVouchersPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-vouchers"
    title="Vouchers"
    route="/rewards?tab=vouchers（/vouchers 重定向）"
    status="done"
    note="v2 已上线：入口并入 /rewards 第三个 tab，双收益模式（instant → 钱包 / tiered → pending 池）。本节只呈现现行事实，v1 留档块已删除（旧设计见 CD 存档与 git 历史）。"
  >
    <div className="space-y-12">
      <Vouchers2Section isMobile={isMobile} />
    </div>
  </LitePage>
);
