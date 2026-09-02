/**
 * Vouchers state-dictionary previews (M4a-② · VC-1 / VC-3).
 *
 * Real production components only — no runtime fetch, no live hook:
 *  - VoucherSectionHead / VouchersListEmpty / VoucherDeskEmpty  (VouchersBody)
 *  - VoucherEarningsCard (fixture prop → hook disabled, no supabase, no realtime)
 *  - VoucherRow / RowPrimaryButton / RowOutlineButton / RowStatusWord
 *  - VoucherHistoryArchive
 *  - LoadingState / ErrorState (@/components/states)
 *
 * VouchersBody itself cannot be fixture-mounted whole (it owns
 * usePositionVouchers + useVoucherDailyPool + useSearchParams), so the two
 * layout frames re-assemble its exact production composition out of its own
 * exported parts: hero → SectionHead(Ready) → rows → SectionHead(Active) →
 * rows → history archive → fine print, desktop wrapped in the same
 * `400px minmax(0,1fr)` grid with the desk column on the right.
 */

import type { PositionVoucher } from "@/hooks/usePositionVouchers";
import {
  VoucherSectionHead,
  VouchersListEmpty,
  VoucherDeskEmpty,
} from "@/components/vouchers/VouchersBody";
import { VoucherEarningsCard } from "@/components/vouchers/VoucherEarningsCard";
import { VoucherHistoryArchive } from "@/components/vouchers/VoucherHistoryArchive";
import {
  VoucherRow,
  RowPrimaryButton,
  RowOutlineButton,
  RowStatusWord,
} from "@/components/vouchers/VoucherRow";
import { VT, shortDate } from "@/components/vouchers/voucherTokens";
import { LoadingState, ErrorState } from "@/components/states";
import { useIsMobile as useIsMobileFrame } from "@/hooks/use-mobile";
import { VoucherDeskHeader } from "@/components/vouchers/VoucherDeskHeader";
import { RedeemMetaCells } from "@/components/vouchers/RedeemVoucherContent";
import { RedeemSummaryBar } from "@/components/vouchers/RedeemSummaryBar";
import { MultiOptionRows, PickerCaptionRow, Chip } from "@/components/vouchers/EventPickerList";
import {
  EventPickerCard,
  SideButton,
  PickerDirectionPair,
  PickerOptionRow,
  PickerBlockedReason,
  PickerSkeleton,
  PickerEmpty,
  PickerNoEligible,
  PickerSearchBar,
} from "@/components/vouchers/EventPickerCard";

/** Deterministic relative dates — frozen offsets, never bare Date.now() math inline. */
export const daysFromNow = (d: number) => new Date(Date.now() + d * 864e5).toISOString();
export const daysAgoAt = (d: number) => new Date(Date.now() - d * 864e5).toISOString();

const FINE_PRINT =
  "USDC amounts are estimates and not guaranteed. A Trial Position Voucher opens a trial position — the profit is yours, the voucher itself is not withdrawable.";

const HISTORY: PositionVoucher[] = [];

const FIXTURE_EARNINGS = {
  pending: 18.4,
  lifetimeCredited: 4,
  volume: 12_400,
  depositTotal: 250,
};

const STATS = { readyCount: 1, readyValue: 10, activeCount: 2, activeValue: 25, redeemedCount: 3 };

const readyRow = (mobile: boolean) => (
  <VoucherRow
    mobile={mobile}
    faceValue={10}
    sourceLine="From August Kickoff"
    metaLine={<>Claim by {shortDate(daysFromNow(14))} · 653/1000 left today</>}
    action={<RowPrimaryButton mobile={mobile}>Claim</RowPrimaryButton>}
  />
);

const activeRows = (mobile: boolean, selectedFirst: boolean) => (
  <>
    <VoucherRow
      mobile={mobile}
      faceValue={10}
      sourceLine="From Starter Rewards"
      metaLine="Expires in 5d"
      selected={selectedFirst}
      action={
        selectedFirst ? undefined : <RowOutlineButton mobile={mobile}>Redeem</RowOutlineButton>
      }
      readout={selectedFirst ? <RowStatusWord tone="volt">Selected</RowStatusWord> : undefined}
    />
    <VoucherRow
      mobile={mobile}
      faceValue={15}
      sourceLine="From World Cup Kickoff"
      metaLine="Expires in 3d"
      instantLine
      action={<RowOutlineButton mobile={mobile}>Redeem</RowOutlineButton>}
    />
  </>
);

const List = ({ mobile, selectedFirst }: { mobile: boolean; selectedFirst: boolean }) => (
  <div className="flex flex-col gap-[14px]">
    <VoucherSectionHead dot label="Ready to claim" count={1} tone="volt" />
    <div className="flex flex-col gap-[8px]">{readyRow(mobile)}</div>
    <VoucherSectionHead label="Active" count={2} tone="neutral" />
    <div className="flex flex-col gap-[8px]">{activeRows(mobile, selectedFirst)}</div>
    <VoucherHistoryArchive items={HISTORY} />
  </div>
);

/* ------------------------------ VC-1 · desktop ---------------------------- */

export const VouchersBodyLayoutPreview = () => (
  <div className="flex flex-col gap-[20px]">
    <VoucherEarningsCard fixture={FIXTURE_EARNINGS} stats={STATS} />
    <div className="grid gap-[16px] items-start" style={{ gridTemplateColumns: "400px minmax(0,1fr)" }}>
      <List mobile={false} selectedFirst />
      <div
        className="overflow-hidden rounded-[16px]"
        style={{ background: VT.surfaceDesk, border: `1px solid ${VT.line}` }}
      >
        <VoucherDeskEmpty />
      </div>
    </div>
    <p style={{ fontSize: 11.5, lineHeight: 1.45, color: VT.muted }}>{FINE_PRINT}</p>
  </div>
);

/* ------------------------------ VC-1 · mobile ----------------------------- */

export const VouchersBodyLayoutMobilePreview = () => (
  <div className="flex flex-col gap-[20px]">
    <VoucherEarningsCard fixture={FIXTURE_EARNINGS} stats={STATS} mobile />
    <List mobile selectedFirst={false} />
    <p style={{ fontSize: 11.5, lineHeight: 1.45, color: VT.muted }}>{FINE_PRINT}</p>
  </div>
);

/* --------------------------- VC-3 · empty state --------------------------- */

const ARCHIVE_ONLY: PositionVoucher[] = [
  {
    id: "vc3-h1",
    code: "OMX3E9Q2",
    faceValue: 10,
    redeemableCapPct: 0.5,
    maxHoldingHours: 72,
    entryPriceMin: 0.2,
    entryPriceMax: 0.8,
    minHoursToSettlement: 6,
    status: "settled",
    payoutMode: "tiered",
    issuedAt: daysAgoAt(12),
    expiresAt: daysAgoAt(5),
    claimedAt: daysAgoAt(11),
    redeemedAt: daysAgoAt(9),
    redeemedAirdropPositionId: "ap-vc3-1",
    redeemedEventId: "ev-vc3-1",
    redeemedOptionId: "op-vc3-1",
    redeemedSide: "long",
    redeemedAirdropStatus: "settled",
    redeemedEventName: "NVDA up or down — last week",
    redeemedOutcomeLabel: "Up",
    redeemedSettledPnl: 4.25,
    redeemedCloseReason: "settled",
    sourceLabel: null,
  },
];

export const VouchersEmptyPreview = () => (
  <div className="flex flex-col gap-[14px]">
    <VouchersListEmpty />
    <VoucherHistoryArchive items={ARCHIVE_ONLY} />
  </div>
);

/* -------------------------- VC-3 · async two states ----------------------- */

export const VouchersAsyncPreview = () => (
  <div className="flex flex-col gap-[16px]">
    <LoadingState label="Loading vouchers…" variant="skeleton" skeletonRows={3} />
    <ErrorState
      title="Couldn't load vouchers"
      description="Something went wrong fetching your vouchers."
      onRetry={() => {}}
    />
  </div>
);

/* ==========================================================================
 * M4b · Ⓒ Redeem picker (VC-9 … VC-12) + Ⓓ Desk & confirm (VC-14 … VC-16)
 *
 * Real production components only. Every "expanded / picked / open" branch is
 * driven by a controlled fixture prop — no synthetic clicks, no runtime fetch.
 * capPct fixture red line: 0.5 (current DB default).
 * ========================================================================== */

const CAP_PCT = 0.5;

const voucherFixture = (o: Partial<PositionVoucher> = {}): PositionVoucher => ({
  id: "vc-desk",
  code: "OMX8F2K1",
  faceValue: 10,
  redeemableCapPct: CAP_PCT,
  maxHoldingHours: 72,
  entryPriceMin: 0.2,
  entryPriceMax: 0.8,
  minHoursToSettlement: 6,
  status: "claimed",
  payoutMode: "tiered",
  issuedAt: daysAgoAt(1),
  expiresAt: daysFromNow(5),
  claimedAt: daysAgoAt(1),
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
  sourceLabel: "World Cup Kickoff",
  ...o,
});

const Cap = ({ children }: { children: React.ReactNode }) => (
  <div
    className="font-display uppercase"
    style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", color: VT.muted }}
  >
    {children}
  </div>
);

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-[16px]">{children}</div>
);

/* ------------------------------ VC-9 · direction -------------------------- */

export const VouchersPickerDirectionPreview = () => {
  const mobile = useIsMobileFrame();
  return (
    <Stack>
      <div className="flex flex-col gap-[8px]">
        <Cap>SideButton · pair form (44px · r11 · price 15/17px)</Cap>
        <div className="grid grid-cols-2 gap-[8px]">
          <SideButton pair mobile={mobile} tone="yes" label="Up" price={0.61} />
          <SideButton pair mobile={mobile} tone="no" label="Down" price={0.39} />
        </div>
        <div className="grid grid-cols-2 gap-[8px]">
          <SideButton pair mobile={mobile} tone="yes" label="Up" price={0.61} picked />
          <SideButton pair mobile={mobile} tone="no" label="Down" price={0.39} disabled />
        </div>
      </div>

      <div className="flex flex-col gap-[8px]">
        <Cap>SideButton · multi-option form (r8 · label swaps to “Picked”)</Cap>
        <div className="grid grid-cols-2 gap-[7px]">
          <SideButton mobile={mobile} tone="yes" label="Yes" price={0.32} />
          <SideButton mobile={mobile} tone="no" label="No" price={0.68} />
        </div>
        <div className="grid grid-cols-2 gap-[7px]">
          <SideButton mobile={mobile} tone="yes" label="Yes" price={0.32} picked />
          <SideButton mobile={mobile} tone="no" label="No" price={0.68} disabled />
        </div>
      </div>

      <div className="flex flex-col gap-[8px]">
        <Cap>SideButton · plain text form (no price)</Cap>
        <div className="flex items-center gap-[8px]">
          <SideButton mobile={mobile} tone="yes" label="Yes" />
          <SideButton mobile={mobile} tone="no" label="No" />
          <SideButton mobile={mobile} tone="yes" label="Yes" picked />
          <SideButton mobile={mobile} tone="no" label="No" disabled />
        </div>
      </div>

      <div className="flex flex-col gap-[8px]">
        <Cap>PickerDirectionPair — complementary market collapses to one pair</Cap>
        <PickerDirectionPair
          mobile={mobile}
          longLabel="Up"
          longPrice={0.61}
          shortLabel="Down"
          shortPrice={0.39}
          pickedLong
        />
      </div>

      <div className="flex flex-col gap-[8px]">
        <Cap>PickerOptionRow — No price is derived: 1 − 0.32 = 68¢</Cap>
        <PickerOptionRow label="Brazil" price={0.32} isBinary={false} mobile={mobile} />
      </div>
    </Stack>
  );
};

/* -------------------------------- VC-10 · fold ---------------------------- */

const FOLD_ROWS = (mobile: boolean, pickedKey: string | null) =>
  [
    { key: "ly", label: "Lamine Yamal", price: 0.44 },
    { key: "mb", label: "Mbappé", price: 0.26 },
    { key: "ha", label: "Haaland", price: 0.18 },
    { key: "be", label: "Bellingham", price: 0.09 },
  ].map((r) => ({
    key: r.key,
    label: r.label,
    price: r.price,
    isBinary: false,
    mobile,
    picked: pickedKey === r.key,
    pickedLong: pickedKey === r.key,
  }));

export const VouchersPickerFoldPreview = () => {
  const mobile = useIsMobileFrame();
  return (
    <Stack>
      <div className="flex flex-col gap-[8px]">
        <Cap>collapsed — 4 options, first two visible, “Show 2 more options”</Cap>
        <EventPickerCard mobile={mobile} name="Ballon d'Or" meta="Sports · settles Oct 27" lines={["futures"]} tail="4 options">
          <MultiOptionRows rows={FOLD_ROWS(mobile, null)} />
        </EventPickerCard>
      </div>
      <div className="flex flex-col gap-[8px]">
        <Cap>picked lives in the folded tail → promoted into the visible pair</Cap>
        <EventPickerCard mobile={mobile} picked name="Ballon d'Or" meta="Sports · settles Oct 27" lines={["futures"]} tail="4 options">
          <MultiOptionRows rows={FOLD_ROWS(mobile, "be")} />
        </EventPickerCard>
      </div>
      <div className="flex flex-col gap-[8px]">
        <Cap>expanded (controlled fixture) — all rows + “Show fewer”</Cap>
        <EventPickerCard mobile={mobile} name="Ballon d'Or" meta="Sports · settles Oct 27" lines={["futures"]} tail="4 options">
          <MultiOptionRows defaultExpanded rows={FOLD_ROWS(mobile, null)} />
        </EventPickerCard>
      </div>
    </Stack>
  );
};

/* ----------------------------- VC-11 · picker states ---------------------- */

export const VouchersPickerStatesPreview = () => {
  const mobile = useIsMobileFrame();
  return (
    <Stack>
      <div className="flex flex-col gap-[8px]">
        <Cap>PickerSearchBar — min-height {mobile ? "44 (mobile)" : "40 (desktop)"}</Cap>
        <PickerSearchBar value="" mobile={mobile} />
      </div>
      <div className="flex flex-col gap-[10px]">
        <Cap>PickerSkeleton — exactly two placeholder cards</Cap>
        <PickerSkeleton />
      </div>
      <div className="flex flex-col gap-[8px]">
        <Cap>PickerEmpty — search miss + Clear filters</Cap>
        <PickerEmpty query="solana" />
      </div>
      <div className="flex flex-col gap-[8px]">
        <Cap>PickerNoEligible — wait state, not a failure</Cap>
        <PickerNoEligible expiresLabel={shortDate(daysFromNow(5))} />
      </div>
      <div className="flex flex-col gap-[8px]">
        <Cap>PickerBlockedReason — inside a dimmed (0.62) card</Cap>
        <EventPickerCard mobile={mobile} eligible={false} name="Fed cuts in September?" meta="Macro · settles Sep 18" lines={["futures"]}>
          <PickerDirectionPair mobile={mobile} longLabel="Yes" longPrice={0.91} shortLabel="No" shortPrice={0.09} dimLong dimShort />
          <PickerBlockedReason>Priced outside the voucher band — pick another option.</PickerBlockedReason>
        </EventPickerCard>
      </div>
    </Stack>
  );
};

/* ------------------------------ VC-12 · chrome ---------------------------- */

const PILLS = ["Crypto", "Sports", "Stocks", "Macro"];

export const VouchersPickerChromePreview = () => {
  const mobile = useIsMobileFrame();
  return (
    <Stack>
      <div className="flex flex-col gap-[8px]">
        <Cap>PickerCaptionRow — closed / open magnifier</Cap>
        <PickerCaptionRow searchOpen={false} onToggleSearch={() => {}} />
        <PickerCaptionRow searchOpen onToggleSearch={() => {}} />
      </div>
      <div className="flex flex-col gap-[8px]">
        <Cap>category pills — {mobile ? "mobile: one horizontal scroll row" : "desktop: wraps"}</Cap>
        <div className={mobile ? "flex gap-[7px] overflow-x-auto scrollbar-hide" : "flex flex-wrap gap-[7px]"}>
          <Chip active onClick={() => {}} mobile={mobile}>All</Chip>
          {PILLS.map((c) => (
            <Chip key={c} active={false} onClick={() => {}} mobile={mobile}>
              {c}
            </Chip>
          ))}
        </div>
      </div>
    </Stack>
  );
};

/* ----------------------------- VC-13 · desk header ------------------------ */

export const VouchersDeskHeaderPreview = () => (
  <Stack>
    <div className="flex flex-col gap-[8px]">
      <Cap>desktop full header · tiered</Cap>
      <div className="overflow-hidden rounded-[16px]" style={{ background: VT.surfaceDesk, border: `1px solid ${VT.line}` }}>
        <VoucherDeskHeader voucher={voucherFixture()} sourceLabel="Starter Rewards" />
      </div>
    </div>
    <div className="flex flex-col gap-[8px]">
      <Cap>desktop full header · instant</Cap>
      <div className="overflow-hidden rounded-[16px]" style={{ background: VT.surfaceDesk, border: `1px solid ${VT.line}` }}>
        <VoucherDeskHeader
          voucher={voucherFixture({ faceValue: 15, payoutMode: "instant" })}
          sourceLabel="World Cup Kickoff"
        />
      </div>
    </div>
    <div className="flex flex-col gap-[8px]">
      <Cap>compact stub · collapsed (56px)</Cap>
      <VoucherDeskHeader voucher={voucherFixture({ payoutMode: "instant" })} sourceLabel="World Cup Kickoff" compact />
    </div>
    <div className="flex flex-col gap-[8px]">
      <Cap>compact stub · expanded terms panel (controlled fixture)</Cap>
      <VoucherDeskHeader
        voucher={voucherFixture({ payoutMode: "instant" })}
        sourceLabel="World Cup Kickoff"
        compact
        stubDefaultOpen
      />
    </div>
  </Stack>
);

/* ------------------------------ VC-14 · metaCells ------------------------- */

export const VouchersMetaCellsPreview = () => (
  <Stack>
    <div className="flex flex-col gap-[8px]">
      <Cap>$10 voucher · entry 61¢ → Size 10 ÷ 0.61 = 16 shares · Max profit 10 × 0.5</Cap>
      <RedeemMetaCells price={0.61} size={10 / 0.61} cap={10 * CAP_PCT} />
    </div>
    <div className="flex flex-col gap-[8px]">
      <Cap>same voucher, cheaper entry 24¢ → Size 42 shares · Max profit UNCHANGED $5.00</Cap>
      <RedeemMetaCells price={0.24} size={10 / 0.24} cap={10 * CAP_PCT} />
    </div>
    <div className="flex flex-col gap-[8px]">
      <Cap>$25 voucher · entry 44¢ → Size 57 shares · Max profit 25 × 0.5 = $12.50</Cap>
      <RedeemMetaCells price={0.44} size={25 / 0.44} cap={25 * CAP_PCT} />
    </div>
  </Stack>
);

/* ----------------------------- VC-15 · summary bar ------------------------ */

const PICKED_PAIR = {
  eventName: "Will ETH close above $4k this week?",
  displayLabel: "Up",
  isBinary: true,
  side: "long" as const,
  price: 0.61,
};

const PICKED_MULTI = {
  eventName: "Ballon d'Or",
  displayLabel: "Lamine Yamal",
  isBinary: false,
  side: "long" as const,
  price: 0.44,
};

export const VouchersSummaryBarPreview = () => (
  <Stack>
    <div className="flex flex-col gap-[8px]">
      <Cap>nothing picked — mobile renders nothing; desktop keeps the prompt card</Cap>
      <RedeemSummaryBar variant="panel" picked={null} faceValue={10} maxHoldingHours={72} maxProfit={5} />
    </div>
    <div className="flex flex-col gap-[8px]">
      <Cap>picked · complementary pair</Cap>
      <RedeemSummaryBar variant="panel" picked={PICKED_PAIR} faceValue={10} maxHoldingHours={72} maxProfit={5} />
    </div>
    <div className="flex flex-col gap-[8px]">
      <Cap>picked · multi-option (event name · option label · side price)</Cap>
      <RedeemSummaryBar variant="panel" picked={PICKED_MULTI} faceValue={25} maxHoldingHours={48} maxProfit={12.5} />
    </div>
    <div className="flex flex-col gap-[8px]">
      <Cap>submitting — “Redeeming…”</Cap>
      <RedeemSummaryBar variant="panel" picked={PICKED_PAIR} faceValue={10} maxHoldingHours={72} maxProfit={5} isRedeeming />
    </div>
  </Stack>
);

/** VC-15 mobile branch: `inline` + mobile renders a fixed bottom bar. */
export const VouchersSummaryBarMobilePreview = () => (
  <div className="relative" style={{ minHeight: 220 }}>
    <p style={{ fontSize: 11, color: VT.ink3, lineHeight: 1.6 }}>
      Mobile `inline`: no bar at all until an outcome is picked; once picked it is fixed to the bottom of the
      viewport above the safe area (the redeem screen has no BottomNav).
    </p>
    <RedeemSummaryBar variant="inline" picked={PICKED_PAIR} faceValue={10} maxHoldingHours={72} maxProfit={5} />
  </div>
);

/* --------------------- VC-16 · desk empty + desk assembly ----------------- */

export const VouchersDeskEmptyPreview = () => (
  <Stack>
    <div className="flex flex-col gap-[8px]">
      <Cap>VoucherDeskEmpty — nothing selected</Cap>
      <div className="overflow-hidden rounded-[16px]" style={{ background: VT.surfaceDesk, border: `1px solid ${VT.line}` }}>
        <VoucherDeskEmpty />
      </div>
    </div>
    <div className="flex flex-col gap-[8px]">
      <Cap>loaded desk — header + caption + picker card + inline summary</Cap>
      <div className="overflow-hidden rounded-[16px]" style={{ background: VT.surfaceDesk, border: `1px solid ${VT.line}` }}>
        <VoucherDeskHeader voucher={voucherFixture()} sourceLabel="Starter Rewards" />
        <div className="px-5 pt-4 pb-4 flex flex-col gap-[12px]">
          <PickerCaptionRow searchOpen={false} onToggleSearch={() => {}} />
          <EventPickerCard
            mobile={false}
            picked
            name="Will ETH close above $4k this week?"
            meta="Crypto · settles in 3 days"
            lines={["futures"]}
          >
            <PickerDirectionPair mobile={false} longLabel="Up" longPrice={0.61} shortLabel="Down" shortPrice={0.39} pickedLong />
          </EventPickerCard>
          <RedeemMetaCells price={0.61} size={10 / 0.61} cap={10 * CAP_PCT} />
        </div>
        <RedeemSummaryBar variant="inline" picked={PICKED_PAIR} faceValue={10} maxHoldingHours={72} maxProfit={5} />
      </div>
    </div>
  </Stack>
);
