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
