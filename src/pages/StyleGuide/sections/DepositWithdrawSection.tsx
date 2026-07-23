import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { CodePreview } from "../components/CodePreview";
import { cn } from "@/lib/utils";
import { RecoveryStatusTimeline, RecoveryStatusBadge } from "@/components/recovery/RecoveryStatusTimeline";
import { WithdrawVerifyDialog } from "@/components/withdraw/WithdrawVerifyDialog";

interface DepositWithdrawSectionProps {
  isMobile: boolean;
}

const CHAIN_LOGOS = [
  { name: "Ethereum", src: "/chain-logos/ethereum.svg" },
  { name: "Arbitrum", src: "/chain-logos/arbitrum.svg" },
  { name: "BNB Chain", src: "/chain-logos/bnb.svg" },
  { name: "Polygon", src: "/chain-logos/polygon.svg" },
  { name: "Base", src: "/chain-logos/base.svg" },
  { name: "Solana", src: "/chain-logos/solana.svg" },
  { name: "Bitcoin", src: "/chain-logos/bitcoin.svg" },
  { name: "Avalanche", src: "/chain-logos/avalanche.svg" },
  { name: "Tron", src: "/chain-logos/tron.svg" },
];

const TOKEN_LOGOS = [
  { name: "USDC", src: "/token-logos/usdc.svg" },
  { name: "USDT", src: "/token-logos/usdt.svg" },
];

const BRAND_LOGOS = [
  { name: "Banxa", src: "/brand-logos/banxa.png" },
  { name: "SOCKET", src: "" },
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
    <SubSection title="Chain & Token Logos" description="Always use official SVG logos from /chain-logos/ and /token-logos/. Never use emoji, text, or generic icons.">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Chain Logos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {CHAIN_LOGOS.map(c => (
                <div key={c.name} className="flex flex-col items-center gap-1.5">
                  <img src={c.src} alt={c.name} className="w-8 h-8" />
                  <span className="text-[10px] text-muted-foreground">{c.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Token Logos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {TOKEN_LOGOS.map(t => (
                <div key={t.name} className="flex flex-col items-center gap-1.5">
                  <img src={t.src} alt={t.name} className="w-8 h-8" />
                  <span className="text-[10px] text-muted-foreground">{t.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Native chain tokens (ETH, BNB, MATIC) reuse their chain logo.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Brand / Partner Logos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <img src="/brand-logos/banxa.png" alt="Banxa" className="h-6 object-contain" />
              <span className="text-[10px] text-muted-foreground">Banxa (Fiat Ramp)</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-semibold text-sm">SOCKET</span>
              <span className="text-[10px] text-muted-foreground">Cross-Chain Bridge</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CodePreview code={`// Usage
<img src="/chain-logos/base.svg" alt="Base" className="w-5 h-5" />
<img src="/token-logos/usdc.svg" alt="USDC" className="w-5 h-5" />
<img src="/brand-logos/banxa.png" alt="Banxa" className="h-5 object-contain" />

// WRONG — never do this:
<div className="bg-[#0052FF]"><span>B</span></div>`} />
    </SubSection>

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
    <SubSection title="Swap Card Pattern" description="The From → To card with arrow divider. Used in both Cross-Chain Deposit and Withdraw.">
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm mx-auto space-y-0">
            {/* From */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-xs text-muted-foreground">
                  Bal: <span className="font-mono">2,450.80</span>
                  <span className="ml-1 text-primary font-medium">MAX</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex-1 text-2xl font-mono font-semibold text-muted-foreground/50">0.00</span>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border/50">
                  <img src="/chain-logos/ethereum.svg" alt="Ethereum" className="w-5 h-5" />
                  <span className="font-medium text-sm">USDC</span>
                  <span className="text-xs text-muted-foreground">Ethereum</span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center -my-2 relative z-10">
              <div className="w-9 h-9 rounded-lg bg-card border border-border/50 flex items-center justify-center shadow-sm">
                <ArrowDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* To */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">To</span>
                <span className="text-xs text-muted-foreground">OmenX Wallet</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex-1 text-2xl font-mono font-semibold text-muted-foreground/50">0.00</span>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border/50">
                  <img src="/chain-logos/base.svg" alt="Base" className="w-5 h-5" />
                  <span className="font-medium text-sm">USDC</span>
                  <span className="text-xs text-muted-foreground">Base</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SubSection>

    {/* ── Quote Details ── */}
    <SubSection title="Quote Details Row" description="Inline quote rows below the swap card. Use text-xs for inline and text-sm in the review page.">
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm mx-auto space-y-2">
            {[
              { label: "Rate", value: "1 ETH = 3,500.00 USDC" },
              { label: "Bridge Fee", value: "Free", green: true },
              { label: "Est. Gas", value: "~$0.50" },
              { label: "Slippage", value: "~0.5% ~ Suggested" },
              { label: "Est. Time", value: "~2 min" },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-xs text-muted-foreground">
                <span>{row.label}</span>
                <span className={cn("font-mono", row.green && "text-trading-green")}>{row.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SubSection>

    {/* ── Status Flow ── */}
    <SubSection title="Status Flow" description="Processing → Result. Step indicators use consistent sizing.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Sign", desc: "Waiting for wallet signature", badge: "Pending" },
          { label: "Processing", desc: "3-stage progress with timeline", badge: "In Progress" },
          { label: "Result", desc: "Success or failure with amount", badge: "Complete" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center space-y-2">
              <Badge variant="secondary" className="text-[10px]">{s.badge}</Badge>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SubSection>

    {/* ── Powered By Footer ── */}
    <SubSection title="Powered By Footer" description="Attribution line at the bottom of cross-chain and fiat components.">
      <Card>
        <CardContent className="pt-6 flex items-center gap-8">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">
              Powered by <span className="font-semibold">SOCKET</span>
            </p>
            <span className="text-[10px] text-muted-foreground/50 block mt-1">Cross-Chain</span>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">
              Powered by <span className="font-semibold">Banxa</span> · Min. $10
            </p>
            <span className="text-[10px] text-muted-foreground/50 block mt-1">Fiat On-Ramp</span>
          </div>
        </CardContent>
      </Card>

      <CodePreview code={`<p className="text-[10px] text-center text-muted-foreground">
  Powered by <span className="font-semibold">SOCKET</span>
</p>`} />
    </SubSection>

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
