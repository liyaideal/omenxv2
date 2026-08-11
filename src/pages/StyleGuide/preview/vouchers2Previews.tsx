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
 * Style-guide-internal mirror (annotated, must stay 1:1 with production):
 *  - Market picker cards — EventPickerList is hook-driven (useActiveEvents +
 *    usePositionVouchers); eligibility / lock states cannot be forced with props.
 */
import { useState } from "react";
import { Lock, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  VoucherRow,
  RowPrimaryButton,
  RowOutlineButton,
  RowStatusWord,
} from "@/components/vouchers/VoucherRow";
import { VoucherEarningsCard } from "@/components/vouchers/VoucherEarningsCard";
import { VoucherHistoryArchive } from "@/components/vouchers/VoucherHistoryArchive";
import { VoucherDeskHeader } from "@/components/vouchers/VoucherDeskHeader";
import { VT } from "@/components/vouchers/voucherTokens";
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

/* ------------------------ 4. Market picker (mirror) ----------------------- */
/* 1:1 mirror of src/components/vouchers/EventPickerList.tsx card recipe. */

const MetaCaps = ({ children }: { children: React.ReactNode }) => (
  <span className="font-display uppercase" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".12em", color: VT.muted }}>
    {children}
  </span>
);

const LineBadge = ({ children, strong }: { children: React.ReactNode; strong?: boolean }) => (
  <span
    className="font-display uppercase rounded-[6px]"
    style={{
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: ".1em",
      color: strong ? VT.ink2 : VT.muted,
      background: VT.surfaceInset,
      border: `1px solid ${strong ? VT.line3 : VT.line}`,
      padding: "4px 7px",
    }}
  >
    {children}
  </span>
);

const SideButton = ({
  label,
  tone,
  picked,
  disabled,
  block,
}: {
  label: string;
  tone: "neutral" | "yes" | "no";
  picked?: boolean;
  disabled?: boolean;
  block?: boolean;
}) => {
  const base = {
    yes: { color: "hsl(74 100% 65%)", border: "hsl(74 100% 65% / .4)" },
    no: { color: "hsl(0 100% 68%)", border: "hsl(0 100% 68% / .4)" },
    neutral: { color: VT.ink, border: VT.line3 },
  }[tone];
  return (
    <button
      type="button"
      disabled={disabled}
      className={`font-display rounded-[8px] ${block ? "min-h-[44px] w-full flex items-center justify-center" : ""}`}
      style={{
        fontSize: block ? 12 : 11.5,
        fontWeight: 700,
        padding: block ? undefined : "5px 10px",
        color: picked ? "#0A0B0D" : disabled ? VT.muted2 : base.color,
        background: picked ? "hsl(74 100% 65%)" : "transparent",
        border: picked ? "none" : `1px solid ${disabled ? VT.line2 : base.border}`,
      }}
    >
      {picked ? "Picked" : label}
    </button>
  );
};

const OptionRow = ({
  label,
  price,
  dim,
  binary,
  picked,
  mobile,
}: {
  label: string;
  price: string;
  dim?: boolean;
  binary?: boolean;
  picked?: "long" | "short";
  mobile?: boolean;
}) => {
  const priceEl = (
    <span className="font-display tabular-nums flex-none" style={{ fontSize: 13, fontWeight: 700, color: dim ? VT.muted : VT.ink3 }}>
      {price}
    </span>
  );
  if (!binary && mobile) {
    return (
      <div
        className="rounded-[9px] flex flex-col gap-[8px]"
        style={{ background: VT.surfaceDeep, border: `1px solid ${picked ? VT.volt : VT.line2}`, padding: "9px 11px 10px" }}
      >
        <div className="flex items-center justify-between gap-[10px]">
          <span className="flex-1 min-w-0 truncate" style={{ fontSize: 11.5, color: dim ? VT.muted : VT.ink }}>{label}</span>
          {priceEl}
        </div>
        <div className="grid grid-cols-2 gap-[7px]">
          <SideButton block label="Yes" tone="yes" picked={picked === "long"} disabled={dim} />
          <SideButton block label="No" tone="no" picked={picked === "short"} disabled={dim} />
        </div>
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-between gap-[10px] rounded-[9px]"
      style={{
        background: VT.surfaceDeep,
        border: `1px solid ${picked ? VT.volt : VT.line2}`,
        padding: mobile ? "0 12px" : "9px 12px",
        minHeight: 44,
      }}
    >
      <span
        className="flex-1 min-w-0 truncate"
        style={{ fontSize: binary ? 11 : 11.5, fontWeight: picked ? 600 : 400, color: dim ? VT.muted : binary ? VT.ink3 : VT.ink }}
      >
        {label}
      </span>
      <span className="flex-none flex items-center gap-[9px]">
        {priceEl}
        {binary ? (
          <SideButton label="Buy" tone="neutral" picked={picked === "long"} disabled={dim} />
        ) : (
          <>
            <SideButton label="Yes" tone="yes" picked={picked === "long"} disabled={dim} />
            <SideButton label="No" tone="no" picked={picked === "short"} disabled={dim} />
          </>
        )}
      </span>
    </div>
  );
};

const PickerCard = ({
  name,
  meta,
  lines,
  tail,
  locked,
  dim,
  children,
  mobile,
}: {
  name: string;
  meta: string;
  lines: string[];
  tail?: string;
  locked?: boolean;
  dim?: boolean;
  children?: React.ReactNode;
  mobile?: boolean;
}) => (
  <div
    className="rounded-[12px]"
    style={{
      background: VT.surfaceCard,
      border: `1px solid ${VT.line}`,
      padding: mobile ? 13 : 14,
      opacity: locked ? 0.5 : dim ? 0.62 : 1,
    }}
  >
    <div className="flex items-start justify-between gap-[12px]" style={{ marginBottom: 11 }}>
      <div className="flex flex-col gap-[3px] min-w-0">
        <span className="truncate" style={{ fontSize: 13.5, fontWeight: 600, color: dim || locked ? VT.ink2 : VT.ink }}>
          {name}
        </span>
        <MetaCaps>{meta}</MetaCaps>
      </div>
      <div className="flex-none flex items-center gap-[6px] flex-wrap justify-end">
        {lines.map((l) => (
          <LineBadge key={l} strong>{l}</LineBadge>
        ))}
        {!locked && tail && <LineBadge>{tail}</LineBadge>}
        {locked && (
          <span className="flex items-center gap-[5px]" style={{ fontSize: 11, fontWeight: 600, color: VT.ink2 }}>
            <Lock className="w-3 h-3" />
            Voucher already used
          </span>
        )}
      </div>
    </div>
    {children}
  </div>
);

type PickerState = "boost" | "standard" | "multi" | "priceBand" | "usedEvent" | "empty" | "loading";

export const Vouchers2PickerPreview = () => {
  const isMobile = useIsMobile();
  const [state, setState] = useState<PickerState>("boost");

  const body = (() => {
    if (state === "loading")
      return (
        <div className="flex flex-col gap-[10px]">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-[12px] flex flex-col gap-[11px]" style={{ background: VT.surfaceCard, border: `1px solid ${VT.line}`, padding: 14 }}>
              <div className="flex flex-col gap-[6px]">
                <span className="rounded-[4px]" style={{ width: "70%", height: 12, background: "#171A1F" }} />
                <span className="rounded-[4px]" style={{ width: "38%", height: 9, background: "#15181C" }} />
              </div>
              <div className="grid grid-cols-2 gap-[8px]">
                {[0, 1].map((j) => (
                  <span key={j} className="rounded-[9px]" style={{ height: 44, background: VT.surfaceDeep, border: `1px solid ${VT.hairline}` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    if (state === "empty")
      return (
        <div
          className="rounded-[12px] flex flex-col items-center gap-[8px] text-center"
          style={{ background: VT.surfaceDeep, border: `1px solid ${VT.line}`, padding: "34px 24px" }}
        >
          <span className="font-display" style={{ fontSize: 14, fontWeight: 700, color: VT.ink }}>
            No markets match “solana”
          </span>
          <span style={{ fontSize: 11.5, color: VT.ink3, lineHeight: 1.6, maxWidth: 270 }}>
            Nothing here right now takes a voucher. Clear the filter to see everything eligible.
          </span>
          <button
            type="button"
            className="font-display rounded-[10px] flex items-center"
            style={{ marginTop: 4, minHeight: 40, padding: "0 16px", border: `1px solid ${VT.line3}`, fontSize: 12.5, fontWeight: 600, color: VT.ink }}
          >
            Clear filters
          </button>
        </div>
      );

    if (state === "usedEvent")
      return (
        <PickerCard
          mobile={isMobile}
          locked
          name="Will BTC close above $70k on Aug 12?"
          meta="Crypto · settles Aug 12"
          lines={["Boost"]}
        >
          <div style={{ fontSize: 11, color: VT.ink3, lineHeight: 1.5 }}>
            One voucher per event — you already opened a trial position here. The lock covers both product lines
            of this event.
          </div>
        </PickerCard>
      );

    if (state === "priceBand")
      return (
        <PickerCard mobile={isMobile} dim name="Fed cuts in September?" meta="Macro · settles Sep 18" lines={["Boost"]} tail="Binary">
          <div className={isMobile ? "flex flex-col gap-[6px]" : "grid grid-cols-2 gap-[8px]"}>
            <OptionRow binary mobile={isMobile} dim label="Yes" price="91¢" />
            <OptionRow binary mobile={isMobile} dim label="No" price="9¢" />
            <div className="flex items-start gap-[6px]" style={{ fontSize: 11, color: VT.ink3, lineHeight: 1.5, paddingTop: 2 }}>
              <Lock className="w-3 h-3 flex-none" style={{ marginTop: 2, color: VT.ink2 }} />
              Priced outside the voucher band — pick another option.
            </div>
          </div>
        </PickerCard>
      );

    if (state === "multi")
      return (
        <PickerCard mobile={isMobile} name="Who wins the World Cup?" meta="Sports · settles Dec 18" lines={["Boost"]} tail="4 options">
          <div className="flex flex-col gap-[6px]">
            <OptionRow mobile={isMobile} label="Brazil" price="32¢" picked="long" />
            <OptionRow mobile={isMobile} label="France" price="24¢" />
            <OptionRow mobile={isMobile} label="Argentina" price="19¢" />
            <OptionRow mobile={isMobile} dim label="Japan" price="4¢" />
          </div>
        </PickerCard>
      );

    if (state === "standard")
      return (
        <PickerCard mobile={isMobile} name="NVDA up or down — Aug 12" meta="Stocks · settles Aug 12" lines={["Standard"]} tail="Binary">
          <div className={isMobile ? "flex flex-col gap-[6px]" : "grid grid-cols-2 gap-[8px]"}>
            <OptionRow binary mobile={isMobile} label="Up" price="54¢" />
            <OptionRow binary mobile={isMobile} label="Down" price="46¢" />
          </div>
        </PickerCard>
      );

    return (
      <PickerCard mobile={isMobile} name="Will ETH close above $4k on Aug 14?" meta="Crypto · settles Aug 14" lines={["Boost"]} tail="Binary">
        <div className={isMobile ? "flex flex-col gap-[6px]" : "grid grid-cols-2 gap-[8px]"}>
          <OptionRow binary mobile={isMobile} label="Yes" price="61¢" />
          <OptionRow binary mobile={isMobile} label="No" price="39¢" />
        </div>
      </PickerCard>
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
          <div
            className="flex items-center gap-[9px] rounded-[10px]"
            style={{ background: VT.surfaceInset, border: `1px solid ${VT.line}`, padding: "0 12px", minHeight: isMobile ? 44 : 40 }}
          >
            <Search className="w-[15px] h-[15px] flex-none" style={{ color: VT.muted }} />
            <span style={{ fontSize: 12.5, color: VT.muted }}>Search markets</span>
          </div>
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
              <span style={{ width: 34, color: VT.ink }}>‹</span>
              <span className="flex-1 text-center font-display" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em", color: VT.ink }}>
                Redeem voucher
              </span>
              <span style={{ width: 34 }} />
            </header>
            <VoucherDeskHeader voucher={v2({ faceValue: 15, payoutMode: "instant" })} sourceLabel="World Cup Kickoff" compact />
            <div
              className="flex items-center justify-between gap-[10px] rounded-[12px]"
              style={{ background: VT.surfaceRow, border: `1px solid ${VT.line}`, padding: "10px 12px" }}
            >
              <span className="truncate" style={{ fontSize: 11.5, color: VT.ink3 }}>Brazil · Yes · 32¢</span>
              <button
                type="button"
                className="font-display rounded-[10px] flex-none"
                style={{ minHeight: 44, padding: "0 18px", background: "#FFFFFF", color: "#0A0B0D", fontSize: 13, fontWeight: 700 }}
              >
                Open trial position
              </button>
            </div>
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
