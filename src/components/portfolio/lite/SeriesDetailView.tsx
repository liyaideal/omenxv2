// ============================================================
// Series settlement detail (CPO v1.17 §4d) — PURE presentation.
// A "series" is 2+ settled rounds of the same recurring event. Numbers are
// reconciled by the caller: Net = Payout − Cost, and the round nets sum to Net.
// ============================================================
import { KpiCard, KpiGrid, GREEN, RED, money, signedMoney } from "./parts";
import { settledDayLabel } from "@/lib/settleLabel";
import { BackLink, DetailCard, DetailTitleRow } from "./SettlementDetailView";

export interface SeriesRoundVM {
  id: string;
  closedAt: string;
  sideWord: string;
  autoClosed: boolean;
  net: number;
}

export interface SeriesDetailVM {
  seriesName: string;
  eventId?: string | null;
  /** "daily" / "weekly" — the rhythm word in copy. */
  cadence: string;
  segmentLabel: "Boost" | "Standard";
  rounds: SeriesRoundVM[];
  cost: number;
  fees: number;
  /** payout = max(0, cost + net − fees) */
  payout: number;
  net: number;
  wins: number;
}

export interface SeriesDetailActions {
  onBack?: () => void;
  backLabel?: string;
  onViewEvent?: () => void;
  onOpenRound?: (roundId: string) => void;
}

const HAIRLINE = "1px solid rgba(28,31,38,.8)";

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between py-3 text-[13px]" style={{ borderBottom: HAIRLINE }}>
    <span className="text-[#6B7280]">{k}</span>
    <span className="font-mono font-semibold text-[#F2F3F5]">{v}</span>
  </div>
);

const RoundRow = ({
  r,
  onClick,
}: {
  r: SeriesRoundVM;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-between py-3 text-left text-[13px] transition-colors hover:bg-[#14171C]"
    style={{ borderBottom: HAIRLINE }}
  >
    <span className="min-w-0 truncate text-[#C7CCD4]">
      {settledDayLabel(r.closedAt)} · {r.sideWord}
      {r.autoClosed && <span style={{ color: RED }}> · auto-closed</span>}
    </span>
    <span className="flex shrink-0 items-center gap-1.5">
      <span className="font-mono font-bold" style={{ color: r.net >= 0 ? GREEN : RED }}>
        {signedMoney(r.net)}
      </span>
      <span className="text-[#6B7280]">›</span>
    </span>
  </button>
);

const firstRound = (vm: SeriesDetailVM) =>
  vm.rounds.length ? settledDayLabel(vm.rounds[vm.rounds.length - 1].closedAt) : "—";
const lastSettled = (vm: SeriesDetailVM) =>
  vm.rounds.length ? settledDayLabel(vm.rounds[0].closedAt) : "—";

/* ------------------------------ mobile ------------------------------ */

export const SeriesDetailMobile = ({
  vm,
  actions,
}: {
  vm: SeriesDetailVM;
  actions?: SeriesDetailActions;
}) => (
  <div className="bg-background">
    <div className="px-4 pb-6 pt-6 text-center">
      <div className="text-[13px] text-[#6B7280]" style={{ letterSpacing: "1.2px" }}>
        SERIES · WON {vm.wins} OF {vm.rounds.length}
      </div>
      <div
        className="mt-1 font-display text-[30px] font-extrabold"
        style={{ color: vm.net >= 0 ? GREEN : RED }}
      >
        Net <span className="font-mono">{signedMoney(vm.net)}</span>
      </div>
    </div>

    <div className="px-4">
      <Row k="Rounds" v={`${vm.rounds.length} · ${vm.cadence}`} />
      <Row k="Cost" v={money(vm.cost)} />
      <Row k="Fees" v={money(vm.fees)} />
      <Row k="Payout" v={money(vm.payout)} />
      <Row k="First round" v={firstRound(vm)} />
      <Row k="Last settled" v={lastSettled(vm)} />
    </div>

    <div className="px-4 pt-6">
      <div className="pb-1.5 text-[10px] font-bold text-[#6B7280]" style={{ letterSpacing: "1.4px" }}>
        ROUNDS
      </div>
      {vm.rounds.map((r) => (
        <RoundRow key={r.id} r={r} onClick={() => actions?.onOpenRound?.(r.id)} />
      ))}
    </div>

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

/* ------------------------------ desktop ------------------------------ */

export const SeriesDetailDesktop = ({
  vm,
  actions,
}: {
  vm: SeriesDetailVM;
  actions?: SeriesDetailActions;
}) => (
  <div className="bg-background">
    <BackLink label={actions?.backLabel ?? "Back to settled"} onClick={actions?.onBack} />
    <DetailTitleRow title={vm.seriesName} onViewEvent={actions?.onViewEvent} />
    <div className="mt-1 text-[12.5px] text-[#6B7280]">
      Series · {vm.cadence} round · last settled {lastSettled(vm)}
    </div>

    <div className="mt-4">
      <KpiGrid cols={3}>
        <KpiCard
          label="NET"
          value={signedMoney(vm.net)}
          valueColor={vm.net >= 0 ? GREEN : RED}
          sub={`won ${vm.wins} of ${vm.rounds.length} rounds`}
        />
        <KpiCard
          label="COST"
          value={money(vm.cost)}
          sub={`${vm.rounds.length} rounds · ${vm.segmentLabel}`}
        />
        <KpiCard label="PAYOUT" value={money(vm.payout)} sub={`after ${money(vm.fees)} fees`} />
      </KpiGrid>
    </div>

    <div className="mt-3 grid grid-cols-2 gap-3">
      <DetailCard title="DETAILS">
        <Row k="Type" v={`Series · ${vm.segmentLabel}`} />
        <Row k="Rounds" v={`${vm.rounds.length} · ${vm.cadence}`} />
        <Row k="First round" v={firstRound(vm)} />
        <Row k="Last settled" v={lastSettled(vm)} />
      </DetailCard>

      <DetailCard title="ROUNDS">
        {vm.rounds.map((r) => (
          <RoundRow key={r.id} r={r} onClick={() => actions?.onOpenRound?.(r.id)} />
        ))}
      </DetailCard>
    </div>
  </div>
);
