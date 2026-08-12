/**
 * Vouchers v2 preview cases — mounted inside <DeviceFrame> iframes so `md:`
 * breakpoints resolve against the real 375px mobile viewport.
 *
 * Real production components used directly (mock props only):
 *  - VoucherRow / RowPrimaryButton / RowOutlineButton / RowStatusWord
 *  - VoucherEarningsCard   (data + stats overrides)
 *  - VoucherHistoryArchive (items)
 *  - VoucherDeskHeader     (voucher, compact)
 *
 *  - EventPickerCard / PickerOptionRow / PickerBlockedReason — the pure
 *    presentational pieces extracted out of EventPickerList (same JSX as
 *    production; only the hook-driven data is mocked here).
 */
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft } from "lucide-react";
import {
  VoucherRow,
  RowPrimaryButton,
  RowOutlineButton,
  RowStatusWord,
} from "@/components/vouchers/VoucherRow";
import { VoucherEarningsCard } from "@/components/vouchers/VoucherEarningsCard";
import { VoucherHistoryArchive } from "@/components/vouchers/VoucherHistoryArchive";
import { VoucherDeskHeader } from "@/components/vouchers/VoucherDeskHeader";
import { RedeemSummaryBar } from "@/components/vouchers/RedeemSummaryBar";
import { VT } from "@/components/vouchers/voucherTokens";
import {
  EventPickerCard,
  PickerOptionRow,
  PickerBlockedReason,
  PickerSkeleton,
  PickerEmpty,
  PickerSearchBar,
} from "@/components/vouchers/EventPickerCard";
import type { PositionVoucher } from "@/hooks/usePositionVouchers";

/* ------------------------------ shared bits ------------------------------ */

const v2 = (o: Partial<PositionVoucher> = {}): PositionVoucher => ({
  id: "v2-mock",
  code: "OMX8F2K1",
  faceValue: 10,
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
  sourceLabel: null,
  ...o,
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

/* --------------------- 1. Row state family (real rows) -------------------- */

type RowState =
  | "ready"
  | "soldOut"
  | "activeTiered"
  | "activeInstant"
  | "selected";

export const Vouchers2RowsPreview = () => {
  const isMobile = useIsMobile();
  const [state, setState] = useState<RowState>("ready");

  const row = (() => {
    switch (state) {
      case "ready":
        return (
          <VoucherRow
            mobile={isMobile}
            faceValue={10}
            sourceLine="From August Kickoff"
            metaLine={<>Claim by Aug 18 · 653/1000 left today</>}
            action={<RowPrimaryButton mobile={isMobile}>Claim</RowPrimaryButton>}
          />
        );
      case "soldOut":
        return (
          <VoucherRow
            mobile={isMobile}
            faceValue={25}
            sourceLine="From World Cup Kickoff"
            metaLine={
              <>
                Claim by Aug 18 ·{" "}
                <span style={{ color: VT.red }}>Sold out today — resets in 8h 12m</span>
              </>
            }
            action={
              <RowPrimaryButton mobile={isMobile} disabled>
                Claim
              </RowPrimaryButton>
            }
          />
        );
      case "activeTiered":
        return (
          <VoucherRow
            mobile={isMobile}
            faceValue={10}
            sourceLine="Trial Position Voucher · OMX8F2K1"
            metaLine="Expires in 5d"
            action={<RowOutlineButton mobile={isMobile}>Redeem</RowOutlineButton>}
          />
        );
      case "activeInstant":
        return (
          <VoucherRow
            mobile={isMobile}
            faceValue={15}
            sourceLine="From World Cup Kickoff"
            metaLine="Expires in 3d"
            instantLine
            action={<RowOutlineButton mobile={isMobile}>Redeem</RowOutlineButton>}
          />
        );
      case "selected":
        return (
          <VoucherRow
            mobile={isMobile}
            faceValue={10}
            sourceLine="From Starter Rewards"
            metaLine="Expires in 5d"
            selected
            readout={<RowStatusWord tone="volt">Selected</RowStatusWord>}
          />
        );
    }
  })();

  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "ready", label: "Ready to claim" },
          { id: "soldOut", label: "Sold out (pool)" },
          { id: "activeTiered", label: "Active · tiered" },
          { id: "activeInstant", label: "Active · instant" },
          { id: "selected", label: "Selected (desk loaded)" },
        ]}
      />
      <Frame label={isMobile ? "375 — action stacks to 44px" : "Desktop row"}>{row}</Frame>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Payout mode only surfaces on Active instant rows (line 3, volt). Ready rows never carry a mode
        sentence — the mode is disclosed on the redeem desk.
      </p>
    </div>
  );
};

/* ----------------------- 2. Earnings hero — 3 states ---------------------- */

type HeroState = "claimable" | "locked" | "zero";

export const Vouchers2EarningsPreview = () => {
  const isMobile = useIsMobile();
  const [state, setState] = useState<HeroState>("claimable");

  const data =
    state === "claimable"
      ? { pending: 18.4, lifetimeCredited: 4, volume: 12_400, depositTotal: 250 }
      : state === "locked"
        ? { pending: 12.5, lifetimeCredited: 2, volume: 120, depositTotal: 0 }
        : { pending: 0, lifetimeCredited: 6, volume: 3_200, depositTotal: 50 };

  const stats =
    state === "zero"
      ? { readyCount: 0, readyValue: 0, activeCount: 0, activeValue: 0, redeemedCount: 4 }
      : { readyCount: 2, readyValue: 25, activeCount: 2, activeValue: 25, redeemedCount: 3 };

  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "claimable", label: "Claimable (T3)" },
          { id: "locked", label: "Locked (T0 · cap reached)" },
          { id: "zero", label: "Pending $0" },
        ]}
      />
      <Frame>
        <VoucherEarningsCard data={data} stats={stats} mobile={isMobile} onRedeemPrompt={() => {}} />
      </Frame>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Tier rail carries the volume ladder underneath each segment (T0 $0 · T1 $10 dep · T2 $1k · T3 $10k ·
        T4 $50k). The stats strip is one line and never wraps to a second row on desktop.
      </p>
    </div>
  );
};

/* ------------------- 3. History archive — collapsed / open ---------------- */

const HISTORY: PositionVoucher[] = [
  v2({
    id: "h1",
    faceValue: 15,
    status: "settled",
    payoutMode: "instant",
    redeemedEventName: "Will BTC close above $70k on Aug 9?",
    redeemedAt: new Date(Date.now() - 2 * 864e5).toISOString(),
    redeemedAirdropStatus: "settled",
    redeemedSettledPnl: 9.6,
  }),
  v2({
    id: "h2",
    faceValue: 10,
    status: "settled",
    payoutMode: "tiered",
    redeemedEventName: "NVDA up or down — Aug 8",
    redeemedAt: new Date(Date.now() - 3 * 864e5).toISOString(),
    redeemedAirdropStatus: "settled",
    redeemedSettledPnl: 4.25,
  }),
  v2({
    id: "h3",
    faceValue: 10,
    status: "settled",
    payoutMode: "tiered",
    redeemedEventName: "Man City vs Arsenal",
    redeemedAt: new Date(Date.now() - 5 * 864e5).toISOString(),
    redeemedAirdropStatus: "settled",
    redeemedSettledPnl: 0,
  }),
  v2({ id: "h4", faceValue: 5, status: "expired", claimedAt: new Date().toISOString() }),
  v2({ id: "h5", faceValue: 5, status: "expired", claimedAt: null }),
];

export const Vouchers2ArchivePreview = () => (
  <div className="space-y-3">
    <Frame label="Collapsed by default — tap the bar to expand in place">
      <VoucherHistoryArchive items={HISTORY} />
    </Frame>
    <p className="text-[11px] leading-relaxed text-muted-foreground">
      Right column captions: instant win → “Credited to wallet”, tiered win → “Added to pending”, loss →
      neutral $0.00 + “Voucher lost · nothing owed”. Expired rows carry the reason in the meta line
      (“Claimed, not redeemed” vs “Unclaimed”).
    </p>
  </div>
);

/* ------------------------- 4. Market picker (live) ------------------------ */
/* Mounts the real presentational pieces extracted from EventPickerList:
   PickerSearchBar / PickerSkeleton / PickerEmpty / EventPickerCard rows. */

type PickerState = "boost" | "standard" | "multi" | "priceBand" | "usedEvent" | "empty" | "loading";

export const Vouchers2PickerPreview = () => {
  const isMobile = useIsMobile();
  const [state, setState] = useState<PickerState>("boost");

  const body = (() => {
    if (state === "loading")
      return (
        <div className="flex flex-col gap-[10px]">
          <PickerSkeleton />
        </div>
      );

    if (state === "empty") return <PickerEmpty query="solana" />;

    if (state === "usedEvent")
      return (
        <EventPickerCard
          mobile={isMobile}
          locked
          eligible={false}
          name="Will BTC close above $70k on Aug 12?"
          meta="Crypto · settles Aug 12"
          lines={["futures"]}
        >
          <div style={{ fontSize: 11, color: VT.ink3, lineHeight: 1.5 }}>
            One voucher per event — you already opened a trial position here. The lock covers both product lines
            of this event.
          </div>
        </EventPickerCard>
      );

    if (state === "priceBand")
      return (
        <EventPickerCard
          mobile={isMobile}
          eligible={false}
          name="Fed cuts in September?"
          meta="Macro · settles Sep 18"
          lines={["futures"]}
          tail="Binary"
          rowsLayout={isMobile ? "stack" : "grid"}
        >
          <PickerOptionRow isBinary mobile={isMobile} dim label="Yes" price={0.91} />
          <PickerOptionRow isBinary mobile={isMobile} dim label="No" price={0.09} />
          <PickerBlockedReason>Priced outside the voucher band — pick another option.</PickerBlockedReason>
        </EventPickerCard>
      );

    if (state === "multi")
      return (
        <EventPickerCard mobile={isMobile} name="Who wins the World Cup?" meta="Sports · settles Dec 18" lines={["futures"]} tail="4 options">
          <PickerOptionRow isBinary={false} mobile={isMobile} label="Brazil" price={0.32} pickedLong />
          <PickerOptionRow isBinary={false} mobile={isMobile} label="France" price={0.24} />
          <PickerOptionRow isBinary={false} mobile={isMobile} label="Argentina" price={0.19} />
          <PickerOptionRow isBinary={false} mobile={isMobile} dim label="Japan" price={0.04} />
        </EventPickerCard>
      );

    if (state === "standard")
      return (
        <EventPickerCard mobile={isMobile} name="NVDA up or down — Aug 12" meta="Stocks · settles Aug 12" lines={["spot"]} tail="Binary" rowsLayout={isMobile ? "stack" : "grid"}>
          <PickerOptionRow isBinary mobile={isMobile} label="Up" price={0.54} />
          <PickerOptionRow isBinary mobile={isMobile} label="Down" price={0.46} />
        </EventPickerCard>
      );

    return (
      <EventPickerCard mobile={isMobile} name="Will ETH close above $4k on Aug 14?" meta="Crypto · settles Aug 14" lines={["futures"]} tail="Binary" rowsLayout={isMobile ? "stack" : "grid"}>
        <PickerOptionRow isBinary mobile={isMobile} label="Yes" price={0.61} />
        <PickerOptionRow isBinary mobile={isMobile} label="No" price={0.39} />
      </EventPickerCard>
    );
  })();

  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "boost", label: "BOOST card" },
          { id: "standard", label: "STANDARD card" },
          { id: "multi", label: "Multi-option (Yes/No)" },
          { id: "priceBand", label: "Price-band lock" },
          { id: "usedEvent", label: "Event already used" },
          { id: "empty", label: "Empty result" },
          { id: "loading", label: "Loading" },
        ]}
      />
      <Frame>
        <div className="flex flex-col gap-[14px]">
          <PickerSearchBar value="" mobile={isMobile} />
          {body}
        </div>
      </Frame>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Prices stay neutral mono (#9AA1AC) — direction colour lives on the Yes/No action buttons only. Binary
        cards expose one neutral Buy button per outcome.
      </p>
    </div>
  );
};

/* --------------------- 5. Redeem desk chrome + empty ---------------------- */

export const Vouchers2DeskPreview = () => {
  const isMobile = useIsMobile();
  const [state, setState] = useState<"tiered" | "instant" | "empty">("tiered");

  return (
    <div className="space-y-3">
      <PresetRail
        value={state}
        onChange={setState}
        options={[
          { id: "tiered", label: "Loaded · tiered" },
          { id: "instant", label: "Loaded · instant" },
          { id: "empty", label: "Nothing selected" },
        ]}
      />
      <Frame>
        <div className="overflow-hidden rounded-[16px]" style={{ background: VT.surfaceDesk, border: `1px solid ${VT.line}` }}>
          {state === "empty" ? (
            <div style={{ padding: 16 }}>
              <div
                className="flex flex-col items-center justify-center gap-[10px] text-center rounded-[12px]"
                style={{ height: 300, background: VT.surfaceDeep, border: `1px solid ${VT.line}`, padding: "0 40px" }}
              >
                <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: VT.ink }}>
                  Pick a voucher to redeem
                </span>
                <span style={{ fontSize: 12, color: VT.ink3, lineHeight: 1.6, maxWidth: 360 }}>
                  Choose one on the left and the market picker opens here. Your own balance is never used — the
                  voucher funds the trial position.
                </span>
              </div>
            </div>
          ) : (
            <VoucherDeskHeader
              voucher={v2({
                faceValue: state === "instant" ? 15 : 10,
                payoutMode: state === "instant" ? "instant" : "tiered",
              })}
              sourceLabel={state === "instant" ? "World Cup Kickoff" : "Starter Rewards"}
              compact={isMobile}
            />
          )}
        </div>
      </Frame>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Three meta cells: Max profit · Hold window · Payout. Mobile collapses the desk header into the compact
        summary card that sits above the picker on the dedicated redeem screen.
      </p>
    </div>
  );
};

/* ---------------- 6. Mobile 375 — list + dedicated redeem screen ---------- */

export const Vouchers2MobileFlowPreview = () => {
  const [screen, setScreen] = useState<"list" | "redeem">("list");
  return (
    <div className="space-y-3">
      <PresetRail
        value={screen}
        onChange={setScreen}
        options={[
          { id: "list", label: "List (rows stack)" },
          { id: "redeem", label: "Redeem screen" },
        ]}
      />
      <Frame label="Toggle Mobile·375 above for the true breakpoint">
        {screen === "list" ? (
          <div className="flex flex-col gap-[8px]">
            <VoucherRow
              mobile
              faceValue={10}
              sourceLine="From August Kickoff"
              metaLine="Claim by Aug 18 · 653/1000 left today"
              action={<RowPrimaryButton mobile>Claim</RowPrimaryButton>}
            />
            <VoucherRow
              mobile
              faceValue={15}
              sourceLine="From World Cup Kickoff"
              metaLine="Expires in 3d"
              instantLine
              action={<RowOutlineButton mobile>Redeem</RowOutlineButton>}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-[12px]">
            <header className="flex items-center gap-[10px]" style={{ borderBottom: `1px solid ${VT.line}`, padding: "10px 0" }}>
              <button
                type="button"
                aria-label="Back"
                className="flex items-center justify-center"
                style={{ width: 34, height: 34, color: VT.ink }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="flex-1 text-center font-display" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em", color: VT.ink }}>
                Redeem voucher
              </span>
              <span style={{ width: 34 }} />
            </header>
            <VoucherDeskHeader voucher={v2({ faceValue: 15, payoutMode: "instant" })} sourceLabel="World Cup Kickoff" compact />
            <RedeemSummaryBar
              variant="inline"
              faceValue={15}
              maxHoldingHours={24}
              picked={{
                eventName: "Who wins the World Cup?",
                displayLabel: "Brazil",
                isBinary: false,
                side: "long",
                price: 0.32,
              }}
            />
          </div>
        )}
      </Frame>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        On 375 the redeem flow is its own screen (list is replaced, not overlaid) and the confirm bar floats
        above the BottomNav.
      </p>
    </div>
  );
};
