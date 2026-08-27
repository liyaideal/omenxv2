import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { SectionWrapper, SubSection, LegacyNotice } from "../components/SectionWrapper";
import { CodePreview } from "../components/CodePreview";
import { cn } from "@/lib/utils";
import { RecoveryStatusTimeline, RecoveryStatusBadge } from "@/components/recovery/RecoveryStatusTimeline";
import { WithdrawVerifyDialog } from "@/components/withdraw/WithdrawVerifyDialog";
import { DeviceFrame } from "../components/DeviceFrame";

interface DepositWithdrawSectionProps {
  isMobile: boolean;
}


const FUNDING_DEMOS: { key: string; title: string; caption: string; minHeight?: number }[] = [
  { key: "wallet-deposit-to-screen", title: "Deposit · step 0 “Deposit to”", caption: "Production mount: src/pages/Deposit.tsx pre-screen (AccountPickerRows).", minHeight: 260 },
  { key: "wallet-deposit-checklist", title: "Deposit · address tab, unacknowledged", caption: "Production mount: WalletDeposit inside /deposit → Address tab (3-item safety checklist).", minHeight: 420 },
  { key: "wallet-deposit-address", title: "Deposit · address tab, acknowledged", caption: "Production mount: WalletDeposit — QR, §6 ColoredAddress, info rows. No sticky CTA (display page).", minHeight: 620 },
  { key: "wallet-withdraw-form", title: "Withdraw · form + sticky CTA", caption: "Production mount: WalletWithdraw inside /withdraw; the CTA is rendered by the route’s sticky bar.", minHeight: 720 },
  { key: "wallet-withdraw-address-drawer", title: "Withdraw · address drawer (list step)", caption: "Production mount: WithdrawAddressSelect from WalletWithdraw “Withdrawal Address”.", minHeight: 460 },
  { key: "wallet-withdraw-address-add", title: "Withdraw · address drawer (add step)", caption: "Same drawer, step “add” — AddAddressFields shared with the desktop AddAddressDialog.", minHeight: 460 },
  { key: "wallet-withdraw-verify", title: "Withdraw · verification drawer", caption: "Production mount: WithdrawVerifyDialog mobile branch, email OTP step. Demo code 111111.", minHeight: 460 },
  { key: "wallet-withdraw-status", title: "Withdraw · status tracker (REQUESTED)", caption: "Production mount: WithdrawStatusTracker after a submitted withdrawal.", minHeight: 420 },
  { key: "wallet-account-picker", title: "Account picker drawer", caption: "Production mount: AccountPicker mobile branch (/withdraw “From account”, /deposit “To”).", minHeight: 340 },
  { key: "wallet-address-delete", title: "Delete address confirm drawer", caption: "Production mount: /wallet saved addresses → delete (MobileDrawerStatus + MobileDrawerActions).", minHeight: 380 },
];

export const DepositWithdrawSection = ({ isMobile }: DepositWithdrawSectionProps) => {
  const [verifyOpen, setVerifyOpen] = useState(false);

  return (
  <SectionWrapper
    id="deposit-withdraw"
    title="Deposit & Withdraw"
    description="Design system for all deposit, withdrawal, and cross-chain bridging components. Consistent typography, chain logos, and layout patterns."
  >
    {/* ── Chain & Token Logos ── */}

    {/* ── Typography Standards ── */}
    <SubSection title="Typography Standards" description="Consistent font sizing across all deposit/withdraw flows.">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Element</span>
              <span className="text-sm text-muted-foreground">Spec</span>
            </div>
            {[
              ["Section title (Swap, Confirm)", "text-base font-semibold (16px)"],
              ["Card label (From / To)", "text-sm text-muted-foreground (14px)"],
              ["Amount input", "text-2xl font-mono (24px)"],
              ["Token selector text", "text-sm font-medium (14px)"],
              ["Chain name in selector", "text-xs text-muted-foreground (12px)"],
              ["Quote detail label", "text-xs text-muted-foreground (12px)"],
              ["Quote detail value", "text-xs font-mono (12px)"],
              ["Review detail label", "text-sm text-muted-foreground (14px)"],
              ["Review detail value", "text-sm font-mono (14px)"],
              ["CTA button", "text-sm font-semibold (14px)"],
              ["Powered by footer", "text-[10px] text-muted-foreground"],
              ["Balance display", "text-xs font-mono"],
              ["Wallet address", "text-xs font-mono"],
              ["Status step label", "text-sm (14px)"],
              ["Result amount", "text-3xl font-mono font-bold"],
            ].map(([el, spec]) => (
              <div key={el} className="flex items-start justify-between py-1.5 gap-4">
                <span className="text-sm">{el}</span>
                <code className="text-xs text-primary font-mono text-right whitespace-nowrap">{spec}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CodePreview code={`// Amount input — always text-2xl font-mono
<Input className="text-2xl font-mono bg-transparent border-none" />

// Quote row — xs for inline, sm for review
<div className="flex justify-between text-xs text-muted-foreground">
  <span>Rate</span>
  <span className="font-mono">1 ETH = 3500.00 USDC</span>
</div>`} />
    </SubSection>

    {/* ── Swap Card Layout ── */}

    {/* ── Quote Details ── */}

    {/* ── Status Flow ── */}

    {/* ── Powered By Footer ── */}

    {/* ── Recovery Request Status ── */}
    <SubSection
      title="Recovery Request Status"
      description="Wrong-network recovery uses a streamlined 3-state machine: Submitted → Completed, or Rejected. A flat 10% fee is applied, no quote/accept step. Used in /wallet/recovery and its detail page."
    >
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Status Badges (list rows)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <RecoveryStatusBadge status="submitted" />
            <RecoveryStatusBadge status="completed" />
            <RecoveryStatusBadge status="rejected" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Timeline — Submitted (processing)</CardTitle>
          </CardHeader>
          <CardContent>
            <RecoveryStatusTimeline status="submitted" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Timeline — Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <RecoveryStatusTimeline status="completed" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Timeline — Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <RecoveryStatusTimeline status="rejected" />
          </CardContent>
        </Card>
      </div>

      <CodePreview code={`import { RecoveryStatusTimeline, RecoveryStatusBadge } from '@/components/recovery/RecoveryStatusTimeline';

<RecoveryStatusBadge status="submitted" />
<RecoveryStatusTimeline status="completed" />
// status: 'submitted' | 'completed' | 'rejected'`} />
    </SubSection>

    {/* ── Funding flows · mobile (2026-08-17) ── */}
    <SubSection
      title="Funding flows — mobile (375 iframe, production components)"
      description="/deposit and /withdraw are full-screen flows (DESIGN.md §5): MobileHeader variant B + sticky bottom CTA on withdraw. Inside them every picker/confirm is a MobileDrawer, and a drawer never opens another drawer — the add-address step replaces the content of the same drawer."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {FUNDING_DEMOS.map((d) => (
          <div key={d.key} className="space-y-2">
            <div>
              <div className="text-sm font-medium">{d.title}</div>
              <p className="text-[11px] text-muted-foreground">{d.caption}</p>
            </div>
            <DeviceFrame previewKey={d.key} device="mobile" minHeight={d.minHeight ?? 320} />
          </div>
        ))}
      </div>
    </SubSection>

    {/* ── Withdraw Verification ── */}
    <SubSection
      title="Withdraw Verification"
      description="Live verification dialog used by /wallet/withdraw. Step queue is derived from profile.withdraw_2fa_mode + bound state. Demo accepts code 111111 for both email OTP and TOTP."
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Launch verify dialog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Opens the same multi-step dialog rendered before a real withdrawal. Steps reflect your
            current Settings (withdrawal verification mode) and whether email / authenticator are bound.
            Switch modes in <span className="font-medium">Settings → Withdrawal verification</span> to see different flows.
          </p>
          <Button onClick={() => setVerifyOpen(true)}>Open verify dialog</Button>
        </CardContent>
      </Card>

      <WithdrawVerifyDialog
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        onVerified={() => Promise.resolve()}
      />

      <CodePreview code={`import { WithdrawVerifyDialog } from '@/components/withdraw/WithdrawVerifyDialog';

<WithdrawVerifyDialog
  open={open}
  onOpenChange={setOpen}
  onVerified={() => submitWithdrawal(...)}
/>
// Steps auto-derived from profile.withdraw_2fa_mode:
//   'email' → email OTP (or Bind email if profile.email empty)
//   'totp'  → TOTP    (or Bind authenticator if !totp_enabled)
//   'both'  → both, in sequence`} />
    </SubSection>
  </SectionWrapper>
  );
};
