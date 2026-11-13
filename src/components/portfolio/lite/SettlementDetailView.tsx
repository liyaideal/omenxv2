// ============================================================
// Single-position settlement detail — PURE presentation (props only), so the
// page and the style guide mount the very same component.
// Mobile layout is the frozen 2026-08-19 stack; desktop is CPO v1.17 §4b.
// ============================================================
import { t } from "@/i18n";
import type React from "react";
import { Share2 } from "lucide-react";
import { KpiCard, KpiGrid, GREEN, RED, money, signedMoney } from "./parts";

import { settledDayLabel, settledStampLabel } from "@/lib/settleLabel";
import {
  centsLabel,
  eyebrowWord,
  exitRowLabel,
  exitTimeLabel,
  type CloseReason,
} from "@/lib/settlementCopy";

export interface SettlementTradeVM {
  id: string;
  time: string;
  action: string;
  total: number;
  price: number;
  /** Trading fee on this fill — splits the Fees line into buy / sell. */
  fee?: number;
  /** Shares in this fill. When present, the row shows shares × price (the
   *  position value) — `total` is not always the position value on older
   *  order paths (some store what was typed in). */
  qty?: number;
}

export interface SettlementDetailVM {
  eventName: string;
  eventId?: string | null;
  closeReason: CloseReason;
  /** Net result of the position (already net of nothing — pure PnL). */
  net: number;
  cost: number;
  /** Trading fee + winning commission. */
  fees: number;
  /** Trading fee only. */
  tradingFee: number;
  /** Winning commission charged on the profit (0 when the leg lost). */
  winningCommission: number;
  shares: number;
  avgPrice: number;
  exitPrice: number;
  leverage: number;
  sideWord: string;
  /** Event resolved AND this leg is the winning outcome. */
  outcomeWon: boolean;
  openedAt: string;
  closedAt: string;
  trades: SettlementTradeVM[];
}

export interface SettlementDetailActions {
  onBack?: () => void;
  backLabel?: string;
  onViewEvent?: () => void;
  /** Pure-display share entry (SH-b §3.3). */
  onShare?: () => void;
}


const HAIRLINE = "1px solid rgba(28,31,38,.8)";

/**
 * Buy / sell split of the trading fee (CPO 2026-11-13, row ⑥). The buy part
 * is the fee on the opening-side fills, capped at the position's trading fee
 * (fills can span a shared series ledger); the sell part is what is left.
 */
export const feeSplit = (vm: SettlementDetailVM) => {
  const opening = vm.trades.filter((t) => t.action !== "Reduce");
  const known = opening.some((t) => t.fee != null);
  if (!known) return null;
  const buy = Math.min(vm.tradingFee, opening.reduce((s, t) => s + (t.fee ?? 0), 0));
  return { buy, sell: Math.max(0, vm.tradingFee - buy) };
};

/** Breakdown of the Fees row — trading fee always, commission only when charged. */
const FeesSubLine = ({ vm, inRow = false }: { vm: SettlementDetailVM; inRow?: boolean }) => {
  const split = feeSplit(vm);
  const trading =
    split && split.sell >= 0.005
      ? `Trading fee ${money(split.buy)} buy · ${money(split.sell)} sell`
      : `Trading fee ${money(vm.tradingFee)}`;
  return (
    <div className={inRow ? "mt-0.5 text-right text-[11px] font-normal text-[#6B7280]" : "pt-1 text-[11px] text-[#6B7280]"}>
      {trading}
      {vm.winningCommission > 0 ? ` · Winning commission ${money(vm.winningCommission)}` : ""}
    </div>
  );
};

export const Row = ({
  k,
  v,
  color,
  sub,
}: {
  k: string;
  v: string;
  color?: string;
  /** Small second line under the value, inside the row (above its divider). */
  sub?: React.ReactNode;
}) => (
  <div
    className={`flex justify-between border-b border-b-[rgba(28,31,38,.8)] py-3 text-[13px] last:border-b-0 ${
      sub ? "items-start" : "items-center"
    }`}
  >
    <span className="text-[#6B7280]">{k}</span>
    <span className="text-right">
      <span className="block font-mono font-semibold" style={{ color: color ?? "#F2F3F5" }}>
        {v}
      </span>
      {sub}
    </span>
  </div>
);

/* --------------------------- derived copy --------------------------- */

/** vm.net is already net of fees (2026-11-05), so Net = Payout − Cost everywhere. */
export const detailPayout = (vm: SettlementDetailVM) =>
  Math.max(0, vm.cost + vm.net);

const exitValueLine = (vm: SettlementDetailVM) => {
  if (vm.closeReason === "auto_close") return `${centsLabel(vm.exitPrice)} · auto-closed`;
  // Early cash-out carries no remark — the price row states the exit, nothing else.
  if (vm.closeReason === "cashout") return centsLabel(vm.exitPrice);
  return `${money(vm.exitPrice)} · ${vm.outcomeWon ? `${vm.sideWord} won` : `${vm.sideWord} lost`}`;
};

const exitValueColor = (vm: SettlementDetailVM) =>
  vm.closeReason === "auto_close" ? RED : undefined;

const resultSub = (vm: SettlementDetailVM) => {
  const won = vm.net >= 0;
  if (vm.closeReason === "auto_close")
    return { text: `Lost · auto-closed at ${centsLabel(vm.exitPrice)}`, color: RED };
  if (vm.closeReason === "cashout")
    return { text: won ? "Won" : "Lost", color: undefined };
  return {
    text: `${won ? "Won" : "Lost"} · ${vm.sideWord} settled at ${money(vm.exitPrice)}`,
    color: undefined,
  };
};

/** Side shows the side only — the Boost multiple lives on the Position row (CPO 2026-11-13). */
const sideLine = (vm: SettlementDetailVM) => vm.sideWord;

/** Position = what you put in × Boost. Shown only for Boost (> 1×) calls. */
const positionLine = (vm: SettlementDetailVM) =>
  `${money(vm.cost * vm.leverage)} · ${vm.leverage}× Boost`;

const costSub = (vm: SettlementDetailVM) =>
  [
    `${Math.round(vm.shares)} shares @ ${centsLabel(vm.avgPrice)} avg`,
    vm.leverage > 1 ? `${vm.leverage}× Boost` : "",
  ]
    .filter(Boolean)
    .join(" · ");

const activityRows = (vm: SettlementDetailVM) => vm.trades;

/** Position value of one fill: shares × price when known, else the stored total. */
const fillValue = (t: SettlementTradeVM) => (t.qty != null && t.qty > 0 ? t.qty * t.price : t.total);

/** Under a Boost buy: what was put in for it. */
const activitySub = (vm: SettlementDetailVM, t: SettlementTradeVM) =>
  vm.leverage > 1 && t.action !== "Reduce"
    ? `${money(fillValue(t) / vm.leverage)} put in · ${vm.leverage}× Boost`
    : null;

const closingActivityLabel = (vm: SettlementDetailVM) =>
  vm.closeReason === "auto_close"
    ? `Auto-closed at ${centsLabel(vm.exitPrice)}`
    : vm.closeReason === "cashout"
      ? `Cashed out at ${centsLabel(vm.exitPrice)}`
      : `Settled ${vm.sideWord}`;

/* ------------------------------ mobile ------------------------------ */

export const SettlementDetailMobile = ({
  vm,
  actions,
}: {
  vm: SettlementDetailVM;
  actions?: SettlementDetailActions;
}) => {
  const won = vm.net >= 0;
  const closed = new Date(vm.closedAt);
  const payout = detailPayout(vm);

  return (
    <div className="bg-background">
      <div className="px-4 pb-6 pt-6 text-center">
        <div className="text-[13px] text-[#6B7280]" style={{ letterSpacing: "1.2px" }}>
          {eyebrowWord(vm.closeReason)} · {settledDayLabel(vm.closedAt).toUpperCase()}
        </div>
        <div
          className="mt-1 font-display text-[30px] font-extrabold"
          style={{ color: won ? GREEN : RED }}
        >
          {won ? "Won" : "Lost"} <span className="font-mono">{signedMoney(vm.net)}</span>
        </div>
      </div>

      <div className="px-4">
        <Row k="Side" v={sideLine(vm)} />
        <Row k="Avg price" v={centsLabel(vm.avgPrice)} />
        <Row k="Shares" v={`${Math.round(vm.shares)}`} />
        <Row k={exitRowLabel(vm.closeReason)} v={exitValueLine(vm)} color={exitValueColor(vm)} />
        <Row k="Put in" v={money(vm.cost)} />
        {vm.leverage > 1 && <Row k="Position" v={positionLine(vm)} />}
        <Row k="Fees" v={money(vm.fees)} sub={<FeesSubLine vm={vm} inRow />} />
        <Row k="Payout" v={money(payout)} />
        <Row k="Placed" v={settledDayLabel(vm.openedAt)} />
        <Row
          k={exitTimeLabel(vm.closeReason)}
          v={`${settledDayLabel(vm.closedAt)} · ${String(closed.getHours()).padStart(2, "0")}:${String(
            closed.getMinutes(),
          ).padStart(2, "0")}`}
        />
      </div>

      {vm.trades.length > 0 && (
        <div className="px-4 pt-6">
          <div className="pb-1.5 text-[10px] font-bold text-[#6B7280]" style={{ letterSpacing: "1.4px" }}>
            {t("portfolio.lite.detail.activity")}
          </div>
          {activityRows(vm).map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between py-2.5 text-[12.5px]"
              style={{ borderBottom: HAIRLINE }}
            >
              <span className="text-[#6B7280]">
                {settledDayLabel(t.time)} · {t.action}
              </span>
              <span className="text-right">
                <span className="block font-mono text-[#C7CCD4]">
                  {money(fillValue(t))} @ {centsLabel(t.price)}
                </span>
                {activitySub(vm, t) && (
                  <span className="mt-0.5 block text-[11px] text-[#6B7280]">{activitySub(vm, t)}</span>
                )}
              </span>
            </div>
          ))}
          <div
            className="flex items-center justify-between py-2.5 text-[12.5px]"
            style={{ borderBottom: HAIRLINE }}
          >
            <span className="text-[#6B7280]">
              {settledDayLabel(vm.closedAt)} · {closingActivityLabel(vm)}
            </span>
            <span className="font-mono font-semibold" style={{ color: won ? GREEN : RED }}>
              {signedMoney(vm.net)}
            </span>
          </div>
        </div>
      )}

      {actions?.onViewEvent && (
        <div className="px-4 py-7 text-center">
          <button
            type="button"
            onClick={actions.onViewEvent}
            className="text-[13px] font-semibold text-primary"
          >
            View event ›
          </button>
        </div>
      )}
    </div>
  );
};

/* ------------------------------ desktop ------------------------------ */

export const DetailCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-[12px] bg-[#12151A] px-[18px] py-[14px]">
    <div className="pb-1 text-[10px] font-bold text-[#6B7280]" style={{ letterSpacing: "1.4px" }}>
      {title}
    </div>
    <div className="[&>*:last-child]:border-b-0">{children}</div>
  </div>
);


export const DetailTitleRow = ({
  title,
  badge,
  onViewEvent,
  viewEventLabel = "View event ›",
  onShare,
}: {
  title: string;
  /** Sits to the right of the title (the Quick Play tag). */
  badge?: React.ReactNode;
  onViewEvent?: () => void;
  viewEventLabel?: string;
  onShare?: () => void;
}) => (
  <div className="mt-3 flex items-center justify-between gap-4">
    <h1 className="text-[22px] font-bold text-[#F2F3F5]" style={{ letterSpacing: "-0.2px" }}>
      {title}
      {badge}
    </h1>
    <div className="flex shrink-0 items-center gap-3">
      {onShare && (
        <button
          type="button"
          onClick={onShare}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[13px] font-semibold text-foreground hover:bg-muted/50"
        >
          <Share2 className="h-3.5 w-3.5" />
          {t("common.share")}
        </button>
      )}
      {onViewEvent && (
        <button
          type="button"
          onClick={onViewEvent}
          className="shrink-0 text-[13px] font-semibold text-primary"
        >
          {viewEventLabel}
        </button>
      )}
    </div>
  </div>
);


export const SettlementDetailDesktop = ({
  vm,
  actions,
}: {
  vm: SettlementDetailVM;
  actions?: SettlementDetailActions;
}) => {
  const won = vm.net >= 0;
  const payout = detailPayout(vm);
  const sub = resultSub(vm);
  const closed = new Date(vm.closedAt);

  return (
    <div className="bg-background">
      <DetailTitleRow
        title={vm.eventName}
        onViewEvent={actions?.onViewEvent}
        onShare={actions?.onShare}
      />

      <div className="mt-1 text-[12.5px] text-[#6B7280]">
        {vm.closeReason === "settlement" ? "Settled" : "Closed"} {settledStampLabel(vm.closedAt)}
      </div>

      <div className="mt-4">

        <KpiGrid cols={3}>
          <KpiCard
            label={t("market.result")}
            value={signedMoney(vm.net)}
            valueColor={won ? GREEN : RED}
            sub={sub.text}
            subColor={sub.color}
          />
          <KpiCard
            label={t("common.put_in")}
            value={money(vm.cost)}
            sub={
              <>
                {costSub(vm)}
                {vm.leverage > 1 && <div className="pt-1">{money(vm.cost * vm.leverage)} position</div>}
              </>
            }
          />
          <KpiCard
            label={t("common.payout")}
            value={money(payout)}
            sub={
              <>
                {payout === 0 ? "nothing returned" : `after ${money(vm.fees)} fees`}
                <FeesSubLine vm={vm} />
              </>
            }
          />
        </KpiGrid>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <DetailCard title={t("portfolio.lite.boost.details")}>
          <Row k="Side" v={sideLine(vm)} />
          {vm.leverage > 1 && <Row k="Position" v={positionLine(vm)} />}
          <Row k="Avg price" v={centsLabel(vm.avgPrice)} />
          <Row k="Shares" v={`${Math.round(vm.shares)}`} />
          <Row k={exitRowLabel(vm.closeReason)} v={exitValueLine(vm)} color={exitValueColor(vm)} />
          <Row k="Placed" v={settledDayLabel(vm.openedAt)} />
          <Row
            k={exitTimeLabel(vm.closeReason)}
            v={`${settledDayLabel(vm.closedAt)} · ${String(closed.getHours()).padStart(2, "0")}:${String(
              closed.getMinutes(),
            ).padStart(2, "0")}`}
          />
        </DetailCard>

        <DetailCard title={t("portfolio.lite.detail.activity")}>
          {vm.trades.length === 0 ? (
            <div className="py-3 text-[13px] text-[#6B7280]">{t("portfolio.lite.detail.no_fills")}</div>
          ) : (
            <>
              {activityRows(vm).map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between py-3 text-[13px]"
                  style={{ borderBottom: HAIRLINE }}
                >
                  <span className="text-[#6B7280]">
                    {settledDayLabel(t.time)} · {t.action}
                  </span>
                  <span className="text-right">
                    <span className="block font-mono font-semibold text-[#C7CCD4]">
                      {money(fillValue(t))} @ {centsLabel(t.price)}
                    </span>
                    {activitySub(vm, t) && (
                      <span className="mt-0.5 block text-[11px] text-[#6B7280]">{activitySub(vm, t)}</span>
                    )}
                  </span>
                </div>
              ))}
              <div
                className="flex items-center justify-between py-3 text-[13px]"
                style={{ borderBottom: HAIRLINE }}
              >
                <span className="text-[#6B7280]">
                  {settledDayLabel(vm.closedAt)} · {closingActivityLabel(vm)}
                </span>
                <span className="font-mono font-semibold" style={{ color: won ? GREEN : RED }}>
                  {signedMoney(vm.net)}
                </span>
              </div>
            </>
          )}
        </DetailCard>
      </div>
    </div>
  );
};
