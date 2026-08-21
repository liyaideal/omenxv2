// ============================================================
// Single-position settlement detail — PURE presentation (props only), so the
// page and the style guide mount the very same component.
// Mobile layout is the frozen 2026-08-19 stack; desktop is CPO v1.17 §4b.
// ============================================================
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
}

export interface SettlementDetailVM {
  eventName: string;
  eventId?: string | null;
  closeReason: CloseReason;
  /** Net result of the position (already net of nothing — pure PnL). */
  net: number;
  cost: number;
  fees: number;
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
}

const HAIRLINE = "1px solid rgba(28,31,38,.8)";

const Row = ({ k, v, color }: { k: string; v: string; color?: string }) => (
  <div className="flex items-center justify-between py-3 text-[13px] [&:last-child]:border-b-0" style={{ borderBottom: HAIRLINE }}>
    <span className="text-[#6B7280]">{k}</span>
    <span className="font-mono font-semibold" style={{ color: color ?? "#F2F3F5" }}>
      {v}
    </span>
  </div>
);

/* --------------------------- derived copy --------------------------- */

export const detailPayout = (vm: SettlementDetailVM) =>
  Math.max(0, vm.cost + vm.net - vm.fees);

const exitValueLine = (vm: SettlementDetailVM) => {
  if (vm.closeReason === "auto_close") return `${centsLabel(vm.exitPrice)} · auto-closed`;
  if (vm.closeReason === "cashout") return `${centsLabel(vm.exitPrice)} · cashed out early`;
  return `${money(vm.exitPrice)} · ${vm.outcomeWon ? `${vm.sideWord} won` : `${vm.sideWord} lost`}`;
};

const exitValueColor = (vm: SettlementDetailVM) =>
  vm.closeReason === "auto_close" ? RED : undefined;

const resultSub = (vm: SettlementDetailVM) => {
  const won = vm.net >= 0;
  if (vm.closeReason === "auto_close")
    return { text: `Lost · auto-closed at ${centsLabel(vm.exitPrice)}`, color: RED };
  if (vm.closeReason === "cashout")
    return { text: `${won ? "Won" : "Lost"} · cashed out early`, color: undefined };
  return {
    text: `${won ? "Won" : "Lost"} · ${vm.sideWord} settled at ${money(vm.exitPrice)}`,
    color: undefined,
  };
};

const sideLine = (vm: SettlementDetailVM) =>
  [vm.sideWord, vm.leverage > 1 ? `${vm.leverage}× Boost` : ""].filter(Boolean).join(" · ");

const costSub = (vm: SettlementDetailVM) =>
  [
    `${Math.round(vm.shares)} shares @ ${centsLabel(vm.avgPrice)} avg`,
    vm.leverage > 1 ? `${vm.leverage}× Boost` : "",
  ]
    .filter(Boolean)
    .join(" · ");

const activityRows = (vm: SettlementDetailVM) => vm.trades;

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
        <Row k="Cost" v={money(vm.cost)} />
        <Row k="Fees" v={money(vm.fees)} />
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
            ACTIVITY
          </div>
          {activityRows(vm).map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2.5 text-[12.5px]"
              style={{ borderBottom: HAIRLINE }}
            >
              <span className="text-[#6B7280]">
                {settledDayLabel(t.time)} · {t.action}
              </span>
              <span className="font-mono text-[#C7CCD4]">
                {money(t.total)} @ {centsLabel(t.price)}
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

export const BackLink = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <button type="button" onClick={onClick} className="text-[12.5px] text-[#6B7280]">
    ‹ {label}
  </button>
);

export const DetailTitleRow = ({
  title,
  onViewEvent,
}: {
  title: string;
  onViewEvent?: () => void;
}) => (
  <div className="mt-3 flex items-center justify-between gap-4">
    <h1 className="text-[22px] font-bold text-[#F2F3F5]" style={{ letterSpacing: "-0.2px" }}>
      {title}
    </h1>
    {onViewEvent && (
      <button
        type="button"
        onClick={onViewEvent}
        className="shrink-0 text-[13px] font-semibold text-primary"
      >
        View event ›
      </button>
    )}
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
      <BackLink label={actions?.backLabel ?? "Back to settled"} onClick={actions?.onBack} />
      <DetailTitleRow title={vm.eventName} onViewEvent={actions?.onViewEvent} />
      <div className="mt-1 text-[12.5px] text-[#6B7280]">
        {vm.closeReason === "settlement" ? "Settled" : "Closed"} {settledStampLabel(vm.closedAt)}
      </div>

      <div className="mt-4">
        <KpiGrid cols={3}>
          <KpiCard
            label="RESULT"
            value={signedMoney(vm.net)}
            valueColor={won ? GREEN : RED}
            sub={sub.text}
            subColor={sub.color}
          />
          <KpiCard label="COST" value={money(vm.cost)} sub={costSub(vm)} />
          <KpiCard
            label="PAYOUT"
            value={money(payout)}
            sub={payout === 0 ? "nothing returned" : `after ${money(vm.fees)} fees`}
          />
        </KpiGrid>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <DetailCard title="DETAILS">
          <Row k="Side" v={sideLine(vm)} />
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

        <DetailCard title="ACTIVITY">
          {vm.trades.length === 0 ? (
            <div className="py-3 text-[13px] text-[#6B7280]">No fills recorded</div>
          ) : (
            <>
              {activityRows(vm).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 text-[13px]"
                  style={{ borderBottom: HAIRLINE }}
                >
                  <span className="text-[#6B7280]">
                    {settledDayLabel(t.time)} · {t.action}
                  </span>
                  <span className="font-mono font-semibold text-[#C7CCD4]">
                    {money(t.total)} @ {centsLabel(t.price)}
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
