import { t } from "@/i18n";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePositionVouchers, type PositionVoucher } from "@/hooks/usePositionVouchers";
import { useVoucherDailyPool, formatResetCountdown, useMinuteTick } from "@/hooks/useVoucherDailyPool";
import { VoucherEarningsCard } from "./VoucherEarningsCard";
import { VoucherHistoryArchive } from "./VoucherHistoryArchive";
import { VoucherDeskHeader } from "./VoucherDeskHeader";
import { RedeemVoucherContent } from "./RedeemVoucherContent";
import {
  VoucherRow,
  RowPrimaryButton,
  RowOutlineButton,
  RowStatusWord,
} from "./VoucherRow";
import { VT, formatExpiresIn, shortDate } from "./voucherTokens";
import { LoadingState, ErrorState } from "@/components/states";

const FINE_PRINT =
  "USDC amounts are estimates and not guaranteed. A Trial Position Voucher opens a trial position — the profit is yours, the voucher itself is not withdrawable.";

/**
 * Section head of a voucher bucket ("Ready to claim" / "Active").
 * Named export is a pure lift-out — identical DOM, classes and inline styles.
 */
export const VoucherSectionHead = ({ dot, label, count, tone }: { dot?: boolean; label: string; count: number; tone: "volt" | "neutral" }) => (
  <div className="flex items-center gap-[7px]">
    {dot && <span className="rounded-full" style={{ width: 7, height: 7, background: VT.volt }} />}
    <span className="font-display" style={{ fontSize: 13, fontWeight: 700, color: VT.ink }}>{label}</span>
    <span className="font-display tabular-nums" style={{ fontSize: 12, fontWeight: 700, color: tone === "volt" ? VT.volt : VT.ink2 }}>
      {count}
    </span>
  </div>
);

const SectionHead = VoucherSectionHead;


/**
 * Desk placeholder shown when no voucher is selected. Pure lift-out of the
 * previously inline JSX — identical DOM, classes and inline styles.
 */
export const VoucherDeskEmpty = () => (
  <div style={{ padding: 16 }}>
    <div
      className="flex flex-col items-center justify-center gap-[10px] text-center rounded-[12px]"
      style={{ height: 300, background: VT.surfaceDeep, border: `1px solid ${VT.line}`, padding: "0 40px" }}
    >
      <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: VT.ink }}>
        {t("rewards.screen.voucher_redeem_desk.pick_a_voucher_to_redeem")}
      </span>
      <span style={{ fontSize: 12, color: VT.ink3, lineHeight: 1.6, maxWidth: 360 }}>
        Choose one on the left and the market picker opens here. Your own balance is never used — the voucher
        funds the trial position.
      </span>
    </div>
  </div>
);

/**
 * "No vouchers yet" list empty state (Ready + Active both empty). Pure lift-out
 * of the previously inline JSX — identical DOM, classes and inline styles.
 * History still renders underneath it when archive rows exist.
 */
export const VouchersListEmpty = () => (
  <div
    className="rounded-[12px] flex flex-col items-center gap-[8px] text-center"
    style={{ background: VT.surfaceDeep, border: `1px solid ${VT.line}`, padding: "34px 24px" }}
  >
    <span className="font-display" style={{ fontSize: 14, fontWeight: 700, color: VT.ink }}>{t("common.no_vouchers_yet")}</span>
    <span style={{ fontSize: 11.5, color: VT.ink3, lineHeight: 1.6, maxWidth: 280 }}>
      {t("rewards.screen.vouchers_list.vouchers_you_earn_from_campaigns_and_referrals_land_here_ready_to_open")}
    </span>
  </div>
);


/**
 * Vouchers surface — mounted inside the /rewards "Vouchers" tab.
 * Frozen spec: OmenX Lite Vouchers v2 Final (hero, row family, archive,
 * redeem desk, mobile redeem screen).
 */
export const VouchersBody = () => {
  const isMobile = useIsMobile();
  const { vouchers, grantedVouchers, claimedVouchers, isLoading, isError, refetch, claim } = usePositionVouchers();
  const { byFaceValue } = useVoucherDailyPool();
  useMinuteTick();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const redeemParam = searchParams.get("redeem");
  const mobileRedeeming = !!redeemParam;

  /** Mobile redeem lives in the URL so the page shell + system back both follow it. */
  const openMobileRedeem = (voucherId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "vouchers");
    next.set("redeem", voucherId);
    setSearchParams(next);
  };
  const closeMobileRedeem = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("redeem");
    setSearchParams(next, { replace: true });
  };

  const handleClaim = async (voucherId: string) => {
    setClaimingId(voucherId);
    await claim(voucherId);
    setClaimingId(null);
  };

  const activeVouchers = claimedVouchers;

  useEffect(() => {
    if (activeVouchers.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (redeemParam && activeVouchers.some((v) => v.id === redeemParam)) {
      if (selectedId !== redeemParam) setSelectedId(redeemParam);
      return;
    }
    if (!selectedId || !activeVouchers.some((v) => v.id === selectedId)) {
      setSelectedId(activeVouchers[0].id);
    }
  }, [activeVouchers, selectedId, redeemParam]);

  const selected = activeVouchers.find((v) => v.id === selectedId) ?? null;

  const history = useMemo(
    () =>
      vouchers.filter(
        (v) =>
          v.status === "redeemed" ||
          v.status === "settled" ||
          v.redeemedAirdropStatus === "settled" ||
          v.status === "expired" ||
          (v.status === "issued" && new Date(v.expiresAt).getTime() <= Date.now()),
      ),
    [vouchers],
  );

  const stats = {
    readyCount: grantedVouchers.length,
    readyValue: grantedVouchers.reduce((s, v) => s + v.faceValue, 0),
    activeCount: activeVouchers.length,
    activeValue: activeVouchers.reduce((s, v) => s + v.faceValue, 0),
    redeemedCount: vouchers.filter((v) => !!v.redeemedAt).length,
  };

  const sourceLine = (v: PositionVoucher) =>
    v.sourceLabel ? `From ${v.sourceLabel}` : `Trial Position Voucher · ${v.code}`;

  /* ------------------------------ ready rows ------------------------------ */
  const grantedRow = (v: PositionVoucher) => {
    const pool = byFaceValue(v.faceValue);
    const soldOut = !!pool && pool.remaining <= 0;
    const busy = claimingId === v.id;
    return (
      <VoucherRow
        key={v.id}
        mobile={isMobile}
        faceValue={v.faceValue}
        sourceLine={sourceLine(v)}
        metaLine={
          <>
            Claim by {shortDate(v.expiresAt)}
            {pool && (
              <>
                {" · "}
                {soldOut ? (
                  <span style={{ color: VT.red }}>Sold out today — resets in {formatResetCountdown(pool.resetsAt)}</span>
                ) : (
                  `${pool.remaining}/${pool.totalQuota} left today`
                )}
              </>
            )}
          </>
        }
        action={
          <RowPrimaryButton mobile={isMobile} disabled={soldOut || busy} onClick={() => handleClaim(v.id)}>
            {busy ? "Claiming…" : "Claim"}
          </RowPrimaryButton>
        }
      />
    );
  };

  /* ------------------------------ active rows ----------------------------- */
  const activeRow = (v: PositionVoucher) => {
    const isSelected = !isMobile && v.id === selectedId;
    return (
      <VoucherRow
        key={v.id}
        mobile={isMobile}
        faceValue={v.faceValue}
        sourceLine={sourceLine(v)}
        metaLine={formatExpiresIn(v.expiresAt)}
        instantLine={v.payoutMode === "instant"}
        selected={isSelected}
        action={
          isSelected ? undefined : (
            <RowOutlineButton
              mobile={isMobile}
              onClick={() => {
                setSelectedId(v.id);
                if (isMobile) openMobileRedeem(v.id);
              }}
            >
              {t("common.redeem")}
            </RowOutlineButton>
          )
        }
        readout={isSelected ? <RowStatusWord tone="volt">{t("common.selected")}</RowStatusWord> : undefined}
      />
    );
  };

  /* -------------------------------- states -------------------------------- */
  if (isLoading) return <LoadingState label={t("rewards.screen.voucher_request_state.loading_vouchers")} variant="skeleton" skeletonRows={3} />;
  if (isError)
    return (
      <ErrorState
        title={t("rewards.screen.voucher_request_state.couldnt_load_vouchers")}
        description={t("rewards.screen.voucher_request_state.something_went_wrong_fetching_your_vouchers")}
        onRetry={() => refetch()}
      />
    );

  /* --- mobile: redeem is its own screen; the page shell owns the header --- */
  if (isMobile && mobileRedeeming && selected) {
    return (
      <div className="flex flex-col gap-[12px]" style={{ padding: "12px 16px 0" }}>
        <VoucherDeskHeader voucher={selected} sourceLabel={selected.sourceLabel} compact />
        <RedeemVoucherContent
          voucher={selected}
          variant="inline"
          sourceLabel={selected.sourceLabel}
          onClose={closeMobileRedeem}
        />
      </div>
    );
  }

  /* ---------------------------------- list -------------------------------- */
  const list = (
    <div className="flex flex-col gap-[14px]">
      {grantedVouchers.length > 0 && (
        <>
          <SectionHead dot label={t("rewards.screen.vouchers_list.ready_to_claim")} count={grantedVouchers.length} tone="volt" />
          <div className="flex flex-col gap-[8px]">{grantedVouchers.map(grantedRow)}</div>
        </>
      )}

      {activeVouchers.length > 0 && (
        <>
          <SectionHead label={t("market.status_active")} count={activeVouchers.length} tone="neutral" />
          <div className="flex flex-col gap-[8px]">{activeVouchers.map(activeRow)}</div>
        </>
      )}

      {grantedVouchers.length === 0 && activeVouchers.length === 0 && <VouchersListEmpty />}


      <VoucherHistoryArchive items={history} />
    </div>
  );

  /* ---------------------------------- desk -------------------------------- */
  const desk = (
    <div className="overflow-hidden rounded-[16px]" style={{ background: VT.surfaceDesk, border: `1px solid ${VT.line}` }}>
      {selected ? (
        <>
          <VoucherDeskHeader voucher={selected} sourceLabel={selected.sourceLabel} />
          <RedeemVoucherContent voucher={selected} variant="inline" sourceLabel={selected.sourceLabel} />
        </>
      ) : (
        <VoucherDeskEmpty />

      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-[20px]">
      {/* DATA OPENING — the earnings hero is the opening; no page h1. */}
      <VoucherEarningsCard
        stats={stats}
        mobile={isMobile}
        onRedeemPrompt={
          activeVouchers.length > 0
            ? () => {
                setSelectedId(activeVouchers[0].id);
                if (isMobile) openMobileRedeem(activeVouchers[0].id);
              }
            : undefined
        }
      />

      {isMobile ? (
        list
      ) : (
        <div className="grid gap-[16px] items-start" style={{ gridTemplateColumns: "400px minmax(0,1fr)" }}>
          {list}
          {desk}
        </div>
      )}

      <p style={{ fontSize: 11.5, lineHeight: 1.45, color: VT.muted }}>{FINE_PRINT}</p>
    </div>
  );
};
