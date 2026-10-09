// ============================================================
// /spot?event=crypto-…-5m-… · surface=lite · desktop — the TABLE page.
//
// Chip-on-the-table ordering for 5m/15m crypto rounds. Four rows, one
// deliberate reading order:
//   ① what happened   roads strip (bead plate + big road + counts)
//   ② what's happening stage chart + ladder + countdown
//   ③ decide           UP · chip×Boost tray on the open line · DOWN
//   ④ your result      this round · live · today · Share · Cash out
// Gated by src/lib/tableMode.ts. Classic quick page is untouched.
// Execution: tableTradeService (boosted spot legs). Cash out / share /
// auth reuse the existing Lite flows.
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePositions } from "@/hooks/usePositions";
import { useRealtimePositionsPnL } from "@/hooks/useRealtimePositionsPnL";
import { useUserProfile } from "@/hooks/useUserProfile";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { SeoFooter } from "@/components/seo/SeoFooter";
import { LiteCashOutFlow, type CashOutShareSnapshot } from "@/components/lite/contract/LiteCashOutFlow";
import { LiteCashOutShareCard, LiteManualShareCard, type LiteManualShareSnap } from "@/components/lite/share/LiteShareFlow";
import {
  COINS,
  COIN_META,
  TF_SECONDS,
  derivedPrice,
  downOptionOf,
  parseQuickId,
  seedFromId,
  upOptionOf,
  useQuickRounds,
  useSecondTick,
  type Coin,
  type Timeframe,
} from "@/components/lite/intraday/intradayData";
import { formatPrice, ladderUsesPct } from "@/lib/formatPrice";
import { TABLE_TIMEFRAMES } from "@/lib/tableMode";
import { cashOutTable, placeTableOrder } from "@/services/tableTradeService";
import { CoinSelect } from "@/components/lite/table/CoinSelect";
import { TableLadder } from "@/components/lite/table/TableLadder";
import { TableResult, type ResultHolding } from "@/components/lite/table/TableResult";
import { TableRoads } from "@/components/lite/table/TableRoads";
import { TableSideZone, type ZoneHolding } from "@/components/lite/table/TableSide";
import { TableStage, type StageFlash, type StagePoint } from "@/components/lite/table/TableStage";
import { TableTray } from "@/components/lite/table/TableTray";
import { useTableOrders } from "@/components/lite/table/useTableOrders";
import {
  CHIP_VALUES,
  DEFAULT_BOOST,
  DEFAULT_CHIP,
  DIM,
  HOT,
  LINE,
  utcHHMM,
  type Boost,
  type ChipValue,
  type TableSide,
} from "@/components/lite/table/tableMath";

const KEYFRAMES = `
@keyframes omxBreatheUp{0%,100%{box-shadow:inset 0 0 0 1.5px rgba(51,214,255,.6),0 0 24px rgba(51,214,255,.18)}50%{box-shadow:inset 0 0 0 1.5px rgba(51,214,255,.9),0 0 54px rgba(51,214,255,.42)}}
@keyframes omxBreatheDown{0%,100%{box-shadow:inset 0 0 0 1.5px rgba(207,255,74,.6),0 0 24px rgba(207,255,74,.16)}50%{box-shadow:inset 0 0 0 1.5px rgba(207,255,74,.9),0 0 54px rgba(207,255,74,.38)}}
.omx-breathe-up{animation:omxBreatheUp 2.4s ease-in-out infinite}
.omx-breathe-down{animation:omxBreatheDown 2.4s ease-in-out infinite}
`;

/** Today's settled legs on this table (same event name across rounds). */
const useTableToday = (userId: string | undefined, eventName: string | null, refreshKey: number) => {
  const [rows, setRows] = useState<{ pnl: number; option: string; closedAt: string }[]>([]);
  useEffect(() => {
    if (!userId || !eventName) {
      setRows([]);
      return;
    }
    let alive = true;
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    (async () => {
      const { data } = await supabase
        .from("positions")
        .select("pnl, option_label, closed_at")
        .eq("user_id", userId)
        .eq("event_name", eventName)
        .eq("product_line", "spot")
        .eq("status", "Closed")
        .gte("closed_at", since.toISOString())
        .order("closed_at", { ascending: true })
        .limit(200);
      if (!alive) return;
      setRows((data || []).map((r) => ({ pnl: Number(r.pnl) || 0, option: r.option_label as string, closedAt: r.closed_at as string })));
    })();
    return () => {
      alive = false;
    };
  }, [userId, eventName, refreshKey]);
  return rows;
};

const nearestChip = (v: number): ChipValue =>
  [...CHIP_VALUES].reverse().find((c) => c <= v) ?? CHIP_VALUES[0];

export const LiteQuickTable = ({ eventId }: { eventId: string }) => {
  const navigate = useNavigate();
  const seconds = useSecondTick();
  const { user } = useAuth();
  const { positions, refetch: refetchPositions } = usePositions();
  const { spotBalance, deductSpotBalance, addSpotBalance } = useUserProfile();
  const [refetchTick, setRefetchTick] = useState(0);
  const { currentFor, historyFor, loading } = useQuickRounds(true, refetchTick);

  const parsed = parseQuickId(eventId);
  const coin: Coin = parsed?.coin ?? "btc";
  const tf: Timeframe = parsed?.tf ?? "5m";
  const event = currentFor.get(`${coin}-${tf}`) ?? null;
  const history = (historyFor.get(`${coin}-${tf}`) ?? []) as TableSide[];

  // Auto-rebind to the live round when ours rolls.
  useEffect(() => {
    if (event && event.id !== eventId) navigate(`/spot?event=${encodeURIComponent(event.id)}`, { replace: true });
  }, [event, eventId, navigate]);

  const up = upOptionOf(event);
  const down = downOptionOf(event);
  const upPrice = up ? up.price : 0.5;
  const downPrice = down ? down.price : 0.5;
  const base = event?.base_price ?? null;
  const seed = event ? seedFromId(event.id) : 0;
  const startMs = event?.start_date ? new Date(event.start_date).getTime() : null;
  const endMs = event?.end_date ? new Date(event.end_date).getTime() : null;
  const durationMs = TF_SECONDS[tf] * 1000;
  const now = Date.now();
  const elapsedSec = startMs != null ? Math.max(0, Math.floor((now - startMs) / 1000)) : 0;
  const remainingMs = endMs != null ? endMs - now : 0;
  const settling = remainingMs <= 0;
  const pct = ladderUsesPct(base);

  // Price path since the open (deterministic mock walk, same as Classic).
  const price = derivedPrice(base, upPrice, seed, elapsedSec) ?? base ?? 0;
  const points = useMemo<StagePoint[]>(() => {
    if (base == null) return [];
    const step = Math.max(1, Math.floor(elapsedSec / 240));
    const out: StagePoint[] = [];
    for (let t = 0; t <= elapsedSec; t += step) out.push({ t, p: derivedPrice(base, upPrice, seed, t) ?? base });
    if (out[out.length - 1]?.t !== elapsedSec) out.push({ t: elapsedSec, p: price });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, upPrice, seed, elapsedSec]);
  const deviation = base ? (pct ? ((price - base) / base) * 100 : price - base) : 0;
  const flat = Math.abs(deviation) < (pct ? 0.001 : 0.005);
  const devSide: TableSide | "flat" = flat ? "flat" : deviation > 0 ? "up" : "down";
  const deviationText = flat
    ? "— flat vs open"
    : `${deviation > 0 ? "▲ +" : "▼ −"}${pct ? `${Math.abs(deviation).toFixed(2)}%` : `$${Math.abs(deviation).toFixed(2)}`} ${deviation > 0 ? "above" : "below"} open`;

  useEffect(() => {
    if (settling) setRefetchTick((n) => n + 1);
  }, [settling, event?.id]);

  // ---------- holdings ----------
  const heldIndex = useMemo(() => {
    if (!event) return -1;
    return positions.findIndex((p) => p.productLine === "spot" && typeof p.optionId === "string" && p.optionId.startsWith(`${event.id}-`));
  }, [positions, event]);
  const heldPos = heldIndex >= 0 ? positions[heldIndex] : null;
  const heldSide: TableSide | null = heldPos ? (heldPos.optionId === up?.id ? "up" : "down") : null;
  const { calculateRealtimePnL } = useRealtimePositionsPnL();
  const heldLive = useMemo(() => {
    if (!heldPos) return null;
    const rt = calculateRealtimePnL({
      event: heldPos.event,
      option: heldPos.option,
      optionId: heldPos.optionId,
      type: heldPos.type,
      entryPrice: heldPos.entryPrice,
      size: heldPos.size,
      margin: heldPos.margin,
    });
    const sidePrice = heldSide === "up" ? upPrice : downPrice;
    const pnl = rt.hasRealtimePrice ? rt.pnl : (sidePrice - heldPos.entryPriceNum) * heldPos.sizeNum;
    return { pnl, mark: rt.hasRealtimePrice ? rt.markPrice : sidePrice };
  }, [heldPos, heldSide, upPrice, downPrice, calculateRealtimePnL]);

  // Chips placed this round (session memory for the zone stack).
  const [placedChips, setPlacedChips] = useState<{ round: string; side: TableSide; value: ChipValue; boost: number }[]>([]);
  const roundChips = placedChips.filter((c) => c.round === event?.id);
  const zoneFilled = (side: TableSide) => {
    const mine = roundChips.filter((c) => c.side === side).map(({ value, boost }) => ({ value, boost }));
    if (mine.length || !heldPos || heldSide !== side) return mine;
    return [{ value: nearestChip(heldPos.marginNum), boost: heldPos.leverageNum }];
  };

  const [chip, setChip] = useState<ChipValue>(DEFAULT_CHIP);
  const [boost, setBoost] = useState<Boost>(DEFAULT_BOOST);
  const [over, setOver] = useState<TableSide | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const wanted = useRef<{ side: TableSide; value: ChipValue; boost: Boost } | null>(null);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  const [shareSnap, setShareSnap] = useState<CashOutShareSnapshot | null>(null);
  const [manualShare, setManualShare] = useState<LiteManualShareSnap | null>(null);
  const [flash, setFlash] = useState<StageFlash | null>(null);
  const [roadFresh, setRoadFresh] = useState(false);

  const notify = useCallback((m: string) => toast(m), []);

  const fill = useCallback(
    async (side: TableSide, value: ChipValue, b: Boost, source: "table" | "next") => {
      if (!user || !event || !up || !down) throw new Error("Sign in to place chips");
      const opt = side === "up" ? up : down;
      const p = side === "up" ? upPrice : downPrice;
      const res = await placeTableOrder(user.id, {
        eventName: event.name,
        optionLabel: opt.label,
        optionId: opt.id,
        price: p,
        margin: value,
        boost: b,
      });
      if (res.balanceDelta < 0) await deductSpotBalance(-res.balanceDelta);
      setPlacedChips((c) => [...c, { round: event.id, side, value, boost: b }]);
      refetchPositions();
      const q = res.quote;
      toast.success(
        `${side === "up" ? "Up" : "Down"} · $${value} in${b > 1 ? ` · ${b}× Boost` : ""} → win +$${q.profit.toFixed(0)} if ${COIN_META[coin].ticker} closes ${
          side === "up" ? "above" : "at or below"
        } ${formatPrice(base)}${source === "next" ? " · filled at the open" : ""}`,
      );
    },
    [user, event, up, down, upPrice, downPrice, deductSpotBalance, refetchPositions, coin, base],
  );

  const orders = useTableOrders({
    roundId: event?.id ?? null,
    settling,
    heldSide,
    balance: spotBalance,
    fill,
    notify,
  });

  const tryPlace = useCallback(
    (side: TableSide, value: ChipValue, b: Boost) => {
      if (!user) {
        wanted.current = { side, value, boost: b };
        setAuthOpen(true);
        return;
      }
      orders.place(side, value, b);
    },
    [user, orders],
  );
  // Resume the chip after sign-in.
  useEffect(() => {
    if (user && wanted.current && !authOpen) {
      const w = wanted.current;
      wanted.current = null;
      orders.place(w.side, w.value, w.boost);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authOpen]);

  // ---------- settle flash ----------
  const lastRound = useRef<{ id: string; price: number; base: number; held: ResultHolding | null } | null>(null);
  const todayRows = useTableToday(user?.id, event?.name ?? null, refetchTick + (heldPos ? 1 : 0));
  useEffect(() => {
    if (!event || base == null) return;
    const prev = lastRound.current;
    if (prev && prev.id !== event.id) {
      const res: TableSide = prev.price > prev.base ? "up" : "down";
      const pnl = prev.held ? (prev.held.side === res ? prev.held.profitIfWin : -prev.held.margin) : null;
      setFlash({ side: res, close: prev.price, open: prev.base, pnl, pct: ladderUsesPct(prev.base) });
      setRoadFresh(true);
      const t = setTimeout(() => {
        setFlash(null);
        setRoadFresh(false);
      }, 2600);
      lastRound.current = { id: event.id, price, base, held: null };
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  // ---------- derived view models ----------
  const resultHolding: ResultHolding | null =
    heldPos && heldSide && heldLive
      ? {
          side: heldSide,
          margin: heldPos.marginNum,
          notional: heldPos.marginNum * heldPos.leverageNum,
          shares: heldPos.sizeNum,
          entry: heldPos.entryPriceNum,
          boosts: [...new Set(roundChips.filter((c) => c.side === heldSide).map((c) => c.boost))].length
            ? [...new Set(roundChips.filter((c) => c.side === heldSide).map((c) => c.boost))]
            : [heldPos.leverageNum],
          livePnl: heldLive.pnl,
          currentValue: heldPos.marginNum + heldLive.pnl,
          profitIfWin: heldPos.sizeNum * (1 - heldPos.entryPriceNum),
        }
      : null;
  useEffect(() => {
    if (event && base != null) lastRound.current = { id: event.id, price, base, held: resultHolding };
  });

  const zoneHolding = (side: TableSide): ZoneHolding | null =>
    resultHolding && resultHolding.side === side
      ? { margin: resultHolding.margin, notional: resultHolding.notional, shares: resultHolding.shares, profit: resultHolding.profitIfWin }
      : null;

  const todayNet = todayRows.reduce((a, r) => a + r.pnl, 0);
  const todayWon = todayRows.filter((r) => r.pnl >= 0).length;
  const mine = todayRows.slice(-10).map((r) => ({ won: r.pnl >= 0, side: (/up/i.test(r.option) ? "up" : "down") as TableSide }));

  const coinRows = COINS.map((c) => ({ coin: c, upPrice: upOptionOf(currentFor.get(`${c}-${tf}`) ?? null)?.price ?? null }));
  const switchTo = (c: Coin, t: Timeframe) => {
    const target = currentFor.get(`${c}-${t}`);
    if (target) navigate(`/spot?event=${encodeURIComponent(target.id)}`, { replace: true });
  };

  const handleCashOut = useCallback(
    async (qty: number) => {
      if (!user || !event || !heldPos || !heldLive) throw new Error("Sign in to cash out");
      const res = await cashOutTable(user.id, {
        positionId: heldPos.id,
        eventName: event.name,
        optionLabel: heldPos.option,
        price: heldLive.mark,
        quantity: qty,
      });
      if (res.balanceDelta > 0) await addSpotBalance(res.balanceDelta);
      refetchPositions();
      setRefetchTick((n) => n + 1);
    },
    [user, event, heldPos, heldLive, addSpotBalance, refetchPositions],
  );

  if ((loading && !event) || !event || !up || !down || base == null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ticker = COIN_META[coin].ticker;
  const sideLine = `${resultHolding?.side === "up" ? "Up" : "Down"} · ${tf} round`;

  return (
    <div className="min-h-screen bg-background">
      <style>{KEYFRAMES}</style>
      <EventsDesktopHeader />
      <div
        style={{
          position: "relative",
          height: "calc(100vh - 64px)",
          minHeight: 760,
          minWidth: 1100,
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 140px 420px",
          gridTemplateRows: "64px 132px minmax(0,1fr) 104px",
          color: "#fff",
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          background:
            "radial-gradient(900px 500px at 30% 60%,rgba(51,214,255,.05),transparent 60%),radial-gradient(700px 400px at 85% 70%,rgba(207,255,74,.04),transparent 60%),#0A0A10",
          userSelect: "none",
        }}
      >
        {/* row 1 — question */}
        <div style={{ gridColumn: "1 / 4", display: "flex", alignItems: "center", gap: 18, padding: "0 28px", borderBottom: `1px solid ${LINE}` }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>
            Will {ticker} close above <span className="font-mono">{formatPrice(base)}</span>?
            <span
              title={`Settles Up if the price at the end of the round is above the round open; otherwise Down. Each winning share pays $1, credited the moment the round settles — the next round starts right away. Boost multiplies your position; a lost round costs your margin.`}
              style={{
                display: "inline-flex",
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: `1px solid ${DIM}`,
                color: DIM,
                fontSize: 10,
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 8,
                cursor: "help",
                verticalAlign: "middle",
                fontWeight: 400,
              }}
            >
              i
            </span>
          </h1>
          <span style={{ fontSize: 11, color: DIM, whiteSpace: "nowrap", marginLeft: 4 }}>
            <b className="font-mono" style={{ color: "#9CA3AC", fontWeight: 500 }}>
              {startMs != null && endMs != null ? `${utcHHMM(startMs)}–${utcHHMM(endMs)} UTC` : "—"}
            </b>
            &nbsp;·&nbsp; vol <b className="font-mono" style={{ color: "#9CA3AC", fontWeight: 500 }}>${Math.round(event.volume).toLocaleString()}</b>
          </span>
          <div style={{ marginLeft: "auto" }}>
            <CoinSelect value={coin} rows={coinRows} onChange={(c) => switchTo(c, tf)} />
          </div>
          <div style={{ display: "flex", gap: 2, background: "#111318", border: `1px solid ${LINE}`, borderRadius: 10, padding: 3 }}>
            {TABLE_TIMEFRAMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTo(coin, t)}
                style={{
                  background: t === tf ? HOT : "transparent",
                  border: 0,
                  color: t === tf ? "#1A0B00" : DIM,
                  font: "inherit",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* row 2 — roads */}
        <div style={{ gridColumn: "1 / 4", borderBottom: `1px solid ${LINE}` }}>
          <TableRoads history={history} currentStartMs={startMs} tfMs={durationMs} mine={mine} holding={!!heldPos} net={todayNet} fresh={roadFresh} />
        </div>

        {/* row 3 — stage · ladder · decide */}
        <div style={{ borderRight: `1px solid ${LINE}`, minWidth: 0 }}>
          <TableStage
            points={points}
            open={base}
            durationSec={TF_SECONDS[tf]}
            price={price}
            deviationText={deviationText}
            deviationSide={devSide}
            marketUpPct={Math.round(upPrice * 100)}
            flash={flash}
            onShareWin={
              flash?.pnl != null && flash.pnl > 0
                ? () =>
                    setManualShare({
                      state: "settled",
                      eventId: event.id,
                      eventName: event.name,
                      sideLine: `${flash.side === "up" ? "Up" : "Down"} · ${tf} round`,
                      pnl: flash.pnl,
                      pnlPercent: 0,
                      leftAmount: 0,
                      rightAmount: flash.pnl,
                      segment: "standard",
                    })
                : undefined
            }
          />
        </div>
        <TableLadder open={base} deviation={deviation} pct={pct} roundId={event.id} remainingMs={remainingMs} durationMs={durationMs} endMs={endMs} settling={settling} />
        <div style={{ display: "grid", gridTemplateRows: "minmax(0,1fr) 104px minmax(0,1fr)", minWidth: 0, overflow: "hidden" }}>
          <TableSideZone
            side="up"
            price={upPrice}
            holding={zoneHolding("up")}
            filled={zoneFilled("up")}
            pending={orders.pending.filter((c) => c.side === "up")}
            queued={orders.queued.filter((c) => c.side === "up")}
            lockedBy={orders.activeSide}
            settling={settling}
            over={over === "up"}
            result={flash ? (flash.side === "up" ? "won" : "lost") : null}
            boost={boost}
            onTap={() => tryPlace("up", chip, boost)}
            onCancelPending={orders.cancel}
          />
          <TableTray chip={chip} boost={boost} onChip={setChip} onBoost={setBoost} quotePrice={Math.max(upPrice, downPrice)} onDrop={tryPlace} onDragOver={setOver} />
          <TableSideZone
            side="down"
            price={downPrice}
            holding={zoneHolding("down")}
            filled={zoneFilled("down")}
            pending={orders.pending.filter((c) => c.side === "down")}
            queued={orders.queued.filter((c) => c.side === "down")}
            lockedBy={orders.activeSide}
            settling={settling}
            over={over === "down"}
            result={flash ? (flash.side === "down" ? "won" : "lost") : null}
            boost={boost}
            onTap={() => tryPlace("down", chip, boost)}
            onCancelPending={orders.cancel}
          />
        </div>

        {/* row 4 — result */}
        <div style={{ gridColumn: "1 / 4", borderTop: `1px solid ${LINE}` }}>
          <TableResult
            holding={resultHolding}
            emptyText={orders.queued.length ? "Queued for next round" : orders.pending.length ? "Filling…" : settling ? "Settling" : "Nothing on the table"}
            net={todayNet}
            won={todayWon}
            lost={todayRows.length - todayWon}
            canCashOut={!!heldPos && !settling}
            onCashOut={() => setCashOutOpen(true)}
            onShare={() =>
              resultHolding &&
              setManualShare({
                state: "live",
                eventId: event.id,
                eventName: event.name,
                sideLine,
                pnl: resultHolding.livePnl,
                pnlPercent: resultHolding.margin > 0 ? (resultHolding.livePnl / resultHolding.margin) * 100 : 0,
                leftAmount: resultHolding.margin,
                rightAmount: resultHolding.currentValue,
                segment: "standard",
              })
            }
          />
        </div>
      </div>

      {heldPos && heldLive && resultHolding && (
        <LiteCashOutFlow
          open={cashOutOpen}
          onOpenChange={setCashOutOpen}
          isMobile={false}
          positionId={heldPos.id}
          positionIndex={heldIndex}
          currentValue={resultHolding.currentValue}
          pnlAtPrice={resultHolding.livePnl}
          sizeNum={heldPos.sizeNum}
          sideLabel={heldPos.option}
          shareContext={{
            eventId: event.id,
            eventName: event.name,
            sideLine,
            boost: heldPos.leverageNum,
            putIn: resultHolding.margin,
            productLine: "spot",
          }}
          onShareSnapshot={setShareSnap}
          onConfirmCashOut={handleCashOut}
          onDone={() => setRefetchTick((n) => n + 1)}
        />
      )}
      <LiteCashOutShareCard snap={shareSnap} onClose={() => setShareSnap(null)} />
      <LiteManualShareCard snap={manualShare} onClose={() => setManualShare(null)} />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <SeoFooter />
    </div>
  );
};

export default LiteQuickTable;
