/**
 * Funding flows · style-guide previews (M7b · Ⓓ Ⓔ Ⓕ Ⓖ 全态).
 *
 * Truth Rule (§16.1.1): every demo below mounts the PRODUCTION component from
 * its real path with fixture props — no replica markup except the two clearly
 * captioned chrome shells (dialog frame / recovery cards).
 *
 * Determinism: no runtime fetch (fixture channels shipped in M7a-①), no
 * Math.random, fixed ids, and every date is a fixed offset — never a raw
 * wall-clock value whose rendered text changes between screenshots.
 */
import { useEffect, useState } from "react";
import { WalletDeposit } from "@/components/deposit/WalletDeposit";
import { WalletWithdraw } from "@/components/withdraw/WalletWithdraw";
import { WithdrawAddressSelect } from "@/components/withdraw/WithdrawAddressSelect";
import { WithdrawVerifyDialog } from "@/components/withdraw/WithdrawVerifyDialog";
import { WithdrawStatusTracker } from "@/components/withdraw/WithdrawStatusTracker";
import { AccountPicker, AccountPickerRows, type AccountKind } from "@/components/wallet/AccountPicker";
import { WithdrawSubmitProvider, useWithdrawSubmit } from "@/components/withdraw/WithdrawSubmitContext";
import { StickyWithdrawBar } from "@/components/withdraw/StickyWithdrawBar";
import { DeleteAddressDrawer } from "@/components/wallet/DeleteAddressDrawer";
import {
  MaintenanceNoticeBannerView,
  MAINTENANCE_NOTICE_DEMO_SETS,
} from "@/components/wallet/MaintenanceNoticeBanner";
import { RecoveryForm } from "@/components/recovery/RecoveryForm";
import {
  RecoveryStatusBadge,
  RecoveryStatusTimeline,
} from "@/components/recovery/RecoveryStatusTimeline";
import { AlertTriangle, ChevronRight, Inbox, Info, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import lynxEmptyRecovery from "@/assets/wallet/lynx-empty-recovery.png";
import type { Wallet as SavedWallet } from "@/hooks/useWallets";
import type { WithdrawRecord, WithdrawStatus } from "@/types/withdraw";
import type { TokenConfig } from "@/types/deposit";

/* ================= fixtures ================= */

/** Fixed demo deposit address — no get-deposit-address edge-function call. */
const FIXTURE_DEPOSIT_ADDRESS = "0x8f2a91b3e4c7a0d5f6b8e9a1c2d3f4a5b6c4d071";

export const FIXTURE_WALLETS: SavedWallet[] = [
  {
    id: "fx-base",
    label: "Main wallet",
    address: "0x8f2a91...c4d071",
    fullAddress: "0x8f2a91b3e4c7a0d5f6b8e9a1c2d3f4a5b6c4d071",
    network: "Base",
    walletType: "evm",
    icon: "/chain-logos/base.svg",
    isPrimary: true,
    connectedAt: "2026-08-01T12:00:00.000Z",
  },
  {
    id: "fx-tron",
    label: "Old Tron wallet",
    address: "TQmXk3...9b3f02",
    fullAddress: "TQmXk3ur7d2v6yLpEwq1sA9hZc4Rm8Nt9b3f02",
    network: "Tron",
    walletType: "tron",
    icon: "/chain-logos/tron.svg",
    isPrimary: false,
    connectedAt: "2026-07-04T12:00:00.000Z",
  },
];

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

const withdrawal = (status: WithdrawStatus, extra: Partial<WithdrawRecord> = {}): WithdrawRecord => ({
  id: "wd_demo_1",
  amount: 250,
  fee: 1,
  netAmount: 249,
  token: "USDC",
  toAddress: "0x8f2a91b3e4c7a0d5f6b8e9a1c2d3f4a5b6c4d071",
  status,
  createdAt: "2026-09-03T09:00:00.000Z",
  ...extra,
});

/* ---------- W-21 · /deposit step 0 — "Deposit to" pre-screen ---------- */

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

/* ---------- W-22 / W-23 · WalletDeposit · two branches ---------- */

export const DepositChecklistPreview = () => (
  <WalletDeposit demoAcknowledged={false} account="spot" fixtureAddress={FIXTURE_DEPOSIT_ADDRESS} />
);
export const DepositAddressPreview = () => (
  <WalletDeposit demoAcknowledged account="spot" fixtureAddress={FIXTURE_DEPOSIT_ADDRESS} />
);

/* ---------- W-25 · WalletWithdraw + sticky CTA ---------- */

export const WithdrawFormPreview = () => (
  <WithdrawSubmitProvider>
    <div className="-mx-4">
      <WalletWithdraw demoAvailableBalance={8720.42} fixtureWallets={FIXTURE_WALLETS} />
      <StickyWithdrawBar offsetBottomNav={false} />
    </div>
  </WithdrawSubmitProvider>
);

/* ---------- W-26 · Withdrawal-address drawer · list step + in-drawer add step ---------- */

const AddressDrawerDemo = ({
  startOnAdd,
  wallets = FIXTURE_WALLETS,
}: {
  startOnAdd?: boolean;
  wallets?: SavedWallet[];
}) => {
  const [selected, setSelected] = useState("");
  return (
    <div className="min-h-[420px]">
      <WithdrawAddressSelect
        open
        initialStep={startOnAdd ? "add" : "list"}
        onClose={() => {}}
        selectedAddress={selected}
        onSelectAddress={setSelected}
        fixtureWallets={wallets}
      />
    </div>
  );
};

export const WithdrawAddressDrawerPreview = () => (
  <div className="space-y-4">
    <AddressDrawerDemo />
    <div className="px-4 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
      空态（wallets.length === 0）
    </div>
    <AddressDrawerDemo wallets={[]} />
  </div>
);
export const WithdrawAddressAddStepPreview = () => <AddressDrawerDemo startOnAdd />;

/* ---------- W-27 · Withdraw verification · four modes ---------- */

const VerifyFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-[420px] [&_*]:!animate-none">{children}</div>
);

export const WithdrawVerifyPreview = () => (
  <VerifyFrame>
    <WithdrawVerifyDialog open onOpenChange={() => {}} onVerified={() => {}} fixtureMode="email_otp" />
  </VerifyFrame>
);

export const WithdrawVerifyBindEmailPreview = () => (
  <VerifyFrame>
    <WithdrawVerifyDialog open onOpenChange={() => {}} onVerified={() => {}} fixtureMode="bind_email" />
  </VerifyFrame>
);

export const WithdrawVerifyTotpPreview = () => (
  <VerifyFrame>
    <WithdrawVerifyDialog open onOpenChange={() => {}} onVerified={() => {}} fixtureMode="totp" />
  </VerifyFrame>
);

export const WithdrawVerifyBindTotpPreview = () => (
  <VerifyFrame>
    <WithdrawVerifyDialog
      open
      onOpenChange={() => {}}
      onVerified={() => {}}
      fixtureMode="bind_totp"
      demoSecret="OMENXDEMOSECRET234567"
    />
  </VerifyFrame>
);

/* ---------- W-28 · Withdraw status tracker · three frames ---------- */

export const WithdrawStatusPreview = () => (
  <div className="space-y-6 [&_*]:!animate-none">
    <WithdrawStatusTracker withdrawal={withdrawal("SENT")} token={DEMO_TOKEN} onDone={() => {}} />
    <WithdrawStatusTracker
      withdrawal={withdrawal("CONFIRMED", {
        txHash: "0x8f2a91b3e4c7a0d5f6b8e9a1c2d3f4a5b6c4d0719a8b7c6d5e4f3a2b1c0d9e8f",
      })}
      token={DEMO_TOKEN}
      onDone={() => {}}
    />
    <WithdrawStatusTracker
      withdrawal={withdrawal("FAILED", { failReason: "Chain transaction reverted" })}
      token={DEMO_TOKEN}
      onDone={() => {}}
    />
  </div>
);

/* ---------- W-29 · Sticky withdraw bar · three states ---------- */

const StickySetter = ({ disabled, loading }: { disabled: boolean; loading: boolean }) => {
  const ctx = useWithdrawSubmit();
  const setState = ctx?.setState;
  useEffect(() => {
    setState?.({ visible: true, disabled, loading, onSubmit: () => {} });
  }, [setState, disabled, loading]);
  return null;
};

const StickyCase = ({ title, disabled, loading }: { title: string; disabled: boolean; loading: boolean }) => (
  <div className="space-y-1">
    <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{title}</div>
    <WithdrawSubmitProvider>
      <StickySetter disabled={disabled} loading={loading} />
      <StickyWithdrawBar offsetBottomNav={false} />
    </WithdrawSubmitProvider>
  </div>
);

export const StickyWithdrawBarPreview = () => (
  <div className="space-y-4 p-4 [&_*]:!animate-none">
    <StickyCase title="disabled（未通过校验）" disabled loading={false} />
    <StickyCase title="可提交" disabled={false} loading={false} />
    <StickyCase title="提交中（Processing...）" disabled loading />
  </div>
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

/* ================= Ⓖ Recovery 与服务件 ================= */

/**
 * Recovery intro / list / detail cards live inline inside the route files
 * (src/pages/RecoveryRequest.tsx, RecoveryRequestDetail.tsx) and are not
 * exported. The chrome below is a captioned replica whose copy is transcribed
 * verbatim; every status element (badge / timeline) and the form itself are
 * the production components.
 */

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
    {children}
  </span>
);

const RecoveryIntroCard = () => (
  <div className="rounded-xl border border-border/60 bg-muted/30 p-5 space-y-3">
    <div className="flex items-start gap-3">
      <Info className="w-5 h-5 text-trading-yellow shrink-0 mt-0.5" />
      <div className="space-y-2 flex-1">
        <div className="font-semibold text-foreground">Wrong-chain recovery service</div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We can attempt to retrieve funds sent to the wrong network or with the wrong token. A flat{" "}
          <span className="text-trading-yellow font-medium">10% recovery fee</span> applies (covers
          source-chain gas, bridge cost, and manual processing).
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We cannot recover funds sent to chains we do not operate on. You'll be notified once funds are
          credited or if recovery is not possible.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Pill>10% flat fee</Pill>
          <Pill>3–7 business days</Pill>
        </div>
      </div>
    </div>
  </div>
);

/** W-30 · intro card（chrome 复刻，文案与生产一致）+ 生产 RecoveryForm + Sign in required 态 */
export const RecoveryIntroPreview = () => (
  <div className="space-y-6 p-4">
    <RecoveryIntroCard />
    <div>
      <h2 className="text-base font-semibold mb-3">New recovery request</h2>
      <RecoveryForm />
    </div>
    <div className="rounded-xl border border-border/60 bg-card/40 p-6 text-center">
      <div className="space-y-3 max-w-sm mx-auto">
        <AlertTriangle className="w-10 h-10 text-trading-yellow mx-auto" />
        <h2 className="text-lg font-semibold">Sign in required</h2>
        <p className="text-sm text-muted-foreground">
          Please sign in to submit or view your recovery requests.
        </p>
      </div>
    </div>
  </div>
);

const RECOVERY_ROWS = [
  { id: "rq-1", amount: 120, token: "USDT", network: "BNB Smart Chain (BEP20)", status: "submitted" as const, date: "Aug 22, 2026" },
  { id: "rq-2", amount: 340, token: "USDC", network: "Polygon", status: "completed" as const, date: "Aug 14, 2026" },
  { id: "rq-3", amount: 76, token: "SOL", network: "Solana", status: "rejected" as const, date: "Aug 09, 2026" },
];

/** W-31 · list（chrome 复刻；RecoveryEmptyState / RecoveryStatusBadge 为生产件）· loading / empty / rows */
export const RecoveryListPreview = () => (
  <div className="space-y-6 p-4 [&_*]:!animate-none">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Your requests</h2>
        <Button size="sm" className="h-9 rounded-lg">
          <Plus className="w-3.5 h-3.5 mr-1" />
          New request
        </Button>
      </div>
      <div className="py-10 text-center">
        <Loader2 className="w-5 h-5 mx-auto text-muted-foreground" />
      </div>
    </div>

    <div className="rounded-xl border border-border/60 bg-card/40 p-10 text-center space-y-2">
      <Inbox className="w-8 h-8 text-muted-foreground/60 mx-auto" />
      <img
        src={lynxEmptyRecovery}
        alt=""
        aria-hidden
        draggable={false}
        className="mx-auto w-24 h-24 object-contain pointer-events-none select-none"
      />
      <div className="text-sm font-medium">No recovery requests yet</div>
      <div className="text-xs text-muted-foreground">
        Submit a request if a deposit was sent to the wrong network.
      </div>
    </div>

    <div className="space-y-2">
      {RECOVERY_ROWS.map((r) => (
        <div
          key={r.id}
          className="w-full text-left rounded-xl border bg-card p-4 flex items-center justify-between gap-3"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">${r.amount.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">
                {r.token} on {r.network}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RecoveryStatusBadge status={r.status} />
              <span className="text-[11px] text-muted-foreground">{r.date}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

/* ---------- W-32 · Recovery detail · three states ---------- */

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono">{value}</span>
  </div>
);

const RecoveryDetail = ({
  status,
  amount,
  adminNote,
  processedRef,
}: {
  status: "submitted" | "completed" | "rejected";
  amount: number;
  adminNote?: string;
  processedRef?: string;
}) => {
  const fee = (amount * 10) / 100;
  const net = amount - fee;
  return (
    <div className="space-y-5 p-4 [&_*]:!animate-none">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Status</h2>
          <RecoveryStatusBadge status={status} />
        </div>
        <RecoveryStatusTimeline status={status} />
        {status === "submitted" && (
          <p className="text-xs text-muted-foreground">
            Our team is reviewing and attempting recovery. This typically takes 3–7 business days.
          </p>
        )}
      </div>

      {status !== "rejected" && (
        <div
          className={`rounded-xl border ${
            status === "completed" ? "border-trading-green/30 bg-trading-green/5" : "border-border bg-muted/30"
          } p-6 space-y-2`}
        >
          <div className="text-sm font-semibold">
            {status === "completed" ? "Funds credited" : "Estimated payout"}
          </div>
          <div className="space-y-1.5 text-sm">
            <DetailRow label="Amount sent" value={`$${amount.toFixed(2)}`} />
            <DetailRow label="Recovery fee (10%)" value={`-$${fee.toFixed(2)}`} />
            <div className="border-t pt-2 flex items-center justify-between">
              <span className="font-medium">
                {status === "completed" ? "Credited to balance" : "You will receive"}
              </span>
              <span
                className={`font-mono font-semibold ${
                  status === "completed" ? "text-trading-green" : "text-primary"
                }`}
              >
                {status === "completed" ? "+" : ""}${net.toFixed(2)}
              </span>
            </div>
          </div>
          {processedRef && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-trading-green/20">
              <span className="text-muted-foreground">Internal ref</span>
              <span className="font-mono">{processedRef}</span>
            </div>
          )}
        </div>
      )}

      {adminNote && (
        <div className="rounded-xl border bg-card p-6 space-y-1.5">
          <h2 className="text-base font-semibold">Message from OmenX</h2>
          <p className="text-sm text-muted-foreground">{adminNote}</p>
        </div>
      )}
    </div>
  );
};

export const RecoveryDetailSubmittedPreview = () => <RecoveryDetail status="submitted" amount={120} />;
export const RecoveryDetailCompletedPreview = () => (
  <RecoveryDetail
    status="completed"
    amount={120}
    adminNote="Funds recovered and credited."
    processedRef="0xdemo…recov1"
  />
);
export const RecoveryDetailRejectedPreview = () => (
  <RecoveryDetail
    status="rejected"
    amount={76}
    adminNote="Unsupported asset — recovery not possible."
  />
);

/* ---------- W-33 · Maintenance notice · four presets ---------- */

export const MaintenanceNoticePreview = () => (
  <div className="space-y-5 p-4">
    {(["single", "multiple", "withNote"] as const).map((preset) => (
      <div key={preset} className="space-y-1">
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{preset}</div>
        <MaintenanceNoticeBannerView notices={MAINTENANCE_NOTICE_DEMO_SETS[preset]} />
      </div>
    ))}
    <div className="space-y-1">
      <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">empty (hidden)</div>
      <div className="rounded-lg border border-dashed border-border/50 p-3 text-xs text-muted-foreground">
        No active notices → banner hidden. /wallet renders nothing in this slot.
      </div>
    </div>
  </div>
);
