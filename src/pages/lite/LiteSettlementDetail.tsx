// ============================================================
// Lite settlement detail (工单 §5). No synthetic chart: when the market has
// no recorded price history we render nothing instead of inventing a curve.
// ============================================================
import { useNavigate, useParams } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { useSettlementDetail } from "@/hooks/useSettlementDetail";
import { liteSideName, boostSuffix } from "@/lib/liteSideName";
import { GREEN, RED, money, signedMoney } from "@/components/portfolio/lite/parts";
import { settledDayLabel } from "@/lib/settleLabel";

const cents = (p: number) => `${Math.round(p * 100)}¢`;

const Row = ({ k, v, color }: { k: string; v: string; color?: string }) => (
  <div
    className="flex items-center justify-between py-3 text-[13px]"
    style={{ borderBottom: "1px solid rgba(28,31,38,.8)" }}
  >
    <span className="text-[#6B7280]">{k}</span>
    <span className="font-mono font-semibold" style={{ color: color ?? "#F2F3F5" }}>
      {v}
    </span>
  </div>
);

export default function LiteSettlementDetail() {
  const { settlementId } = useParams();
  const navigate = useNavigate();
  const { data: s, isLoading } = useSettlementDetail({ settlementId });

  if (isLoading || !s) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader variant="inner" title="Settled" />
        <div className="px-4 py-10 text-center text-[13px] text-[#6B7280]">
          {isLoading ? "Loading…" : "Not found"}
        </div>
        <BottomNav />
      </div>
    );
  }

  const won = s.pnl >= 0;
  const sideWord = liteSideName(s.option);
  const boost = boostSuffix(s.leverage);
  const settledDate = new Date(s.settledAt);
  const payout = s.margin + s.pnl;

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader variant="inner" title={s.event} />

      <div className="px-4 pb-6 pt-6 text-center">
        <div className="text-[13px] text-[#6B7280]" style={{ letterSpacing: "1.2px" }}>
          SETTLED · {settledDayLabel(s.settledAt).toUpperCase()}
        </div>
        <div
          className="mt-1 font-display text-[30px] font-extrabold"
          style={{ color: won ? GREEN : RED }}
        >
          {won ? "Won" : "Lost"} <span className="font-mono">{signedMoney(s.pnl)}</span>
        </div>
      </div>

      <div className="px-4">
        <Row k="Side" v={[sideWord, boost].filter(Boolean).join(" · ")} />
        <Row k="Avg price" v={cents(s.entryPrice)} />
        <Row k="Shares" v={`${Math.round(s.size)}`} />
        <Row
          k="Settled price"
          v={`${money(s.exitPrice)} · ${s.outcomeWon ? `${sideWord} won` : `${sideWord} lost`}`}
        />
        <Row k="Cost" v={money(s.margin)} />
        <Row k="Fees" v={money(s.fee)} />
        <Row k="Payout" v={money(payout)} />
        <Row k="Placed" v={settledDayLabel(s.openedAt)} />
        <Row
          k="Settled"
          v={`${settledDayLabel(s.settledAt)} · ${String(settledDate.getHours()).padStart(2, "0")}:${String(
            settledDate.getMinutes(),
          ).padStart(2, "0")}`}
        />
        {s.closeReason === "auto_close" && (
          <Row k="Closed" v={`Auto-closed at ${cents(s.exitPrice)}`} color={RED} />
        )}
      </div>

      {s.trades.length > 0 && (
        <div className="px-4 pt-6">
          <div
            className="pb-1.5 text-[10px] font-bold text-[#6B7280]"
            style={{ letterSpacing: "1.4px" }}
          >
            ACTIVITY
          </div>
          {s.trades.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2.5 text-[12.5px]"
              style={{ borderBottom: "1px solid rgba(28,31,38,.8)" }}
            >
              <span className="text-[#6B7280]">
                {settledDayLabel(t.time)} · {t.action}
              </span>
              <span className="font-mono text-[#C7CCD4]">
                {money(t.total)} @ {cents(t.price)}
              </span>
            </div>
          ))}
          <div
            className="flex items-center justify-between py-2.5 text-[12.5px]"
            style={{ borderBottom: "1px solid rgba(28,31,38,.8)" }}
          >
            <span className="text-[#6B7280]">
              {settledDayLabel(s.settledAt)} · Settled {sideWord}
            </span>
            <span className="font-mono font-semibold" style={{ color: won ? GREEN : RED }}>
              {signedMoney(s.pnl)}
            </span>
          </div>
        </div>
      )}

      {s.eventId && (
        <div className="px-4 py-7 text-center">
          <button
            type="button"
            onClick={() => navigate(`/event/${s.eventId}`)}
            className="text-[13px] font-semibold text-primary"
          >
            View event ›
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
