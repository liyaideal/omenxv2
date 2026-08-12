/**
 * Voucher preview cases mounted inside <DeviceFrame> iframes so `md:` breakpoints
 * resolve against the 375px mobile viewport.
 *
 * Real production components used directly (with mock props):
 *  - VoucherCard              → src/components/vouchers/VoucherCard.tsx
 *  - VoucherEarningsCard      → src/components/vouchers/VoucherEarningsCard.tsx
 *  - CloseVoucherContent      → src/components/positions/CloseVoucherContent.tsx
 *  - VoucherBannerView        → src/components/vouchers/VoucherBanner.tsx
 *  - EventPickerCard / PickerOptionRow / PickerBlockedReason
 *                             → src/components/vouchers/EventPickerCard.tsx
 *  - RedeemSummaryBar         → src/components/vouchers/RedeemSummaryBar.tsx
 *
 * The following demos stay as style-guide-internal mirrors because production has
 * no independent, prop-driven component to import:
 *  - Position chip     (no production surface renders it today — pending CPO
 *                       ruling on whether to keep or delete the demo)
 * Each mirror must be kept 1:1 in sync with its production source.
 */

import { useState } from "react";
import {
  Ticket,
  Lock,
  Clock,
  Loader2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoucherCard } from "@/components/vouchers/VoucherCard";
import { VoucherEarningsCard } from "@/components/vouchers/VoucherEarningsCard";
import { CloseVoucherContent } from "@/components/positions/CloseVoucherContent";
import { VoucherBannerView } from "@/components/vouchers/VoucherBanner";
import {
  EventPickerCard,
  PickerOptionRow,
  PickerBlockedReason,
} from "@/components/vouchers/EventPickerCard";
import { RedeemSummaryBar } from "@/components/vouchers/RedeemSummaryBar";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PositionVoucher } from "@/hooks/usePositionVouchers";

/* ---------------- shared bits ---------------- */

const baseVoucher = (overrides: Partial<PositionVoucher> = {}): PositionVoucher => ({
  id: "v-mock",
  code: "ABCD1201",
  faceValue: 25,
  redeemableCapPct: 1,
  maxHoldingHours: 72,
  entryPriceMin: 0.2,
  entryPriceMax: 0.8,
  minHoursToSettlement: 6,
  status: "claimed",
  payoutMode: "tiered",
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
  claimedAt: new Date().toISOString(),
  redeemedAt: null,
  redeemedAirdropPositionId: null,
  redeemedEventId: null,
  redeemedOptionId: null,
  redeemedSide: null,
  redeemedAirdropStatus: null,
  redeemedEventName: null,
  redeemedOutcomeLabel: null,
  redeemedSettledPnl: null,
  redeemedCloseReason: null,
  ...overrides,
});

const PresetRail = ({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: any) => void;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange(o.id)}
        className={`h-7 px-2.5 rounded-full text-[11px] border transition ${
          value === o.id
            ? "bg-primary/15 border-primary/40 text-primary"
            : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Frame = ({ children, label }: { children: React.ReactNode; label?: string }) => (
  <div className="space-y-2">
    {label && <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>}
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">{children}</div>
  </div>
);

/* ---------------- 1. Banner (real component) ---------------- */

type BannerState = "hidden" | "grantedOnly" | "grantedAndClaimed" | "claimedOnly";

export const BannerPreview = () => {
  const [state, setState] = useState<BannerState>("grantedOnly");

  const grantedCount = state === "grantedOnly" ? 2 : state === "grantedAndClaimed" ? 1 : 0;
  const claimedCount = state === "claimedOnly" ? 3 : state === "grantedAndClaimed" ? 2 : 0;

  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "hidden", label: "Hidden (0 vouchers)" },
          { id: "grantedOnly", label: "Granted only" },
          { id: "grantedAndClaimed", label: "Granted + claimed" },
          { id: "claimedOnly", label: "Claimed only" },
        ]}
      />
      <Frame>
        {state === "hidden" && (
          <div className="text-xs text-muted-foreground italic">
            Banner returns null when the user has zero granted and zero claimed vouchers.
          </div>
        )}
        <VoucherBannerView grantedCount={grantedCount} claimedCount={claimedCount} />
      </Frame>
    </div>
  );
};

/* ---------------- 3. VoucherCard (real component) ---------------- */

type CardState =
  | "grantedComfortable"
  | "grantedWarning"
  | "grantedUrgent"
  | "grantedSoldOut"
  | "grantedClaiming"
  | "claimedUnselected"
  | "claimedSelected"
  | "claimedUrgent";

const POOL_PRESETS: Record<string, { remaining: number; total: number } | null> = {
  grantedComfortable: { remaining: 653, total: 1000 },
  grantedWarning: { remaining: 340, total: 1000 },
  grantedUrgent: { remaining: 87, total: 1000 },
  grantedSoldOut: { remaining: 0, total: 1000 },
  grantedClaiming: { remaining: 653, total: 1000 },
};

export const VoucherCardPreview = () => {
  const [state, setState] = useState<CardState>("grantedComfortable");

  const voucher: PositionVoucher = (() => {
    if (state.startsWith("granted")) {
      return baseVoucher({
        status: "granted",
        claimedAt: null,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      });
    }
    if (state === "claimedUrgent") {
      return baseVoucher({
        status: "claimed",
        expiresAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      });
    }
    return baseVoucher({
      status: "claimed",
      expiresAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    });
  })();

  const poolPreset = POOL_PRESETS[state];
  const poolOverride = poolPreset
    ? {
        faceValue: 25,
        totalQuota: poolPreset.total,
        claimedCount: poolPreset.total - poolPreset.remaining,
        remaining: poolPreset.remaining,
        resetsAt: new Date(Date.now() + 8 * 3600 * 1000 + 12 * 60 * 1000).toISOString(),
      }
    : null;

  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "grantedComfortable", label: "Granted · comfortable" },
          { id: "grantedWarning", label: "Granted · warning" },
          { id: "grantedUrgent", label: "Granted · urgent" },
          { id: "grantedSoldOut", label: "Granted · sold out" },
          { id: "grantedClaiming", label: "Granted · claiming…" },
          { id: "claimedUnselected", label: "Claimed · fresh (7d)" },
          { id: "claimedSelected", label: "Claimed · selected" },
          { id: "claimedUrgent", label: "Claimed · expiring <24h" },
        ]}
      />
      <Frame>
        <div className="max-w-[320px] mx-auto md:mx-0">
          <VoucherCard
            voucher={voucher}
            onRedeem={() => {}}
            onClaim={() => {}}
            compact
            selected={state === "claimedSelected"}
            claiming={state === "grantedClaiming"}
            poolOverride={state.startsWith("granted") ? poolOverride : undefined}
          />
        </div>
      </Frame>
      <p className="text-[11px] text-muted-foreground italic">
        Expired visuals live in the Expired-row case — VoucherCard has no expired branch.
      </p>
    </div>
  );
};

/* ---------------- 4. VoucherEarningsCard (real component) ---------------- */

type TierState =
  | "t0Default"
  | "t1Deposit"
  | "t2Volume"
  | "t3Volume"
  | "t4Max"
  | "nothingToClaim"
  | "lifetimeAtCap";

const TIER_PRESETS: Record<
  TierState,
  { volume: number; pending: number; lifetimeCredited: number; depositTotal: number }
> = {
  t0Default:      { volume: 0,        pending: 1.40,  lifetimeCredited: 0,  depositTotal: 0 },
  t1Deposit:      { volume: 150,      pending: 4.20,  lifetimeCredited: 2,  depositTotal: 25 },
  t2Volume:       { volume: 2_500,    pending: 8.00,  lifetimeCredited: 5,  depositTotal: 25 },
  t3Volume:       { volume: 22_000,   pending: 15.00, lifetimeCredited: 10, depositTotal: 25 },
  t4Max:          { volume: 80_000,   pending: 60.00, lifetimeCredited: 20, depositTotal: 25 },
  nothingToClaim: { volume: 2_500,    pending: 0,     lifetimeCredited: 5,  depositTotal: 25 },
  lifetimeAtCap:  { volume: 2_500,    pending: 4,     lifetimeCredited: 10, depositTotal: 25 },
};

const EarningsButtonRow = ({
  variant,
  label,
  amount,
}: {
  variant: "primary" | "muted";
  label: string;
  amount?: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-48 text-[11px] text-muted-foreground">{label}</div>
    <Button size="sm" disabled={variant === "muted"} className="min-w-[220px]">
      {variant === "primary" ? <Wallet className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
      {amount ?? label}
    </Button>
  </div>
);

export const EarningsPreview = () => {
  const [state, setState] = useState<TierState>("t2Volume");
  const data = TIER_PRESETS[state];
  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "t0Default", label: "T0 · no req." },
          { id: "t1Deposit", label: "T1 · deposit" },
          { id: "t2Volume", label: "T2 · volume" },
          { id: "t3Volume", label: "T3 · volume" },
          { id: "t4Max", label: "T4 · max" },
          { id: "nothingToClaim", label: "Nothing to claim" },
          { id: "lifetimeAtCap", label: "Lifetime at cap" },
        ]}
      />
      <Frame>
        <VoucherEarningsCard data={data} />
      </Frame>

      <Frame label="Claim button — full state ladder (dev reference)">
        <div className="space-y-2">
          <EarningsButtonRow variant="primary" label="claimable > 0" amount="Claim $8.00 to wallet" />
          <EarningsButtonRow variant="muted" label="claiming…" amount="Claiming…" />
          <EarningsButtonRow variant="muted" label="pending ≤ 0" amount="Nothing to claim" />
          <EarningsButtonRow variant="muted" label="lifetime at cap, pending > 0" amount="Tier cap claimed — reach next tier" />
          <EarningsButtonRow variant="muted" label="no tier unlocked" amount="Unlock next tier to claim more" />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground italic flex items-center gap-1.5">
          <Loader2 className="w-3 h-3" />
          Source: src/components/vouchers/VoucherEarningsCard.tsx · Claim button state ladder.
        </p>
      </Frame>
    </div>
  );
};

/* ---------------- 5. Event picker rows (real components) ---------------- */

export const PickerPreview = () => {
  const isMobile = useIsMobile();
  const [eventType, setEventType] = useState<"binary" | "multi">("binary");
  return (
    <div className="space-y-3">
      <PresetRail
        value={eventType}
        onChange={setEventType}
        options={[
          { id: "binary", label: "Binary event" },
          { id: "multi", label: "Multi-market event" },
        ]}
      />
      <Frame>
        {eventType === "binary" ? (
          <EventPickerCard
            mobile={isMobile}
            name="UFC 316 Headliner: Pereira vs Ankalaev?"
            meta="sports · settles Jun 7"
            lines={["futures"]}
            tail="Binary"
            rowsLayout={isMobile ? "stack" : "grid"}
          >
            <PickerOptionRow isBinary mobile={isMobile} label="Alex Pereira" price={0.42} />
            <PickerOptionRow isBinary mobile={isMobile} label="Magomed Ankalaev" price={0.58} />
          </EventPickerCard>
        ) : (
          <EventPickerCard
            mobile={isMobile}
            name="US unemployment rate May 2026?"
            meta="macro · settles Jun 5"
            lines={["futures"]}
            tail="4 options"
            eligible={false}
          >
            <PickerOptionRow isBinary={false} mobile={isMobile} label="Above 5.0%" price={0.35} />
            <PickerOptionRow isBinary={false} mobile={isMobile} label="4.5%–5.0%" price={0.18} dim />
            <PickerOptionRow isBinary={false} mobile={isMobile} label="4.0%–4.5%" price={0.55} dim />
            <PickerOptionRow isBinary={false} mobile={isMobile} label="Below 4.0%" price={0.92} dim />
            <PickerBlockedReason>Priced outside the voucher band — pick another option.</PickerBlockedReason>
          </EventPickerCard>
        )}
      </Frame>
    </div>
  );
};

/* ---------------- 6. Redeem confirm bar (real component) ---------------- */

type StickyState = "empty" | "binary" | "multiYes" | "multiNo" | "submitting";

const STICKY_PICKS: Record<Exclude<StickyState, "empty">, {
  eventName: string;
  displayLabel: string;
  isBinary: boolean;
  side: "long" | "short";
  price: number;
}> = {
  binary: { eventName: "UFC 316 Headliner", displayLabel: "Magomed Ankalaev", isBinary: true, side: "long", price: 0.58 },
  multiYes: { eventName: "US unemployment rate May 2026?", displayLabel: "Above 5.0%", isBinary: false, side: "long", price: 0.35 },
  multiNo: { eventName: "US unemployment rate May 2026?", displayLabel: "Above 5.0%", isBinary: false, side: "short", price: 0.65 },
  submitting: { eventName: "UFC 316 Headliner", displayLabel: "Magomed Ankalaev", isBinary: true, side: "long", price: 0.58 },
};

export const RedeemStickyPreview = () => {
  const [state, setState] = useState<StickyState>("binary");
  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "empty", label: "Nothing picked" },
          { id: "binary", label: "Binary picked" },
          { id: "multiYes", label: "Multi · Yes" },
          { id: "multiNo", label: "Multi · No" },
          { id: "submitting", label: "Submitting" },
        ]}
      />
      <Frame>
        <RedeemSummaryBar
          picked={state === "empty" ? null : STICKY_PICKS[state]}
          faceValue={25}
          maxHoldingHours={72}
          isRedeeming={state === "submitting"}
        />
      </Frame>
    </div>
  );
};

/* ---------------- 7. CloseVoucherContent (real component) ---------------- */

type CloseState =
  | "longProfit"
  | "longProfitCapped"
  | "longLoss"
  | "shortProfit"
  | "shortLoss"
  | "submitting";

const CLOSE_PRESETS: Record<
  CloseState,
  { side: "long" | "short"; entry: number; mark: number; face: number; label: string }
> = {
  longProfit:       { side: "long",  entry: 0.42, mark: 0.62, face: 25, label: "Magomed Ankalaev" },
  longProfitCapped: { side: "long",  entry: 0.20, mark: 0.95, face: 25, label: "Magomed Ankalaev" },
  longLoss:         { side: "long",  entry: 0.42, mark: 0.18, face: 25, label: "Magomed Ankalaev" },
  shortProfit:      { side: "short", entry: 0.70, mark: 0.20, face: 25, label: "Magomed Ankalaev" },
  shortLoss:        { side: "short", entry: 0.30, mark: 0.85, face: 25, label: "Magomed Ankalaev" },
  submitting:       { side: "long",  entry: 0.42, mark: 0.62, face: 25, label: "Magomed Ankalaev" },
};

export const ClosePreview = () => {
  const [state, setState] = useState<CloseState>("longProfit");
  const p = CLOSE_PRESETS[state];
  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "longProfit", label: "Long · profit" },
          { id: "longProfitCapped", label: "Long · capped" },
          { id: "longLoss", label: "Long · loss" },
          { id: "shortProfit", label: "Short · profit" },
          { id: "shortLoss", label: "Short · loss" },
          { id: "submitting", label: "Submitting" },
        ]}
      />
      <Frame>
        <div className="max-w-md">
          <CloseVoucherContent
            optionLabel={p.label}
            side={p.side}
            entryPrice={p.entry}
            markPrice={p.mark}
            faceValue={p.face}
            redeemableCap={p.face}
            isClosing={state === "submitting"}
            onConfirm={() => {}}
            onCancel={() => {}}
          />
        </div>
      </Frame>
    </div>
  );
};

/* ---------------- 9. Position chip (mirror) ---------------- */

export const PositionChipPreview = () => {
  const [state, setState] = useState<"comfortable" | "warning" | "overdue">("comfortable");
  const remainingH = state === "comfortable" ? 47 : state === "warning" ? 0.5 : -2;
  const label =
    remainingH < 0
      ? "Auto-settling…"
      : remainingH < 1
        ? `${Math.round(remainingH * 60)}m left`
        : `${Math.round(remainingH)}h left`;
  const tone =
    remainingH < 0
      ? "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
      : remainingH < 1
        ? "border-trading-red/40 bg-trading-red/10 text-trading-red"
        : "border-primary/30 bg-primary/10 text-primary";

  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "comfortable", label: "Comfortable (>1h)" },
          { id: "warning", label: "Urgent (<1h)" },
          { id: "overdue", label: "Past hold window" },
        ]}
      />
      <Frame>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
            <Ticket className="w-3 h-3 mr-1" />
            Voucher
          </Badge>
          <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-mono ${tone}`}>
            <Clock className="w-3 h-3" />
            {label}
          </span>
        </div>
      </Frame>
    </div>
  );
};
