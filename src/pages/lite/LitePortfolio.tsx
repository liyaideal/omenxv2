// ============================================================
// /portfolio on the Lite surface (2026-08-19 CPO 工单 §3–§6).
// Mobile: brand header → Live/Settled tabs → KPI → voucher hairline →
// Boost/Standard chips → segment list. Desktop: site header + 3 KPI cards +
// gauge bar + grid rows. Pro portfolio is a separate code path.
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
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
  money,
  signedMoney,
} from "@/components/portfolio/lite/parts";
import {
  LiveCard,
  LiveRow,
  LiveRowHeader,
  PendingOrdersRow,
} from "@/components/portfolio/lite/LiveCards";
import {
  SelectEntry,
  SelectToolbar,
  BatchActionBar,
  BatchCashOutConfirm,
} from "@/components/portfolio/lite/BatchCashOut";
import { usePositions } from "@/hooks/usePositions";
import { toast } from "sonner";
import { SettledList } from "@/components/portfolio/lite/SettledList";
import {
  SeriesDetailDesktop,
  SeriesDetailMobile,
} from "@/components/portfolio/lite/SeriesDetailView";
import { liteTradePath } from "@/lib/liteTradePath";
import {
  fromState,
  readPortfolioSegment,
  savePortfolioScroll,
  savePortfolioSegment,
  takePortfolioScroll,
} from "@/lib/portfolioReturn";
import { PortfolioErrorBoundary } from "@/components/portfolio/lite/PortfolioErrorBoundary";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";
import {
  LiteManualShareCard,
  type LiteManualShareSnap,
} from "@/components/lite/share/LiteShareFlow";
import { useAuth } from "@/hooks/useAuth";
import type { LiteLiveRow } from "@/hooks/useLitePortfolio";
import { SeoFooter } from "@/components/seo/SeoFooter";
import {
  PortfolioSkeleton,
  PortfolioFetchError,
  KPI_DASH,
  PortfolioEmptyLive as EmptyLive,
} from "@/components/portfolio/lite/PortfolioAsyncStates";


export default function LitePortfolio() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "settled" ? "settled" : "live";
  const series = params.get("series");
  const restoredSegment = useRef<string | null>(readPortfolioSegment());
  const [segment, setSegment] = useState<LiteSegment>(
    restoredSegment.current === "standard" ? "standard" : "boost",
  );

  // Remember the segment so a round-trip into a market comes back the same.
  useEffect(() => {
    savePortfolioSegment(segment);
  }, [segment]);

  const p = useLitePortfolio();
  const { user } = useAuth();
  const { positions, closePosition, refetch } = usePositions();
  const [manualShare, setManualShare] = useState<LiteManualShareSnap | null>(null);

  /* --------------------- batch cash-out selection --------------------- */
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closingLabel, setClosingLabel] = useState<string | null>(null);

  // Live row share — same-source figures, frozen at click time.
  const shareRow = (r: LiteLiveRow) =>
    setManualShare({
      state: "live",
      eventId: r.eventId ?? "",
      eventName: r.eventName,
      sideLine: r.optionName ? `${r.optionName} · ${r.sideWord}` : r.sideWord,
      pnl: r.profit,
      pnlPercent: r.cost > 0 ? (r.profit / r.cost) * 100 : 0,
      leftAmount: r.cost,
      rightAmount: r.nowWorth,
      segment: r.segment,
    });


  const setTab = (v: "live" | "settled") => {
    const next = new URLSearchParams(params);
    if (v === "settled") next.set("tab", "settled");
    else next.delete("tab");
    next.delete("series");
    setParams(next, { replace: true });
  };

  // Default segment follows where the user actually has rows — unless we just
  // restored the reader's previous segment.
  useEffect(() => {
    if (restoredSegment.current) return;
    if (p.boostLive.length === 0 && p.standardLive.length > 0) setSegment("standard");
  }, [p.boostLive.length, p.standardLive.length]);

  // Restore the scroll offset once the lists have data to scroll through.
  const pendingScroll = useRef<number | null>(takePortfolioScroll());
  useEffect(() => {
    if (pendingScroll.current == null || p.isLoading) return;
    const y = pendingScroll.current;
    pendingScroll.current = null;
    // The list keeps growing for a few frames after data lands, and the browser
    // may also apply its own history scroll restoration, so keep re-asserting
    // our offset for a short window.
    let tries = 0;
    const tick = () => {
      window.scrollTo(0, y);
      tries += 1;
      if (tries < 45) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

  }, [p.isLoading]);


  // Legacy links carried the event NAME in ?series=; canonicalise to the
  // stable event id once the events are in.
  useEffect(() => {
    if (!series) return;
    const canonical = p.canonicalSeriesId(series);
    if (canonical && canonical !== series) {
      const next = new URLSearchParams(params);
      next.set("series", canonical);
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, p.settledRows]);


  const gauge = useMemo(
    () => ({
      riskRatio: p.risk.riskRatio,
      equity: p.risk.equity,
      imTotal: p.risk.imTotal,
      untilAutoClose: Math.max(p.risk.equity - p.risk.imTotal, 0),
    }),
    [p.risk],
  );

  const rows = segment === "boost" ? p.boostLive : p.standardLive;

  // Leaving the live tab or switching segments drops the selection.
  useEffect(() => {
    setSelectMode(false);
    setSelected(new Set());
    setConfirmOpen(false);
    setClosingLabel(null);
  }, [tab, segment]);

  const selectedRows = rows.filter((r) => selected.has(r.id));
  const toggleRow = (r: LiteLiveRow) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(r.id)) next.delete(r.id);
      else next.add(r.id);
      return next;
    });

  const closeBatch = async () => {
    const targets = selectedRows;
    let failed = 0;
    for (let i = 0; i < targets.length; i++) {
      setClosingLabel(`Closing ${i + 1} / ${targets.length}…`);
      const idx = positions.findIndex((pos) => pos.id === targets[i].id);
      try {
        await closePosition(targets[i].id, idx);
      } catch {
        failed += 1;
      }
    }
    setClosingLabel(null);
    setConfirmOpen(false);
    setSelectMode(false);
    setSelected(new Set());
    await refetch?.();
    if (failed === 0) {
      toast.success(`Cashed out ${targets.length} ${targets.length === 1 ? "position" : "positions"}`);
    } else if (failed < targets.length) {
      toast.error(`Cashed out ${targets.length - failed} of ${targets.length} — ${failed} failed, still open below`);
    } else {
      toast.error("Couldn't cash out — please try again");
    }
  };



  /* ------------------------------ blocks ------------------------------ */
  // A failed list request renders `—` everywhere a money value would go —
  // never a fake $0.00 zero state.
  const dash = p.isError;
  // First fetch with nothing cached. A background refresh keeps the real body.
  const firstLoad = p.isLoading && !p.hasData && !p.isError;

  const liveKpiMobile = (
    <KpiGrid cols={2}>
      <KpiCard
        label="COST"
        value={dash ? KPI_DASH : money(p.liveKpi.cost)}
        sub={`${p.liveKpi.count} ${p.liveKpi.count === 1 ? "call" : "calls"}`}
      />
      <KpiCard
        label="NOW WORTH"
        value={dash ? KPI_DASH : money(p.liveKpi.nowWorth)}
        sub={`${signedMoney(p.liveKpi.profit)} · ${p.liveKpi.profit >= 0 ? "+" : ""}${p.liveKpi.profitPercent.toFixed(1)}%`}
        subColor={p.liveKpi.profit >= 0 ? VOLT : RED}
      />
    </KpiGrid>
  );

  const liveKpiDesktop = (
    <KpiGrid cols={3}>
      <KpiCard
        label="COST"
        value={dash ? KPI_DASH : money(p.liveKpi.cost)}
        sub={`${p.liveKpi.count} ${p.liveKpi.count === 1 ? "call" : "calls"}`}
      />
      <KpiCard label="NOW WORTH" value={dash ? KPI_DASH : money(p.liveKpi.nowWorth)} />
      <KpiCard
        label="PROFIT"
        value={dash ? KPI_DASH : signedMoney(p.liveKpi.profit)}
        sub={`${p.liveKpi.profit >= 0 ? "+" : ""}${p.liveKpi.profitPercent.toFixed(1)}%`}
        subColor={p.liveKpi.profit >= 0 ? VOLT : RED}
      />
    </KpiGrid>
  );

  const settledKpiMobile = (
    <KpiGrid cols={2}>
      <KpiCard
        label="WIN RATE"
        value={dash ? KPI_DASH : `${p.settledKpi.winRate}%`}
        sub={`${p.settledKpi.wins} of ${p.settledKpi.total}`}
      />
      <KpiCard
        label="NET PROFIT"
        value={dash ? KPI_DASH : signedMoney(p.settledKpi.net)}
        sub={`${p.settledKpi.total} settled`}
        subColor={p.settledKpi.net >= 0 ? VOLT : RED}
      />
    </KpiGrid>
  );

  const settledKpiDesktop = (
    <KpiGrid cols={3}>
      <KpiCard
        label="WIN RATE"
        value={dash ? KPI_DASH : `${p.settledKpi.winRate}%`}
        sub={`${p.settledKpi.wins} of ${p.settledKpi.total}`}
      />
      <KpiCard
        label="NET PROFIT"
        value={dash ? KPI_DASH : signedMoney(p.settledKpi.net)}
        sub={`${p.settledKpi.total} settled`}
        subColor={p.settledKpi.net >= 0 ? VOLT : RED}
      />
      <KpiCard
        label="RECORD"
        value={dash ? KPI_DASH : `${p.settledKpi.wins}W ${p.settledKpi.losses}L`}
        sub="wins · losses"
      />
    </KpiGrid>
  );

  const seriesVm = series ? p.seriesDetail(series) : null;
  const seriesActions = {
    backLabel: "Back to settled",
    onBack: () => setTab("settled"),
    onViewEvent: seriesVm?.eventId
      ? () => {
          // Come back to this series page (not the events list) from the trade page.
          savePortfolioScroll();
          navigate(
            liteTradePath(
              seriesVm.eventId,
              seriesVm.segmentLabel === "Standard" ? "standard" : "boost",
            ),
            fromState(
              `/portfolio?tab=settled&series=${encodeURIComponent(series ?? "")}`,
            ),
          );
        }
      : undefined,
    onOpenRound: (id: string) =>
      navigate(
        `/portfolio/settlement/${id}?series=${encodeURIComponent(series ?? "")}`,
      ),
  };

  const seriesView = series && (
    // Mobile body padding comes ONLY from the detail component (16px) so the
    // series page indents identically to the single-position detail page.
    <div className="lg:px-0 pt-4">
      <PortfolioErrorBoundary resetKey={series} onReset={() => setTab("settled")}>
        {seriesVm ? (
          isMobile ? (
            <SeriesDetailMobile vm={seriesVm} actions={seriesActions} />
          ) : (
            <SeriesDetailDesktop vm={seriesVm} actions={seriesActions} />
          )
        ) : (
          <div className="py-14 text-center text-[13px] text-[#6B7280]">Nothing settled yet</div>
        )}
      </PortfolioErrorBoundary>
    </div>
  );


  const liveBody = (
    <>
      {segment === "boost" && p.boostLive.length > 0 && (
        <div className="px-4 lg:px-0 pt-3">
          {isMobile ? <BoostCheckCard data={gauge} /> : <BoostCheckBar data={gauge} />}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyLive />
      ) : (
        <>
          {isMobile ? (
            <div className="flex flex-col gap-2 px-4 lg:px-0 pb-4 pt-3">
              {rows.map((r) => (
                <LiveCard
                  key={r.id}
                  row={r}
                  onCashOut={() => navigate(r.tradePath)}
                  onShare={user ? shareRow : undefined}
                  selectMode={selectMode}
                  selected={selected.has(r.id)}
                  onToggleSelect={toggleRow}
                />
              ))}
              {segment === "boost" && <PendingOrdersRow orders={p.pendingOrders} />}
            </div>
          ) : (
            <div className="pb-6 pt-3">
              <LiveRowHeader selectMode={selectMode} />
              {rows.map((r) => (
                <LiveRow
                  key={r.id}
                  row={r}
                  onCashOut={() => navigate(r.tradePath)}
                  onShare={user ? shareRow : undefined}
                  selectMode={selectMode}
                  selected={selected.has(r.id)}
                  onToggleSelect={toggleRow}
                />
              ))}
              {segment === "boost" && (
                <div className="px-4 lg:px-0 pt-3">
                  <PendingOrdersRow orders={p.pendingOrders} />
                </div>
              )}
            </div>
          )}

          {selectMode && selectedRows.length > 0 && (
            // Spacer matching the fixed BatchActionBar height so the bar never
            // covers the last list row when scrolled to the end.
            <div className="h-[76px]" aria-hidden="true" />
          )}
          {selectMode && (
            <BatchActionBar rows={selectedRows} onCashOut={() => setConfirmOpen(true)} />
          )}
          <BatchCashOutConfirm
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            rows={selectedRows}
            isMobile={!!isMobile}
            closingLabel={closingLabel}
            onConfirm={closeBatch}
          />
        </>
      )}
    </>
  );

  const settledBody = series ? seriesView : <SettledList groups={p.monthGroups(segment)} />;

  const content = (
    <>
      <div className="px-4 lg:px-0">
        <PortfolioTabs value={tab} onChange={setTab} sticky={isMobile} />
      </div>
      {firstLoad ? (
        <PortfolioSkeleton cols={isMobile ? 2 : 3} part="kpi" />
      ) : (
        <div className="px-4 lg:px-0 pb-1 pt-3.5">
          {tab === "live"
            ? isMobile
              ? liveKpiMobile
              : liveKpiDesktop
            : isMobile
              ? settledKpiMobile
              : settledKpiDesktop}
        </div>
      )}
      <div className="pt-3">
        <VoucherHairline count={p.claimableVouchers} />
      </div>
      {!series && (
        <div className="flex items-center justify-between gap-3 px-4 lg:px-0 pt-3">
          <SegmentChips
            value={segment}
            onChange={setSegment}
            boostCount={tab === "live" ? p.boostLive.length : p.settledCounts.boost}
            standardCount={tab === "live" ? p.standardLive.length : p.settledCounts.standard}
          />
          {tab === "live" &&
            rows.length > 0 &&
            (selectMode ? (
              <SelectToolbar
                count={selectedRows.length}
                total={rows.length}
                onSelectAll={() => setSelected(new Set(rows.map((r) => r.id)))}
                onClear={() => setSelected(new Set())}
                onCancel={() => {
                  setSelectMode(false);
                  setSelected(new Set());
                }}
              />
            ) : (
              <SelectEntry onEnter={() => setSelectMode(true)} />
            ))}
        </div>
      )}
      {firstLoad ? (
        <PortfolioSkeleton cols={isMobile ? 2 : 3} part="rows" />
      ) : p.isError ? (
        <PortfolioFetchError onRetry={p.refetchLists} />
      ) : tab === "live" ? (
        liveBody
      ) : (
        settledBody
      )}
      <LiteManualShareCard snap={manualShare} onClose={() => setManualShare(null)} />
    </>
  );

  if (isMobile) {
    // A selected series is its OWN page on mobile: inner header + detail body.
    // No brand header, no tabs, no settled KPI, no segment chips.
    if (series) {
      // react-router already decoded the param — never decode twice.
      const name = seriesVm?.seriesName ?? series;

      return (
        <div className="min-h-screen bg-background pb-24">
          <MobileHeader
            variant="inner"
            title={name.length > 24 ? `${name.slice(0, 24)}…` : name}
            showBack
            backTo="/portfolio?tab=settled"
          />
          <LiteAuthGate>{seriesView}</LiteAuthGate>
          <BottomNav />
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MobileHeader variant="brand" />
        <div className="flex-1"><LiteAuthGate>{content}</LiteAuthGate></div>
        <div style={{ marginBottom: "var(--bottom-nav-h, 76px)" }}>
          <SeoFooter />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EventsDesktopHeader />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-6">
        <LiteAuthGate>{content}</LiteAuthGate>
      </div>
      <SeoFooter />
    </div>
  );
}
