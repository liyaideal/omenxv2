// sim-settle-spot — DEMO-STATE settlement engine for Pro spot US-stock events.
//
// Scope: scans events where product_lines contains 'spot' AND
// expected_settlement_time < now() AND lifecycle_status != 'SETTLED'.
//
// Per event:
//   0) Optimistic guard: flip lifecycle_status→'SETTLING' before any cash
//      writes so concurrent workers don't both enter the settle loop for the
//      same event. NOTE: this guard does NOT cover the credit→close window —
//      if the function crashes AFTER `spot_balance += proceeds` but BEFORE
//      the position flips to Closed, a retry re-enters (SETTLING ≠ SETTLED)
//      and credits proceeds a second time. See step 2 comment for details.
//      option updates + position `status='Open'` guard are idempotent.
//   1) event_options: winner final_price=1 is_winner=true; loser final_price=0.
//   2) All open spot positions on the event (matched by option_id OR by
//      option_label as a fallback for legacy rows with NULL option_id):
//      credit spot_balance $1/share for the winning side, $0 for losing side;
//      close the position row (status='Closed', mark_price, pnl, closed_at).
//   3) Insert `transactions` rows (trade_profit / trade_loss, account='spot').
//   4) Cancel all Pending spot orders for the event and refund the reserved
//      notional to spot_balance as a NEUTRAL `platform_credit` transaction
//      (not `trade_profit`, so PnL analytics stay clean). Matching is
//      scoped by event_name AND created_at >= event.start_date to avoid
//      hitting the next day's same-name event.
//   5) Mark event lifecycle_status='SETTLED', is_resolved=true (hard contract),
//      settled_at, winning_option_id, settlement_description.
//
// Winner rule (DEMO-STATE): YES mark price ≥ 0.5 at settlement time → YES wins,
// else NO wins. Production: settlement service compares databento official
// close vs base_price per exchange calendar.
//
// Idempotent: SETTLED events are skipped. Positions already Closed are
// skipped. Per-event failures don't block others.
// Callable manually (POST, empty body) or by sim-daily-seed cron.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EventRow {
  id: string;
  name: string;
  side_labels: { yes?: string; no?: string } | null;
  lifecycle_status: string | null;
  expected_settlement_time: string | null;
  start_date: string | null;
  product_lines: string[];
}

interface OptionRow {
  id: string;
  event_id: string;
  label: string;
  price: number;
}

interface PositionRow {
  id: string;
  user_id: string;
  event_name: string;
  option_id: string | null;
  option_label: string;
  size: number;
  margin: number;
}

interface TradeRow {
  id: string;
  user_id: string;
  event_name: string;
  amount: number;
  side: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();
  const summary: {
    scanned: number;
    settled: number;
    skipped: number;
    errors: Array<{ eventId: string; error: string }>;
  } = { scanned: 0, settled: 0, skipped: 0, errors: [] };

  try {
    const { data: events, error: evErr } = await supabase
      .from("events")
      .select("id, name, side_labels, lifecycle_status, expected_settlement_time, start_date, product_lines")
      .contains("product_lines", ["spot"])
      .lt("expected_settlement_time", now.toISOString())
      .neq("lifecycle_status", "SETTLED");
    if (evErr) throw evErr;

    summary.scanned = events?.length ?? 0;

    for (const ev of (events as EventRow[]) ?? []) {
      try {
        const { data: opts, error: optErr } = await supabase
          .from("event_options")
          .select("id, event_id, label, price")
          .eq("event_id", ev.id);
        if (optErr) throw optErr;
        if (!opts || opts.length !== 2) {
          summary.skipped++;
          continue;
        }

        const yesLabel = ev.side_labels?.yes ?? "Yes";
        const noLabel = ev.side_labels?.no ?? "No";
        const yesOpt = (opts as OptionRow[]).find((o) => o.label === yesLabel) ?? opts[0];
        const noOpt = (opts as OptionRow[]).find((o) => o.label === noLabel) ??
          (opts as OptionRow[]).find((o) => o.id !== yesOpt.id)!;

        const yesWins = Number(yesOpt.price) >= 0.5;
        const winner = yesWins ? yesOpt : noOpt;
        const loser = yesWins ? noOpt : yesOpt;

        // 0) Guard: mark SETTLING before any cash writes. Skip event if the
        // flip fails (another worker likely holds it).
        const { error: guardErr } = await supabase
          .from("events")
          .update({ lifecycle_status: "SETTLING" })
          .eq("id", ev.id)
          .neq("lifecycle_status", "SETTLED");
        if (guardErr) throw guardErr;

        // 1) Backfill NULL option_id on any spot positions for this event
        // (defensive — legacy limit-fill rows may lack it).
        const { error: backfillWinErr } = await supabase
          .from("positions")
          .update({ option_id: winner.id })
          .is("option_id", null)
          .eq("product_line", "spot")
          .eq("status", "Open")
          .eq("event_name", ev.name)
          .eq("option_label", winner.label);
        if (backfillWinErr) throw backfillWinErr;
        const { error: backfillLoseErr } = await supabase
          .from("positions")
          .update({ option_id: loser.id })
          .is("option_id", null)
          .eq("product_line", "spot")
          .eq("status", "Open")
          .eq("event_name", ev.name)
          .eq("option_label", loser.label);
        if (backfillLoseErr) throw backfillLoseErr;

        // 2) Option final prices / winners.
        const { error: winOptErr } = await supabase
          .from("event_options")
          .update({ final_price: 1, is_winner: true })
          .eq("id", winner.id);
        if (winOptErr) throw winOptErr;
        const { error: loseOptErr } = await supabase
          .from("event_options")
          .update({ final_price: 0, is_winner: false })
          .eq("id", loser.id);
        if (loseOptErr) throw loseOptErr;

        // 3) Close spot positions. Match by option_id (primary) OR
        // (event_name+option_label) fallback for any residual NULL rows.
        const { data: positions, error: posErr } = await supabase
          .from("positions")
          .select("id, user_id, event_name, option_id, option_label, size, margin")
          .eq("product_line", "spot")
          .eq("status", "Open")
          .eq("event_name", ev.name)
          .in("option_label", [winner.label, loser.label]);
        if (posErr) throw posErr;

        for (const p of (positions as PositionRow[]) ?? []) {
          // DEMO-STATE (honest): credit → close is TWO independent writes
          // (Postgres RPC transactions are not used here). If the function
          // crashes AFTER `spot_balance += proceeds` but BEFORE the position
          // flips to Closed, the retry re-enters this loop, sees status='Open'
          // again, and credits proceeds a SECOND time — this window is NOT
          // idempotent. The status='Open' guard only protects retries that
          // succeeded in flipping the position. Acceptable in demo/testnet;
          // production must move the credit + close into a single txn (RPC).
          const isWin = p.option_id
            ? p.option_id === winner.id
            : p.option_label === winner.label;
          const proceeds = isWin ? Number(p.size) : 0;
          const margin = Number(p.margin);
          const profit = proceeds - margin;

          if (proceeds > 0) {
            const { data: prof, error: profErr } = await supabase
              .from("profiles")
              .select("spot_balance")
              .eq("user_id", p.user_id)
              .maybeSingle();
            if (profErr) throw profErr;
            const newSpot = Number(prof?.spot_balance ?? 0) + proceeds;
            const { error: updBalErr } = await supabase
              .from("profiles")
              .update({ spot_balance: newSpot })
              .eq("user_id", p.user_id);
            if (updBalErr) throw updBalErr;
          }

          const { error: closePosErr } = await supabase
            .from("positions")
            .update({
              status: "Closed",
              closed_at: now.toISOString(),
              mark_price: isWin ? 1 : 0,
              pnl: profit,
            })
            .eq("id", p.id)
            .eq("status", "Open"); // idempotency guard: don't re-close
          if (closePosErr) throw closePosErr;

          const { error: txErr } = await supabase.from("transactions").insert({
            user_id: p.user_id,
            type: profit >= 0 ? "trade_profit" : "trade_loss",
            amount: Math.abs(profit),
            account: "spot",
            description: `Settled: ${p.event_name} · ${p.option_label} · ${isWin ? "Won" : "Lost"}`,
            status: "completed",
          });
          if (txErr) throw txErr;
        }

        // 4) Cancel & refund Pending spot orders on this event, scoped by
        // start_date so we don't hit the next day's same-name event.
        const startFloor = ev.start_date ?? new Date(now.getTime() - 48 * 3600_000).toISOString();
        const { data: pendings, error: pendErr } = await supabase
          .from("trades")
          .select("id, user_id, event_name, amount, side")
          .eq("product_line", "spot")
          .eq("status", "Pending")
          .eq("event_name", ev.name)
          .gte("created_at", startFloor)
          // 4B follow-up: upper-bounded so a same-name next-day event
          // doesn't sweep new Pending orders opened *after* settlement time.
          .lte("created_at", ev.expected_settlement_time);
        if (pendErr) throw pendErr;

        for (const t of (pendings as TradeRow[]) ?? []) {
          const refund = t.side === "buy" ? Number(t.amount) : 0;
          if (refund > 0) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("spot_balance")
              .eq("user_id", t.user_id)
              .maybeSingle();
            const newSpot = Number(prof?.spot_balance ?? 0) + refund;
            const { error: updBalErr } = await supabase
              .from("profiles")
              .update({ spot_balance: newSpot })
              .eq("user_id", t.user_id);
            if (updBalErr) throw updBalErr;

            // NOTE: platform_credit (neutral) not trade_profit — PnL clean.
            const { error: txErr } = await supabase.from("transactions").insert({
              user_id: t.user_id,
              type: "platform_credit",
              amount: refund,
              account: "spot",
              description: `Refund cancelled order · ${t.event_name} (market settled)`,
              status: "completed",
            });
            if (txErr) throw txErr;
          }
          const { error: cancelErr } = await supabase
            .from("trades")
            .update({ status: "Cancelled", closed_at: now.toISOString() })
            .eq("id", t.id)
            .eq("status", "Pending");
          if (cancelErr) throw cancelErr;
        }

        // 5) Mark event SETTLED + is_resolved (hard contract).
        const { error: settleErr } = await supabase
          .from("events")
          .update({
            lifecycle_status: "SETTLED",
            is_resolved: true,
            settled_at: now.toISOString(),
            winning_option_id: winner.id,
            settlement_description: `${winner.label} wins (mark price ${Number(yesOpt.price).toFixed(2)} at close)`,
          })
          .eq("id", ev.id);
        if (settleErr) throw settleErr;

        summary.settled++;
      } catch (e) {
        console.error("settle event failed", ev.id, e);
        summary.errors.push({ eventId: ev.id, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ success: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sim-settle-spot fatal", e);
    return new Response(JSON.stringify({ error: String(e), ...summary }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
