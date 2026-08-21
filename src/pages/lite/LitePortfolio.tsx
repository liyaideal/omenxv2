// ============================================================
// /portfolio on the Lite surface (2026-08-19 CPO 工单 §3–§6).
// Mobile: brand header → Live/Settled tabs → KPI → voucher hairline →
// Boost/Standard chips → segment list. Desktop: site header + 3 KPI cards +
// gauge bar + grid rows. Pro portfolio is a separate code path.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { BottomNav } from "@/components/BottomNav";
import { useLitePortfolio, type LiteSegment } from "@/hooks/useLitePortfolio";
import {
  PortfolioTabs,
  KpiCard,
  KpiGrid,
  VoucherHairline,
  SegmentChips,
  BoostCheckCard,
  BoostCheckBar,
  VOLT,
  RED,
  GREEN,
  money,
  signedMoney,
} from "@/components/portfolio/lite/parts";
import {
  LiveCard,
  LiveRow,
  LiveRowHeader,
  PendingOrdersRow,
} from "@/components/portfolio/lite/LiveCards";
import { SettledList, SettledRow } from "@/components/portfolio/lite/SettledList";

const EmptyLive = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center gap-3 py-14">
      <p className="text-[13px] text-[#6B7280]">No live calls yet</p>
      <button
        type="button"
        onClick={() => navigate("/events")}
        className="h-10 rounded-[10px] px-4 text-[13px] font-semibold text-[#F2F3F5]"
        style={{ border: "1px solid #2A2F38" }}
      >
        Browse events
      </button>
    </div>
  );
};

export default function LitePortfolio() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "settled" ? "settled" : "live";
  const series = params.get("series");
  const [segment, setSegment] = useState<LiteSegment>("boost");

  const p = useLitePortfolio();

  const setTab = (v: "live" | "settled") => {
    const next = new URLSearchParams(params);
    if (v === "settled") next.set("tab", "settled");
    else next.delete("tab");
    next.delete("series");
    setParams(next, { replace: true });
  };

  // Default segment follows where the user actually has rows.
  useEffect(() => {
    if (p.boostLive.length === 0 && p.standardLive.length > 0) setSegment("standard");
  }, [p.boostLive.length, p.standardLive.length]);

  const gauge = useMemo(
    () => ({
      riskRatio: p.risk.riskRatio,
      equity: p.risk.totalEquity ?? p.risk.totalAssets,
      imTotal: p.risk.imTotal,
      untilAutoClose: Math.max((p.risk.totalEquity ?? p.risk.totalAssets) - p.risk.imTotal, 0),
    }),
    [p.risk],
  );

  const rows = segment === "boost" ? p.boostLive : p.standardLive;
  const seriesItems = series ? p.seriesRows(series) : [];

  /* ------------------------------ blocks ------------------------------ */
  const liveKpiMobile = (
    <KpiGrid cols={2}>
      <KpiCard
        label="COST"
        value={money(p.liveKpi.cost)}
        sub={`${p.liveKpi.count} ${p.liveKpi.count === 1 ? "call" : "calls"}`}
      />
      <KpiCard
        label="NOW WORTH"
        value={money(p.liveKpi.nowWorth)}
        sub={`${signedMoney(p.liveKpi.profit)} · ${p.liveKpi.profit >= 0 ? "+" : ""}${p.liveKpi.profitPercent.toFixed(1)}%`}
        subColor={p.liveKpi.profit >= 0 ? VOLT : RED}
      />
    </KpiGrid>
  );

  const liveKpiDesktop = (
    <KpiGrid cols={3}>
      <KpiCard
        label="COST"
        value={money(p.liveKpi.cost)}
        sub={`${p.liveKpi.count} ${p.liveKpi.count === 1 ? "call" : "calls"}`}
      />
      <KpiCard label="NOW WORTH" value={money(p.liveKpi.nowWorth)} />
      <KpiCard
        label="PROFIT"
        value={signedMoney(p.liveKpi.profit)}
        sub={`${p.liveKpi.profit >= 0 ? "+" : ""}${p.liveKpi.profitPercent.toFixed(1)}%`}
        subColor={p.liveKpi.profit >= 0 ? VOLT : RED}
      />
    </KpiGrid>
  );

  const settledKpiMobile = (
    <KpiGrid cols={2}>
      <KpiCard
        label="WIN RATE"
        value={`${p.settledKpi.winRate}%`}
        sub={`${p.settledKpi.wins} of ${p.settledKpi.total}`}
      />
      <KpiCard
        label="NET PROFIT"
        value={signedMoney(p.settledKpi.net)}
        sub={`${p.settledKpi.total} settled`}
        subColor={p.settledKpi.net >= 0 ? VOLT : RED}
      />
    </KpiGrid>
  );

  const settledKpiDesktop = (
    <KpiGrid cols={3}>
      <KpiCard
        label="WIN RATE"
        value={`${p.settledKpi.winRate}%`}
        sub={`${p.settledKpi.wins} of ${p.settledKpi.total}`}
      />
      <KpiCard
        label="NET PROFIT"
        value={signedMoney(p.settledKpi.net)}
        sub={`${p.settledKpi.total} settled`}
        subColor={p.settledKpi.net >= 0 ? VOLT : RED}
      />
      <KpiCard label="RECORD" value={`${p.settledKpi.wins} – ${p.settledKpi.losses}`} />
    </KpiGrid>
  );

  const seriesView = series && (
    <div className="px-4 pt-4">
      <button
        type="button"
        onClick={() => setTab("settled")}
        className="mb-3 text-[12.5px] text-[#6B7280]"
      >
        ‹ Back to settled
      </button>
      <div className="text-[15px] font-semibold text-[#F2F3F5]">
        {decodeURIComponent(series)}
      </div>
      <div className="mt-3 space-y-0">
        {seriesItems.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between py-3"
            style={{ borderBottom: "1px solid rgba(28,31,38,.8)" }}
          >
            <span className="text-[13px] text-[#C7CCD4]">{s.settledAt}</span>
            <span
              className="font-mono text-[13.5px] font-bold"
              style={{ color: s.pnlValue >= 0 ? GREEN : RED }}
            >
              {signedMoney(s.pnlValue)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const liveBody = (
    <>
      {segment === "boost" && p.boostLive.length > 0 && (
        <div className="px-4 pt-3">
          {isMobile ? <BoostCheckCard data={gauge} /> : <BoostCheckBar data={gauge} />}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyLive />
      ) : isMobile ? (
        <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
          {rows.map((r) => (
            <LiveCard key={r.id} row={r} onCashOut={() => navigate(r.tradePath)} />
          ))}
          {segment === "boost" && <PendingOrdersRow orders={p.pendingOrders} />}
        </div>
      ) : (
        <div className="pb-6 pt-3">
          <LiveRowHeader />
          {rows.map((r) => (
            <LiveRow key={r.id} row={r} onCashOut={() => navigate(r.tradePath)} />
          ))}
          {segment === "boost" && (
            <div className="px-4 pt-3">
              <PendingOrdersRow orders={p.pendingOrders} />
            </div>
          )}
        </div>
      )}
    </>
  );

  const settledBody = series ? seriesView : <SettledList groups={p.monthGroups(segment)} />;

  const content = (
    <>
      <div className="px-4">
        <PortfolioTabs value={tab} onChange={setTab} sticky={isMobile} />
      </div>
      <div className="px-4 pb-1 pt-3.5">
        {tab === "live"
          ? isMobile
            ? liveKpiMobile
            : liveKpiDesktop
          : isMobile
            ? settledKpiMobile
            : settledKpiDesktop}
      </div>
      <div className="pt-3">
        <VoucherHairline count={p.claimableVouchers} />
      </div>
      {!series && (
        <div className="px-4 pt-3">
          <SegmentChips
            value={segment}
            onChange={setSegment}
            boostCount={tab === "live" ? p.boostLive.length : p.settledCounts.boost}
            standardCount={tab === "live" ? p.standardLive.length : p.settledCounts.standard}
          />
        </div>
      )}
      {tab === "live" ? liveBody : settledBody}
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader variant="brand" />
        {content}
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EventsDesktopHeader />
      <div className="mx-auto w-full max-w-[1200px] px-6 py-6">{content}</div>
    </div>
  );
}
