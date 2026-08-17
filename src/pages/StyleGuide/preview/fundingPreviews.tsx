/**
 * Funding flows · 375 iframe previews (2026-08-17 mobile overlay hygiene round).
 *
 * Truth Rule (§16.1.1): every demo below mounts the PRODUCTION component from
 * its real path with mock props — no replica markup. Production mount points
 * are named in each style-guide caption.
 */
import { useState } from "react";
import { WalletDeposit } from "@/components/deposit/WalletDeposit";
import { WalletWithdraw } from "@/components/withdraw/WalletWithdraw";
import { WithdrawAddressSelect } from "@/components/withdraw/WithdrawAddressSelect";
import { WithdrawVerifyDialog } from "@/components/withdraw/WithdrawVerifyDialog";
import { WithdrawStatusTracker } from "@/components/withdraw/WithdrawStatusTracker";
import { AccountPicker, AccountPickerRows, type AccountKind } from "@/components/wallet/AccountPicker";
import { WithdrawSubmitProvider } from "@/components/withdraw/WithdrawSubmitContext";
import { StickyWithdrawBar } from "@/components/withdraw/StickyWithdrawBar";
import { DeleteAddressDrawer } from "@/components/wallet/DeleteAddressDrawer";
import type { WithdrawRecord } from "@/types/withdraw";
import type { TokenConfig } from "@/types/deposit";

/* ---------- /deposit step 0 — "Deposit to" pre-screen ---------- */

export const DepositToScreenPreview = () => {
  const [account, setAccount] = useState<AccountKind | null>(null);
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-1">Deposit to</h3>
        <p className="text-xs text-muted-foreground">
          Pick which account will receive your funds. You can change this later.
        </p>
      </div>
      <AccountPickerRows selected={account} onSelect={setAccount} />
    </div>
  );
};

/* ---------- WalletDeposit · two branches ---------- */

export const DepositChecklistPreview = () => <WalletDeposit demoAcknowledged={false} account="spot" />;
export const DepositAddressPreview = () => <WalletDeposit demoAcknowledged account="spot" />;

/* ---------- WalletWithdraw + sticky CTA ---------- */

export const WithdrawFormPreview = () => (
  <WithdrawSubmitProvider>
    <div className="-mx-4">
      <WalletWithdraw demoAvailableBalance={8720.42} />
      <StickyWithdrawBar offsetBottomNav={false} />
    </div>
  </WithdrawSubmitProvider>
);

/* ---------- Withdrawal-address drawer · list step + in-drawer add step ---------- */

const AddressDrawerDemo = ({ startOnAdd }: { startOnAdd?: boolean }) => {
  const [selected, setSelected] = useState("");
  return (
    <div className="min-h-[420px]">
      <WithdrawAddressSelect
        open
        initialStep={startOnAdd ? "add" : "list"}
        onClose={() => {}}
        selectedAddress={selected}
        onSelectAddress={setSelected}
      />
    </div>
  );
};

export const WithdrawAddressDrawerPreview = () => <AddressDrawerDemo />;
export const WithdrawAddressAddStepPreview = () => <AddressDrawerDemo startOnAdd />;

/* ---------- Withdraw verification (mobile drawer branch, email OTP step) ---------- */

export const WithdrawVerifyPreview = () => (
  <div className="min-h-[420px]">
    <WithdrawVerifyDialog open onOpenChange={() => {}} onVerified={() => {}} />
  </div>
);

/* ---------- Withdraw status tracker · REQUESTED ---------- */

const DEMO_TOKEN: TokenConfig = {
  symbol: "USDC",
  name: "USD Coin",
  icon: "💲",
  network: "Base",
  chainId: 8453,
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  decimals: 6,
  minAmount: 10,
  confirmationBlocks: 12,
  estimatedTime: "< 2 minutes",
  fee: 0,
} as TokenConfig;

const DEMO_WITHDRAWAL: WithdrawRecord = {
  id: "wd_demo_1",
  amount: 250,
  fee: 1,
  netAmount: 249,
  token: "USDC",
  toAddress: "0x1234ab56cd78ef90ab12cd34ef56ab78cd345678",
  status: "REQUESTED",
  createdAt: new Date().toISOString(),
};

export const WithdrawStatusPreview = () => (
  <WithdrawStatusTracker withdrawal={DEMO_WITHDRAWAL} token={DEMO_TOKEN} onDone={() => {}} />
);

/* ---------- Account picker drawer ---------- */

export const AccountPickerDrawerPreview = () => {
  const [selected, setSelected] = useState<AccountKind>("futures");
  return (
    <div className="min-h-[320px]">
      <AccountPicker
        open
        onOpenChange={() => {}}
        selected={selected}
        onSelect={setSelected}
        title="From account"
      />
    </div>
  );
};

/* ---------- Delete-address confirm drawer (mirrors /wallet) ---------- */

export const AddressDeleteDrawerPreview = () => (
  <div className="min-h-[360px]">
    <DeleteAddressDrawer open onOpenChange={() => {}} label="Cold Wallet" onConfirm={() => {}} />
  </div>
);
