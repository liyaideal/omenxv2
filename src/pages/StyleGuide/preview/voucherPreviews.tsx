/**
 * Voucher preview cases mounted inside <DeviceFrame> iframes so `md:` breakpoints
 * resolve against the 375px mobile viewport.
 *
 * Real production components used directly (with mock props):
 *  - VoucherCard              → src/components/vouchers/VoucherCard.tsx
 *  - VoucherEarningsCard      → src/components/vouchers/VoucherEarningsCard.tsx
 *  - CloseVoucherContent      → src/components/positions/CloseVoucherContent.tsx
 *  - EmptyState / LoadingState → src/components/states/*
 *
 * The following demos stay as style-guide-internal mirrors because production has
 * no independent, prop-driven component to import:
 *  - Banner            (VoucherBanner reads usePositionVouchers() directly; no props)
 *  - Event picker rows (EventPickerList is hook-driven; eligibility states can't
 *                       be forced without mocking useActiveEvents)
 *  - Redeem sticky bar (embedded inside RedeemVoucherContent; not exported)
 *  - Redeemed row      (RedeemedSection is inline in Vouchers.tsx, not exported)
 *  - Position chip     (composed inline in positions tables)
 *  - Expired row       (ExpiredSection is inline in Vouchers.tsx)
 * Each mirror must be kept 1:1 in sync with its production source.
 */

import { useState } from "react";
import {
  Ticket,
  ChevronRight,
  Lock,
  Clock,
  Gift,
  Loader2,
  Wallet,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoucherCard } from "@/components/vouchers/VoucherCard";
import { VoucherEarningsCard } from "@/components/vouchers/VoucherEarningsCard";
import { CloseVoucherContent } from "@/components/positions/CloseVoucherContent";
import { EmptyState, LoadingState } from "@/components/states";
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

/* ---------------- 1. Banner (mirror) ---------------- */
/* 1:1 mirror of src/components/vouchers/VoucherBanner.tsx — keep className /
   copy / icon in lockstep. */

type BannerState = "hidden" | "grantedOnly" | "grantedAndClaimed" | "claimedOnly";

export const BannerPreview = () => {
  const [state, setState] = useState<BannerState>("grantedOnly");

  const grantedCount: number = state === "grantedOnly" ? 2 : state === "grantedAndClaimed" ? 1 : 0;
  const claimedCount: number = state === "claimedOnly" ? 3 : state === "grantedAndClaimed" ? 2 : 0;
  const showGranted = grantedCount > 0;
  const Icon = showGranted ? Gift : Ticket;
  const headline = showGranted
    ? `You have ${grantedCount} unclaimed voucher${grantedCount === 1 ? "" : "s"}`
    : `You have ${claimedCount} voucher${claimedCount === 1 ? "" : "s"} ready to redeem`;
  const subline = showGranted
    ? "Tap to claim — then redeem within 7 days."
    : "Redeem to open a free position on any eligible event.";

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
        {state === "hidden" ? (
          <div className="text-xs text-muted-foreground italic">
            Banner is not rendered when the user has zero granted and zero claimed vouchers.
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{headline}</div>
                <div className="text-xs text-muted-foreground">{subline}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        )}
      </Frame>
    </div>
  );
};

/* ---------------- 2. Page list-level states ---------------- */
/* Real EmptyState / LoadingState, matching the components mounted by
   src/pages/Vouchers.tsx around its list branches. */

export const PageListLevelPreview = () => {
  const [state, setState] = useState<"loading" | "empty" | "populated">("empty");
  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "loading", label: "Loading" },
          { id: "empty", label: "Empty" },
          { id: "populated", label: "Populated (see other cases)" },
        ]}
      />
      <Frame>
        {state === "loading" && <LoadingState label="Loading vouchers…" variant="skeleton" skeletonRows={3} />}
        {state === "empty" && (
          <EmptyState
            variant="card"
            icon={Ticket}
            title="No vouchers yet"
            description="When you receive a position voucher, it'll show up here ready to redeem."
          />
        )}
        {state === "populated" && (
          <div className="text-xs text-muted-foreground italic">
            When vouchers exist the page renders the To-claim rail, Ready-to-redeem grid,
            Redeemed list, and Expired list — see the other cases in this section.
          </div>
        )}
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

/* ---------------- 5. Event picker rows (mirror) ---------------- */

const PickerOptionRow = ({
  label,
  price,
  state,
  binary,
  isYes,
}: {
  label: string;
  price: number;
  state: "eligible" | "band" | "time" | "resolved";
  binary: boolean;
  isYes?: boolean;
}) => {
  const locked = state !== "eligible";
  const reason =
    state === "band"
      ? "Price out of 0.20–0.80 band"
      : state === "time"
        ? "Closes within 6h"
        : state === "resolved"
          ? "Event already resolved"
          : "";
  const colorClass = binary
    ? isYes
      ? "border-trading-green/40 bg-trading-green/15 text-trading-green"
      : "border-trading-red/40 bg-trading-red/15 text-trading-red"
    : "border-trading-green/40 bg-trading-green/15 text-trading-green";

  const btnClass = locked
    ? "border-border bg-muted/40 text-muted-foreground cursor-not-allowed"
    : colorClass;

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap md:flex-nowrap">
      <div className="min-w-0 flex-1 text-xs text-foreground/90 truncate">{label}</div>
      <div className="font-mono text-xs text-muted-foreground tabular-nums w-12 text-right">
        ${price.toFixed(2)}
      </div>
      <div className="flex gap-1">
        {binary ? (
          <button className={`h-7 px-2 rounded text-[11px] font-medium border ${btnClass}`} disabled={locked}>
            {locked && <Lock className="w-3 h-3 inline mr-1" />}
            Buy {label}
          </button>
        ) : (
          <>
            <button className={`h-7 px-2 rounded text-[11px] font-medium border ${btnClass}`} disabled={locked}>
              {locked && <Lock className="w-3 h-3 inline mr-1" />}
              Yes
            </button>
            <button
              className={`h-7 px-2 rounded text-[11px] font-medium border ${
                locked ? "border-border bg-muted/40 text-muted-foreground cursor-not-allowed" : "border-trading-red/40 bg-trading-red/15 text-trading-red"
              }`}
              disabled={locked}
            >
              {locked && <Lock className="w-3 h-3 inline mr-1" />}
              No
            </button>
          </>
        )}
      </div>
      {locked && (
        <span className="text-[10px] text-muted-foreground italic md:w-44 md:text-right shrink-0 basis-full md:basis-auto">
          {reason}
        </span>
      )}
    </div>
  );
};

export const PickerPreview = () => {
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
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {eventType === "binary" ? "UFC 316 Headliner: Pereira vs Ankalaev?" : "US unemployment rate May 2026?"}
              </div>
              <div className="text-[10px] text-muted-foreground capitalize">
                {eventType === "binary" ? "sports" : "macro"}
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {eventType === "binary" ? "Binary" : "5 options"}
            </Badge>
          </div>
          <div className="space-y-1.5">
            {eventType === "binary" ? (
              <>
                <PickerOptionRow label="Alex Pereira" price={0.42} state="eligible" binary isYes />
                <PickerOptionRow label="Magomed Ankalaev" price={0.58} state="eligible" binary isYes={false} />
              </>
            ) : (
              <>
                <PickerOptionRow label="Above 5.0%" price={0.35} state="eligible" binary={false} />
                <PickerOptionRow label="4.5%–5.0%" price={0.18} state="band" binary={false} />
                <PickerOptionRow label="4.0%–4.5%" price={0.55} state="time" binary={false} />
                <PickerOptionRow label="Below 4.0%" price={0.92} state="resolved" binary={false} />
              </>
            )}
          </div>
        </div>
      </Frame>
    </div>
  );
};

/* ---------------- 6. Redeem sticky bar (mirror) ---------------- */

export const RedeemStickyPreview = () => {
  const [state, setState] = useState<"empty" | "binary" | "multiYes" | "multiNo" | "submitting">("binary");

  const labels: Record<string, { display: string; color: string; hint: string }> = {
    binary: { display: "Magomed Ankalaev", color: "text-trading-red", hint: "Binary · alias" },
    multiYes: { display: "Above 5.0% · YES", color: "text-trading-green", hint: "Multi-market · Yes side" },
    multiNo: { display: "Above 5.0% · NO", color: "text-trading-red", hint: "Multi-market · No side" },
  };

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
        <div className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {state === "empty" ? (
            <span className="text-xs text-muted-foreground">Select an outcome on a market above to continue.</span>
          ) : (
            <div className="min-w-0">
              <div className={`text-sm font-medium ${labels[state]?.color}`}>{labels[state]?.display}</div>
              <div className="text-[11px] text-muted-foreground">{labels[state]?.hint}</div>
            </div>
          )}
          <Button size="sm" disabled={state === "empty" || state === "submitting"} className="w-full md:w-auto">
            {state === "submitting" ? "Redeeming…" : "Redeem"}
          </Button>
        </div>
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

/* ---------------- 8. Redeemed voucher row (mirror) ---------------- */

type RedeemedState =
  | "binaryOpen"
  | "multiOpen"
  | "settledManualProfit"
  | "settledEventResolved"
  | "settledHoldExpiry"
  | "settledFullLoss";


export const RedeemedRowPreview = () => {
  const [state, setState] = useState<RedeemedState>("binaryOpen");
  const isClosed = state.startsWith("settled");

  const pnl =
    state === "settledManualProfit" ? 7.35
    : state === "settledEventResolved" ? 18.20
    : state === "settledHoldExpiry" ? -4.10
    : state === "settledFullLoss" ? 0
    : null;
  const pnlColor =
    pnl == null
      ? "text-muted-foreground"
      : pnl > 0
        ? "text-trading-green"
        : pnl < 0
          ? "text-trading-red"
          : "text-muted-foreground";

  const isBinary = state === "binaryOpen";
  const code =
    state === "binaryOpen" ? "50AAC401"
    : state === "multiOpen" ? "DC3CAC02"
    : "EE8ECA03";
  const face =
    state === "binaryOpen" ? 10
    : state === "multiOpen" ? 25
    : 50;
  const eventName =
    state === "binaryOpen"
      ? "UFC 316 Headliner: Pereira vs Ankalaev?"
      : state === "multiOpen"
        ? "NBA Finals 2026 Game 7: Celtics vs Thunder?"
        : "US unemployment rate May 2026?";

  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "binaryOpen", label: "Binary · open" },
          { id: "multiOpen", label: "Multi · open" },
          { id: "settledManualProfit", label: "Settled · manual · +PnL" },
          { id: "settledEventResolved", label: "Settled · resolved · +PnL" },
          { id: "settledHoldExpiry", label: "Settled · hold expired · −PnL" },
          { id: "settledFullLoss", label: "Settled · $0.00" },
        ]}
      />
      <Frame>
        <div className={`rounded-lg border border-border bg-muted/20 p-3 max-w-xl ${isClosed ? "opacity-90" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground">{code}</span>
                <span className="font-mono text-sm">${face.toFixed(2)}</span>
              </div>
              {!isBinary && (
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center rounded border border-border bg-background/40 px-1.5 py-0.5 text-[10px] tracking-wider uppercase text-muted-foreground">
                    Above 5.0%
                  </span>
                  <span className="inline-flex items-center rounded border border-trading-green/40 bg-trading-green/10 px-1.5 py-0.5 text-[10px] tracking-wider uppercase text-trading-green">
                    YES
                  </span>
                </div>
              )}
              <div className="text-xs text-foreground/80 mt-1 truncate">{eventName}</div>

              {isBinary && (
                <div className="mt-1.5 min-w-0">
                  <span className="inline-flex max-w-full items-center rounded border border-border bg-background/40 px-1.5 py-0.5 text-[10px] normal-case truncate text-trading-red">
                    Magomed Ankalaev
                  </span>
                </div>
              )}
              <div className="text-[11px] text-muted-foreground mt-1">Redeemed 03/06/2026</div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-[11px] ${isClosed ? "text-muted-foreground" : "text-primary"}`}>
                {isClosed ? "Position closed" : "Position open"}
              </span>
              {isClosed && pnl != null && (
                <span className={`font-mono text-sm ${pnlColor}`}>
                  {pnl > 0 ? "+" : ""}${pnl.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Frame>
      <p className="text-[11px] text-muted-foreground italic">
        Right column mirrors production: flat <code className="font-mono">Position open</code> /
        <code className="font-mono"> Position closed</code>. PnL amount varies per state below.
      </p>
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

/* ---------------- 10. Expired voucher row (mirror) ---------------- */
/* Mirrors src/pages/Vouchers.tsx::ExpiredSection row 1:1. Production subline
   copy: "Unclaimed" (never claimed) or "Claimed, not redeemed" (claimed but
   never redeemed within the 7-day window). */

type ExpiredState = "expiredUnclaimed" | "expiredUnredeemed";

export const ExpiredRowPreview = () => {
  const [state, setState] = useState<ExpiredState>("expiredUnclaimed");
  const isUnclaimed = state === "expiredUnclaimed";
  const code = isUnclaimed ? "AB12CD34" : "EF56GH78";
  const face = isUnclaimed ? 10 : 25;
  const reason = isUnclaimed ? "Unclaimed" : "Claimed, not redeemed";

  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "expiredUnclaimed", label: "Granted → never claimed" },
          { id: "expiredUnredeemed", label: "Claimed → not redeemed in 7d" },
        ]}
      />
      <Frame>
        <div className="rounded-lg border border-border bg-muted/10 p-3 flex items-center justify-between gap-3 opacity-70 max-w-xl">
          <div>
            <span className="font-mono text-xs text-muted-foreground">{code}</span>
            <span className="font-mono text-sm ml-2">${face.toFixed(2)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-muted-foreground">Expired</span>
            <span className="text-[10px] text-muted-foreground/70">{reason}</span>
          </div>
        </div>
      </Frame>
      <p className="text-[11px] text-muted-foreground italic flex items-center gap-1.5">
        <Coins className="w-3 h-3" />
        Source: src/pages/Vouchers.tsx::ExpiredSection.
      </p>
    </div>
  );
};
