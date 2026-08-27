import { LitePage } from "./shell";
import { WalletSection } from "../WalletSection";
import { DepositWithdrawSection } from "../DepositWithdrawSection";
import { WalletLiteR1Section } from "../WalletLiteR1Section";

type P = { isMobile: boolean };

export const LiteWalletPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-wallet"
    title="Wallet"
    route="/wallet · /deposit · /withdraw · /wallet/recovery"
    status="done"
    note="Dual-account（Boost / Standard）余额与转账、交易历史，以及充值 / 提现动线。"
  >
    <WalletLiteR1Section isMobile={isMobile} />
    <DepositWithdrawSection isMobile={isMobile} />
    <WalletSection isMobile={isMobile} />
  </LitePage>
);
