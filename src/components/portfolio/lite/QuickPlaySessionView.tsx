// ============================================================
// Quick Play session detail — PURE presentation (props only), so the page
// and the style guide mount the very same component (CPO 2026-10-29, mock
// claude.ai/artifact/23fURQjk1rc1EyFZo11aP9 v5). Same template as the
// single-position settlement detail: title + "Settled …" stamp + Share /
// Open Quick Play, three cards (Result / Staked / Payout), Details +
// ACTIVITY. The session's calls are the ACTIVITY rows, newest first, thirty
// at a time. Mobile is the frozen settlement-detail stack.
// ============================================================
import { t } from "@/i18n";
import { KpiCard, KpiGrid, GREEN, RED, money, signedMoney } from "./parts";
import { DetailCard, DetailTitleRow, Row } from "./SettlementDetailView";
import { QuickPlayTag } from "./QuickPlayTag";
import { settledDayLabel, settledStampLabel } from "@/lib/settleLabel";
import { ARCADE_SESSION_NOTE, arcadeSessionSpan } from "@/lib/arcade/session";
import type { QuickPlayCallVM, QuickPlaySessionVM } from "@/lib/arcade/quickPlayPortfolio";

export interface QuickPlaySessionActions {
  onBack?: () => void;
  backLabel?: string;
  /** Back to the cabinet. */
  onOpenQuickPlay?: () => void;
  /** The run poster for this session (signed-in only). */
  onShare?: () => void;
  onLoadMore?: () => void;
}

const HAIRLINE = "1px solid rgba(28,31,38,.8)";
const DIM = "#6B7280";

const clock = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const clockS = (iso: string) => `${clock(iso)}:${String(new Date(iso).getSeconds()).padStart(2, "0")}`;
const cents = (p: number) => `${(p * 100).toFixed(1)}¢`;
const stamp = (iso: string) => `${settledDayLabel(iso)} · ${clock(iso)}`;

/* --------------------------- derived copy --------------------------- */

const resultSub = (vm: QuickPlaySessionVM) => {
  if (vm.calls === 0) return "No call went to settlement";
  return `${vm.pnl >= 0 ? "Won" : "Lost"} · ${vm.won} of ${vm.calls} call${vm.calls === 1 ? "" : "s"} right`;
};

const recordLine = (vm: QuickPlaySessionVM) => `${vm.won} won · ${vm.lost} lost`;
const bestRunLine = (vm: QuickPlaySessionVM) => (vm.bestRun >= 2 ? `${vm.bestRun} in a row` : vm.bestRun === 1 ? "1" : "—");
const extrasLine = (vm: QuickPlaySessionVM) =>
  [vm.refunded ? `${vm.refunded} refunded` : "", vm.cancelled ? `${vm.cancelled} cancelled` : ""].filter(Boolean).join(" · ");

/** "16:52:41 · Up · $5 @ 50.9¢" */
const callLeft = (c: QuickPlayCallVM) => `${clockS(c.time)} · ${c.side === "up" ? "Up" : "Down"} · ${money(c.gross)} @ ${cents(c.p)}`;

/** Right side of an ACTIVITY row: the cash result, with a word for the two non-results. */
const callRight = (c: QuickPlayCallVM): { text: string; color: string } => {
  if (c.status === "void") return { text: `${money(0)} · refunded`, color: DIM };
  if (c.status === "cancelled") return { text: `${signedMoney(c.pnl)} · cancelled`, color: DIM };
  return { text: signedMoney(c.pnl), color: c.pnl >= 0 ? GREEN : RED };
};

const FeesSubLine = ({ vm }: { vm: QuickPlaySessionVM }) => (
  <div className="pt-1 text-[11px] text-[#6B7280]">
    Trading fee {money(vm.fees)}
    {vm.commission > 0 ? ` · Winning commission ${money(vm.commission)}` : ""}
  </div>
);

const SessionNote = () => (
  <div className="pt-2 text-[11px] text-[#6B7280]">{ARCADE_SESSION_NOTE}</div>
);

const ActivityRows = ({ vm, actions, size }: { vm: QuickPlaySessionVM; actions?: QuickPlaySessionActions; size: "m" | "d" }) => (
  <>
    {vm.rows.length === 0 ? (
      <div className="py-3 text-[13px] text-[#6B7280]">{vm.loadingMore ? t("common.loading") : "No calls to show"}</div>
    ) : (
      vm.rows.map((c) => {
        const r = callRight(c);
        return (
          <div
            key={c.id}
            className={`flex items-center justify-between ${size === "m" ? "py-2.5 text-[12.5px]" : "py-3 text-[13px]"}`}
            style={{ borderBottom: HAIRLINE }}
          >
            <span className="text-[#6B7280]">{callLeft(c)}</span>
            <span className="font-mono font-semibold" style={{ color: r.color }}>
              {r.text}
            </span>
          </div>
        );
      })
    )}
    {vm.hasMore && (
      <button
        type="button"
        onClick={actions?.onLoadMore}
        disabled={vm.loadingMore}
        className="mt-3 h-9 w-full rounded-[10px] text-[12.5px] font-semibold text-[#F2F3F5] disabled:opacity-50"
        style={{ border: "1px solid #2A2F38" }}
      >
        {vm.loadingMore ? t("common.loading") : "Load more calls"}
      </button>
    )}
  </>
);

/* ------------------------------ mobile ------------------------------ */

export const QuickPlaySessionMobile = ({ vm, actions }: { vm: QuickPlaySessionVM; actions?: QuickPlaySessionActions }) => {
  const won = vm.pnl >= 0;
  const extras = extrasLine(vm);
  return (
    <div className="bg-background">
      <div className="px-4 pb-6 pt-6 text-center">
        <div className="text-[13px] text-[#6B7280]" style={{ letterSpacing: "1.2px" }}>
          SETTLED · {settledDayLabel(vm.lastSettledAt).toUpperCase()}
        </div>
        <div className="mt-1 font-display text-[30px] font-extrabold" style={{ color: won ? GREEN : RED }}>
          {won ? "Won" : "Lost"} <span className="font-mono">{signedMoney(vm.pnl)}</span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-[13px] text-[#C7CCD4]">
          <span>{arcadeSessionSpan(vm.startedAt, vm.endedAt)}</span>
          <QuickPlayTag />
        </div>
      </div>

      <div className="px-4">
        <Row k="Market" v="BTC · 30-second calls" />
        <Row k="Calls" v={`${vm.calls}`} />
        <Row k="Record" v={recordLine(vm)} />
        <Row k="Best run" v={bestRunLine(vm)} />
        {vm.stakeLine && <Row k="Stake" v={vm.stakeLine} />}
        {extras && <Row k="Not settled" v={extras} />}
        <Row k="Staked" v={money(vm.staked)} />
        <Row k="Fees" v={money(vm.fees + vm.commission)} />
        <FeesSubLine vm={vm} />
        <Row k="Payout" v={money(vm.payout)} />
        <Row k="Started" v={stamp(vm.startedAt)} />
        <Row k="Ended" v={stamp(vm.endedAt)} />
        <SessionNote />
      </div>

      <div className="px-4 pt-6">
        <div className="pb-1.5 text-[10px] font-bold text-[#6B7280]" style={{ letterSpacing: "1.4px" }}>
          {t("portfolio.lite.detail.activity")}
        </div>
        <ActivityRows vm={vm} actions={actions} size="m" />
      </div>

      {actions?.onOpenQuickPlay && (
        <div className="px-4 py-7 text-center">
          <button type="button" onClick={actions.onOpenQuickPlay} className="text-[13px] font-semibold text-primary">
            Open Quick Play ›
          </button>
        </div>
      )}
    </div>
  );
};

/* ------------------------------ desktop ------------------------------ */

export const QuickPlaySessionDesktop = ({ vm, actions }: { vm: QuickPlaySessionVM; actions?: QuickPlaySessionActions }) => {
  const won = vm.pnl >= 0;
  const extras = extrasLine(vm);
  return (
    <div className="bg-background">
      <DetailTitleRow
        title={vm.title}
        badge={<QuickPlayTag className="ml-2.5 align-middle" />}
        onViewEvent={actions?.onOpenQuickPlay}
        viewEventLabel="Open Quick Play ›"
        onShare={actions?.onShare}
      />
      <div className="mt-1 text-[12.5px] text-[#6B7280]">Settled {settledStampLabel(vm.lastSettledAt)}</div>

      <div className="mt-4">
        <KpiGrid cols={3}>
          <KpiCard label={t("market.result")} value={signedMoney(vm.pnl)} valueColor={won ? GREEN : RED} sub={resultSub(vm)} />
          <KpiCard label="Staked" value={money(vm.staked)} sub={vm.stakeSub} />
          <KpiCard
            label={t("common.payout")}
            value={money(vm.payout)}
            sub={
              <>
                {vm.payout === 0 ? "nothing returned" : `after ${money(vm.fees + vm.commission)} fees`}
                <FeesSubLine vm={vm} />
              </>
            }
          />
        </KpiGrid>
      </div>

      <div className="mt-3 grid grid-cols-2 items-start gap-3">
        <DetailCard title={t("portfolio.lite.boost.details")}>
          <Row k="Market" v="BTC · 30-second calls" />
          <Row k="Calls" v={`${vm.calls}`} />
          <Row k="Record" v={recordLine(vm)} />
          <Row k="Best run" v={bestRunLine(vm)} />
          {vm.stakeLine && <Row k="Stake" v={vm.stakeLine} />}
          {extras && <Row k="Not settled" v={extras} />}
          <Row k="Started" v={stamp(vm.startedAt)} />
          <Row k="Ended" v={stamp(vm.endedAt)} />
          <SessionNote />
        </DetailCard>

        <DetailCard title={t("portfolio.lite.detail.activity")}>
          <ActivityRows vm={vm} actions={actions} size="d" />
        </DetailCard>
      </div>
    </div>
  );
};
