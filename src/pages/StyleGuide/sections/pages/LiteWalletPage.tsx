import { LitePage } from "./shell";
import { WalletSection } from "../WalletSection";
import { DepositWithdrawSection } from "../DepositWithdrawSection";

type P = { isMobile: boolean };

export const LiteWalletPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-wallet"
    title="Wallet"
    route="/wallet · /deposit · /withdraw · /wallet/recovery"
    status="done"
    note="Dual-account（Boost / Standard）余额与转账、交易历史，以及充值 / 提现动线。"
  >
    <WalletSection isMobile={isMobile} />
    <DepositWithdrawSection isMobile={isMobile} />
  </LitePage>
);
