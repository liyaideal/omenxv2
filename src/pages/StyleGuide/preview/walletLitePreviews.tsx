/**
 * Wallet Lite R1 previews — archive round (batches 1–3).
 *
 * Truth Rule (§16.1.1): every demo below mounts the PRODUCTION component with
 * fixture props — LiteAuthGate / AuthGateOverlay / AuthContent / HeroEquityCard /
 * SavedAddressRowView / SavedAddressActionsList / ProductLineBadge /
 * TransactionHistory. No hand-copied markup.
 *
 * Fixtures use relative dates (hoursAgo) so the docs never go stale.
 */
import { useState } from "react";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { LiteAuthGate } from "@/components/portfolio/lite/LiteAuthGate";
import { AuthContent } from "@/components/auth/AuthContent";
import { ProductLineBadge } from "@/lib/productLineBadge";
import {
  HeroEquityCard,
  SavedAddressRowView,
  SavedAddressActionsList,
  type SavedAddressView,
} from "@/pages/Wallet";
import {
  TransactionHistory,
  type Transaction,
  type TransactionType,
} from "@/components/wallet/TransactionHistory";
import type { AuthStep } from "@/hooks/useAuth";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

/* ---------------- 1 · Wallet auth gate (Lite vs Pro) ---------------- */

const GateUnderlay = () => (
  <div className="space-y-3 p-4">
    <div className="h-24 rounded-[18px] border border-border bg-card" />
    <div className="grid grid-cols-2 gap-3">
      <div className="h-28 rounded-xl border border-border bg-card" />
      <div className="h-28 rounded-xl border border-border bg-card" />
    </div>
  </div>
);

export const WalletGateLitePreview = () => (
  <LiteAuthGate
    forceSignedOut
    title="Sign in to view your wallet"
    description="Deposit, withdraw and move funds between your accounts by signing in."
  >
    <GateUnderlay />
  </LiteAuthGate>
);

export const WalletGateProPreview = () => (
  <AuthGateOverlay
    title="Sign in to view your wallet"
    description="Manage your funds and saved addresses by signing in."
  >
    <GateUnderlay />
  </AuthGateOverlay>
);

/* ---------------- 2 · Lite auth layer — three steps ---------------- */

const AuthShell = ({
  step,
  variant,
}: {
  step: AuthStep;
  variant: "desktop" | "mobile";
}) => {
  const [s, setS] = useState<AuthStep>(step);
  const [loading, setLoading] = useState(false);
  return (
    <div
      className={
        variant === "mobile"
          ? "mx-auto w-full max-w-[375px] rounded-t-3xl border border-border bg-background px-5 pt-4 pb-6"
          : "mx-auto w-full max-w-md rounded-xl border border-border/50 bg-background p-6"
      }
    >
      <AuthContent
        step={s}
        setStep={setS}
        isLoading={loading}
        setIsLoading={setLoading}
        variant={variant}
      />
    </div>
  );
};

export const AuthLiteLoginDesktopPreview = () => <AuthShell step="login" variant="desktop" />;
export const AuthLiteCreateWalletDesktopPreview = () => <AuthShell step="createWallet" variant="desktop" />;
export const AuthLiteCompleteProfileDesktopPreview = () => <AuthShell step="completeProfile" variant="desktop" />;
export const AuthLiteLoginMobilePreview = () => <AuthShell step="login" variant="mobile" />;
export const AuthLiteCreateWalletMobilePreview = () => <AuthShell step="createWallet" variant="mobile" />;
export const AuthLiteCompleteProfileMobilePreview = () => <AuthShell step="completeProfile" variant="mobile" />;

/* ---------------- 3 · Saved addresses ⋯ menu ---------------- */

const ADDR_DEFAULT: SavedAddressView = {
  id: "w1",
  label: "Main wallet",
  address: "0x8f2a91...c4d071",
  fullAddress: "0x8f2a91b3e4c7a0d5f6b8e9a1c2d3f4a5b6c4d071",
  isPrimary: true,
};

const ADDR_SECONDARY: SavedAddressView = {
  id: "w2",
  label: "Polygon wallet",
  address: "0x41c7de...9b3f02",
  fullAddress: "0x41c7de55a8b0f2e1c3d4a5b6c7d8e9f0a19b3f02",
  isPrimary: false,
};

const AddressCard = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-md trading-card p-4">
    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      Saved addresses
    </div>
    {children}
  </div>
);

const noop = () => undefined;

export const SavedAddressRowsDesktopPreview = () => (
  <AddressCard>
    <SavedAddressRowView
      wallet={ADDR_DEFAULT}
      isLast={false}
      isMobile={false}
      copied={false}
      onOpenActions={noop}
      onCopy={noop}
      onSetPrimary={noop}
      onDelete={noop}
    />
    <SavedAddressRowView
      wallet={ADDR_SECONDARY}
      isLast
      isMobile={false}
      copied
      onOpenActions={noop}
      onCopy={noop}
      onSetPrimary={noop}
      onDelete={noop}
    />
  </AddressCard>
);

export const SavedAddressRowsMobilePreview = () => (
  <AddressCard>
    <SavedAddressRowView
      wallet={ADDR_DEFAULT}
      isLast={false}
      isMobile
      copied={false}
      onOpenActions={noop}
      onCopy={noop}
      onSetPrimary={noop}
      onDelete={noop}
    />
    <SavedAddressRowView
      wallet={ADDR_SECONDARY}
      isLast
      isMobile
      copied={false}
      onOpenActions={noop}
      onCopy={noop}
      onSetPrimary={noop}
      onDelete={noop}
    />
  </AddressCard>
);

/** Drawer body as rendered inside MobileDrawer (shell = drawer chrome only). */
export const SavedAddressActionsDrawerPreview = () => (
  <div className="mx-auto max-w-[375px] rounded-t-3xl border border-border bg-card px-5 pt-4 pb-4">
    <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
    <SavedAddressActionsList wallet={ADDR_SECONDARY} onSetPrimary={noop} onCopy={noop} onDelete={noop} />
  </div>
);

export const SavedAddressActionsDrawerDefaultPreview = () => (
  <div className="mx-auto max-w-[375px] rounded-t-3xl border border-border bg-card px-5 pt-4 pb-4">
    <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
    <SavedAddressActionsList wallet={ADDR_DEFAULT} onSetPrimary={noop} onCopy={noop} onDelete={noop} />
  </div>
);

/* ---------------- 4 · Product-line badge ---------------- */

export const ProductLineBadgePairPreview = () => (
  <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/40 bg-muted/20 p-4">
    <div className="flex items-center gap-2">
      <ProductLineBadge line="spot" />
      <span className="text-xs text-muted-foreground">spot → Standard Account</span>
    </div>
    <div className="flex items-center gap-2">
      <ProductLineBadge line="futures" />
      <span className="text-xs text-muted-foreground">futures → Boost Account</span>
    </div>
    <span className="font-mono text-[10px] text-muted-foreground/70">src/lib/productLineBadge.tsx</span>
  </div>
);

/* ---------------- 5 · Transaction rows — full icon matrix ---------------- */

const mk = (
  id: string,
  type: TransactionType,
  amount: number,
  description: string,
  extra: Partial<Transaction> = {},
): Transaction => {
  const d = hoursAgo(Number(id.replace(/\D/g, "")) || 1);
  return {
    id,
    type,
    amount,
    description,
    date: d.toISOString(),
    timestamp: d.getTime(),
    status: "completed",
    ...extra,
  };
};

const ICON_MATRIX_TXS: Transaction[] = [
  mk("1", "deposit", 1000, "USDC deposit · Base", { network: "Base", account: "spot" }),
  mk("2", "withdraw", 200, "USDC withdraw · Base", { network: "Base", account: "futures", status: "processing" }),
  mk("3", "trade_profit", 42.18, "Settled: BTC ≥ $150k · Won", { account: "futures" }),
  mk("4", "trade_loss", 18.4, "Settled: Bitcoin · Up · Lost", { account: "futures" }),
  mk("5", "platform_credit", 25, "Platform credit", { account: "spot" }),
  mk("6", "bonus", 10, "Trial position voucher TPV-DEMO-S1", { account: "spot" }),
  mk("7", "fee", 1.25, "Trading fee", { account: "futures" }),
  mk("8", "transfer_to_futures", 500, "Transfer to Boost", { account: "spot" }),
  mk("9", "transfer_to_spot", 250, "Transfer from Boost", { account: "spot" }),
];

export const TxIconMatrixPreview = () => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <TransactionHistory transactions={ICON_MATRIX_TXS} />
  </div>
);

/* ---------------- 6 · HeroEquityCard equityNote ---------------- */

const HeroDemo = ({ note }: { note?: string }) => {
  const [hidden, setHidden] = useState(false);
  return (
    <HeroEquityCard
      equity={10_004.95}
      hidden={hidden}
      onToggleHidden={() => setHidden((h) => !h)}
      onDeposit={noop}
      onWithdraw={noop}
      onTransfer={noop}
      equityNote={note}
      compact
    />
  );
};

export const HeroEquityNoteLitePreview = () => <HeroDemo note="does not include open trade profit" />;
export const HeroEquityNoteProPreview = () => <HeroDemo />;
