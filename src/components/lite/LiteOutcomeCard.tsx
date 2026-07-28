// ============================================================
// Settled-market result card. Shared by the Lite contract page and
// (future) the Lite spot page. Two states: held / not held.
// ============================================================
import { ArrowUpRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LiteOutcomeHolding {
  sideLabel: string;
  isYesSide: boolean;
  boost?: number | null;
  putIn: number;
  paidOut: number;
  profit: number;
}

interface Props {
  settledAt?: string | null;
  winnerLabel: string;
  loserLabel: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  summary?: string | null;
  holding?: LiteOutcomeHolding | null;
  onSeeHow: () => void;
  onBrowse: () => void;
}

const money = (n: number) => `$${Math.abs(n).toFixed(2)}`;

export const LiteOutcomeCard = ({
  settledAt,
  winnerLabel,
  loserLabel,
  sourceName,
  sourceUrl,
  summary,
  holding,
  onSeeHow,
  onBrowse,
}: Props) => {
  const when = settledAt
    ? new Date(settledAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Settled
        </span>
        {when && <span className="font-mono text-[11px] text-muted-foreground">{when}</span>}
      </div>

      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Outcome
      </div>
      <div className="mt-2 space-y-1.5">
        <div
          className="flex items-center justify-between rounded-xl px-3 py-2.5"
          style={{ background: "rgba(51,214,255,.07)" }}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-yes">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yes/20">
              <Check className="h-3 w-3" />
            </span>
            {winnerLabel}
          </span>
          <span className="font-mono text-sm font-semibold text-yes">$1.00</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted/25 px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground/70">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
              <X className="h-3 w-3" />
            </span>
            {loserLabel}
          </span>
          <span className="font-mono text-sm font-semibold text-muted-foreground/70">
            $0.00
          </span>
        </div>
      </div>

      {holding ? (
        <div className="mt-4 border-t border-border pt-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Your result
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                holding.isYesSide ? "bg-yes/14 text-yes" : "bg-no/14 text-no",
              )}
            >
              {holding.sideLabel}
            </span>
            {holding.boost && holding.boost > 1 && (
              <span
                className="rounded-md px-2 py-0.5 font-mono text-[11px] font-bold text-[#0A0B0D]"
                style={{ background: "linear-gradient(120deg,#CFFF4A,#33D6FF)" }}
              >
                {holding.boost}× Boost
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Cell label="You put in" value={money(holding.putIn)} />
            <Cell label="Paid out" value={money(holding.paidOut)} />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Profit
              </div>
              <div className="font-mono text-[19px] font-bold text-no">
                {holding.profit >= 0 ? "+" : "−"}
                {money(holding.profit)}
              </div>
            </div>
          </div>
          {sourceName && (
            <div className="mt-3 text-[11px] text-muted-foreground">
              Settled from {sourceName} ·{" "}
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
                >
                  see evidence <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : (
                <span>see evidence</span>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={onSeeHow}
            className="mt-3 w-full rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            See how it settled →
          </button>
        </div>
      ) : (
        <div className="mt-4 border-t border-border pt-3">
          <div className="rounded-xl border border-dashed border-border p-4 text-center">
            <div className="text-xs font-medium text-foreground">
              You didn't hold this market.
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {summary || `${winnerLabel} was the outcome, paying $1.00 a share.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onBrowse}
            className="mt-3 w-full rounded-xl bg-no py-3 font-display text-sm font-bold text-[#1a2408]"
          >
            Browse live markets →
          </button>
          <button
            type="button"
            onClick={onSeeHow}
            className="mt-2 w-full rounded-xl border border-border py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            See how it settled →
          </button>
        </div>
      )}
    </div>
  );
};

const Cell = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div className="font-mono text-sm font-semibold text-foreground">{value}</div>
  </div>
);

export default LiteOutcomeCard;
