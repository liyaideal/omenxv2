import { LitePage } from "./shell";
import { WalletSection } from "../WalletSection";
import { DepositWithdrawSection } from "../DepositWithdrawSection";
import { WalletStatesSection } from "../WalletStatesSection";

type P = { isMobile: boolean };

const LegacyWarning = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="rounded-lg border border-trading-yellow/40 bg-trading-yellow/10 px-3 py-2 text-[12px] text-trading-yellow">
      旧版节 —— 已并入上方 Wallet 状态字典，M7b 删除。请勿在此新增 case。
    </div>
    {children}
  </div>
);

export const LiteWalletPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-wallet"
    title="Wallet"
    route="/wallet · /deposit · /withdraw · /wallet/recovery"
    status="done"
    note="Dual-account（Boost / Standard）余额与转账、交易历史，以及充值 / 提现动线。"
  >
    <WalletStatesSection isMobile={isMobile} />

    <div className="my-6 text-center text-[12px] text-muted-foreground">
      ── 以下为旧版节（并账后删除）──
    </div>

    <LegacyWarning>
      <DepositWithdrawSection isMobile={isMobile} />
    </LegacyWarning>
    <LegacyWarning>
      <WalletSection isMobile={isMobile} />
    </LegacyWarning>
  </LitePage>
);
