// ============================================================
// PriceRefEventInfo — the ONE "Event Info" layout for price-referenced
// events (crypto quick rounds, stock daily up/down) on BOTH Pro terminals.
//
// 研发问题 #18 (2026-09-24) fixed the spot terminal: a single six-cell grid,
// nothing listed twice, no hard-coded Open Interest. When the quick rounds
// moved to the contract rail (2026-10-09) /trade kept the generic
// EventInfoContent block, so the fix had a parallel face it never reached
// (CPO 2026-10-21). Business-layer fields come from useEventBusinessMeta,
// the rail-switch SOP's single source; the rail only changes the wording.
// ============================================================
import { useEffect, useState } from "react";
import { t as tr } from "@/i18n";
import type { EventBusinessMeta } from "@/hooks/useEventBusinessMeta";
import { mock24hVolume } from "@/hooks/useSpotTerminal";
import { money2 } from "@/components/pro/ProSpotPanel";
import { quickRoundLabel } from "@/components/lite/intraday/intradayData";

export interface PriceRefEventInfoProps {
  meta: EventBusinessMeta;
  event: { id: string; name: string; description?: string | null; rules?: string | null; source_name?: string | null };
  /** Live countdown text ("00:13:07") — the host page already ticks it. */
  /** Pre-formatted countdown (desktop owns one clock). When omitted, `endTime` drives a local HH:MM:SS clock (mobile sheet). */
  countdownText?: string;
  endTime?: Date;
  rail: "spot" | "contract";
  /** Spot-only: freeze label for the auto-cancel rule line. */
  freezeLabel?: string | null;
  className?: string;
}

const InfoCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded border border-border/40 bg-muted/20 p-2">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-0.5 text-foreground">{value}</div>
  </div>
);

const exchangeOf = (key: string) => (key === "hk" ? "HKEX" : key === "kr" ? "KRX" : "Nasdaq");

const pad = (n: number) => n.toString().padStart(2, "0");
const fmtLeft = (end: Date) => {
  const d = end.getTime() - Date.now();
  if (d <= 0) return "00:00:00";
  const h = Math.floor(d / 3_600_000);
  const m = Math.floor((d % 3_600_000) / 60_000);
  const s = Math.floor((d % 60_000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};
const useLocalCountdown = (endTime: Date | undefined, enabled: boolean) => {
  const [left, setLeft] = useState(() => (enabled && endTime ? fmtLeft(endTime) : ""));
  useEffect(() => {
    if (!enabled || !endTime) return;
    setLeft(fmtLeft(endTime));
    const id = setInterval(() => setLeft(fmtLeft(endTime)), 1000);
    return () => clearInterval(id);
  }, [endTime, enabled]);
  return left;
};

export const PriceRefEventInfo = ({ meta, event, countdownText: countdownProp, endTime, rail, freezeLabel, className }: PriceRefEventInfoProps) => {
  const localCountdown = useLocalCountdown(endTime, countdownProp === undefined);
  const countdownText = countdownProp ?? localCountdown;
  const isQuick = meta.kind === "quick";
  const roundLabel = quickRoundLabel(event.id);
  const symbolValue = isQuick
    ? `${meta.ticker} · USD${roundLabel ? ` · ${roundLabel} round` : ""}`
    : `${meta.ticker} · ${exchangeOf(meta.market.key)}`;
  const fallbackDescription = isQuick
    ? rail === "contract"
      ? "Crypto quick round (contract). Settles against the round open; margin and Boost apply."
      : "Crypto quick round (spot). Winning share pays $1 at settlement."
    : rail === "contract"
      ? "Stock daily up/down (contract). Settles against the prior official close; margin and Boost apply."
      : "US-stock daily up/down (spot). Winning share pays $1 at settlement.";
  const tradingEnds = meta.schedule.tradingEnds ? `${countdownText} · ${meta.schedule.tradingEnds}` : countdownText;
  const baseLabel = isQuick ? "Round open" : "Prior official close";
  const rules = (event.rules ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className={className ?? "p-6 overflow-auto text-sm space-y-4"}>
      <div>
        <h2 className="text-lg font-bold">{event.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{event.description || fallbackDescription}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <InfoCell label="Trading ends" value={tradingEnds} />
        <InfoCell label={tr("market.volume")} value={mock24hVolume(event.id)} />
        <InfoCell label={baseLabel} value={meta.basePrice != null ? `${meta.cur}${money2(meta.basePrice)}` : "—"} />
        <InfoCell
          label={tr("spot.screen.pro_spot_sections.settles_vs")}
          value={`${isQuick ? "Round open" : "Prior close"} · flat close = ${meta.noLabel}`}
        />
        <InfoCell label={tr("market.event_info_resolution_source")} value={event.source_name || "databento"} />
        <InfoCell label={tr("spot.screen.pro_spot_sections.symbol")} value={symbolValue} />
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="font-semibold text-foreground text-sm">{tr("spot.screen.pro_spot_sections.rules")}</div>
        {rules.length > 0 || meta.settleRule ? (
          <ul className="list-disc pl-4 space-y-1">
            {rules.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
            {rules.length === 0 && meta.settleRule && <li>{meta.settleRule}</li>}
            {rail === "spot" && freezeLabel && (
              <li>All open orders are automatically cancelled and refunded at freeze ({freezeLabel}).</li>
            )}
            {rail === "contract" && (
              <li>Open positions are settled at the {isQuick ? "round end" : "official close"}; resting limit orders are cancelled and their margin refunded.</li>
            )}
          </ul>
        ) : (
          <p className="italic">Rules not yet published for this market.</p>
        )}
      </div>
      {meta.schedule.settle && <div className="text-xs text-muted-foreground">Payout by ~{meta.schedule.settle}.</div>}
    </div>
  );
};
