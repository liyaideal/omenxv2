// ============================================================
// /resolved/:eventId (surface=lite) — the Lite settled market detail.
// Single centred reading column. Reuses useResolvedEventDetail unchanged.
// Consumer wording only.
// ============================================================
import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Info, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useResolvedEventDetail } from "@/hooks/useResolvedEventDetail";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { LiteOutcomeCard } from "@/components/lite/LiteOutcomeCard";
import { relTime } from "@/components/lite/contract/LiteMarketActivity";
import { liteSideName } from "@/lib/liteSideName";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  crypto: "Crypto",
  macro: "Macro",
  sports: "Sports",
  politics: "Macro",
  tech: "Tech",
  stocks: "Stocks",
  entertainment: "Entertainment",
  social: "Social",
};

const money = (n: number) => `$${Math.abs(n).toFixed(2)}`;
const lc = (s: string) => s.trim().toLowerCase();
/** DB evidence text can carry the raw negative alias — never show it to Lite users. */
const consumerText = (s: string | null | undefined): string | null =>
  s ? s.replace(/\bNot Up\b/gi, "didn't go up") : null;
const ROW_GRID =
  "grid grid-cols-[minmax(48px,auto)_64px_48px_1fr] items-center gap-x-3";

interface OwnFill {
  id: string;
  optionLabel: string;
  amount: number;
  boost: number;
  createdAt: string;
  pnl: number | null;
  status: string;
}

const useOwnFills = (eventName: string | null) => {
  const { user } = useUserProfile();
  return useQuery({
    queryKey: ["lite-settled-own-fills", eventName, user?.id],
    enabled: !!eventName && !!user,
    queryFn: async (): Promise<OwnFill[]> => {
      const { data } = await supabase
        .from("trades")
        .select("id, option_label, margin, amount, leverage, created_at, pnl, status")
        .eq("user_id", user!.id)
        .eq("event_name", eventName!)
        .order("created_at", { ascending: false });
      return (data || []).map((t) => ({
        id: t.id,
        optionLabel: t.option_label,
        amount: Number(t.margin ?? t.amount) || 0,
        boost: Number(t.leverage) || 1,
        createdAt: t.created_at,
        pnl: t.pnl == null ? null : Number(t.pnl),
        status: t.status,
      }));
    },
  });
};

const LiteSettledEventDetail = () => {
  const { eventId = "" } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const howRef = useRef<HTMLDivElement | null>(null);
  const [finePrintOpen, setFinePrintOpen] = useState(false);

  const { data: detail, isLoading } = useResolvedEventDetail({ eventId });
  const { data: fills = [] } = useOwnFills(detail?.name ?? null);

  // The detail hook only returns settled events. When it comes back empty we
  // check whether the id is a still-live market (vs. an unknown id).
  const { data: liveProbe, isLoading: probing } = useQuery({
    queryKey: ["lite-settled-live-probe", eventId],
    enabled: !!eventId && !isLoading && !detail,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, is_resolved, product_lines")
        .eq("id", eventId)
        .maybeSingle();
      return data ?? null;
    },
  });

  const sides = useMemo(() => {
    if (!detail) return null;
    const alias = lc(detail.sideLabels?.yes ?? "");
    const yesOpt =
      (alias && detail.options.find((o) => lc(o.label) === alias)) ||
      detail.options.find((o) => ["yes", "up"].includes(lc(o.label))) ||
      detail.options[0];
    if (!yesOpt) return null;
    const noOpt = detail.options.find((o) => o.id !== yesOpt.id) || null;
    const nameFor = (raw: string) =>
      lc(raw) === "not up" ? "No — didn't go up" : liteSideName(raw);
    const yesLabel = nameFor(detail.sideLabels?.yes ?? yesOpt.label);
    const noLabel = nameFor(detail.sideLabels?.no ?? noOpt?.label ?? "No");
    const winner =
      detail.options.find((o) => o.is_winner) ||
      detail.options.find((o) => (o.final_price ?? 0) >= 0.5) ||
      yesOpt;
    const winnerIsYes = winner.id === yesOpt.id;
    return {
      yesOpt,
      noOpt,
      yesLabel,
      noLabel,
      winnerIsYes,
      winnerLabel: winnerIsYes ? yesLabel : noLabel,
      loserLabel: winnerIsYes ? noLabel : yesLabel,
    };
  }, [detail]);

  if (isLoading || (!detail && probing)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!detail && liveProbe) {
    const lines = Array.isArray((liveProbe as any).product_lines)
      ? ((liveProbe as any).product_lines as string[])
      : ["futures"];
    const livePath = lines.includes("spot")
      ? `/spot?event=${liveProbe.id}`
      : `/trade?event=${liveProbe.id}`;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <p className="text-sm text-foreground">This market hasn't settled yet.</p>
          <button
            type="button"
            onClick={() => navigate(livePath)}
            className="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0A0B0D]"
          >
            Open the live market →
          </button>
        </div>
      </div>
    );
  }
  if (!detail || !sides) return <ExpiredEventFallback eventId={eventId} />;

  const categoryLabel =
    CATEGORY_LABEL[lc(String(detail.category))] || detail.category;

  const settledWhen = detail.settled_at
    ? new Date(detail.settled_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  // Holding, derived from the user's own fills on this event.
  const holdingFill = fills[0] ?? null;
  const holdingIsYes =
    holdingFill != null && lc(holdingFill.optionLabel) === lc(sides.yesOpt.label);
  const profit = fills.reduce((s, f) => s + (f.pnl ?? 0), 0);
  const putIn = fills.reduce((s, f) => s + f.amount, 0);
  const paidOut = Math.max(putIn + profit, 0);

  const holding = holdingFill
    ? {
        sideLabel: holdingIsYes ? sides.yesLabel : sides.noLabel,
        isYesSide: holdingIsYes,
        boost: holdingFill.boost,
        putIn,
        paidOut,
        profit,
      }
    : null;

  const resultLine = holding
    ? profit > 0
      ? `Called it. Your ${money(putIn)} paid out ${money(paidOut)}.`
      : profit < 0
        ? `Not this one. You backed ${holding.sideLabel} and ${sides.winnerLabel} happened — your ${money(putIn)} settled at $0. Your next call is waiting.`
        : null
    : null;

  const outcomeSentence = (() => {
    const lead = `${sides.winnerLabel} happened.`;
    if (sides.winnerLabel.startsWith("No —")) {
      return `It didn't go up — ${detail.name} closed below the price to beat.`;
    }
    const tail =
      consumerText(detail.settlement_description || detail.description) || "";
    return tail ? `${lead} ${tail}` : lead;
  })();

  const hasEvidence = !!(detail.source_name || detail.settlement_description);

  const scrollToHow = () =>
    howRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <MobileHeader showBack backTo="/resolved" title={categoryLabel} showLogo={false} />
      ) : (
        <EventsDesktopHeader />
      )}

      <div
        className={cn(
          "mx-auto w-full max-w-7xl pb-24",
          isMobile ? "px-4 py-4" : "px-4 py-10 lg:px-6",
        )}
      >
        <div className="mx-auto w-full max-w-2xl space-y-5">
          {/* 1 · Header */}
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {categoryLabel}
            </div>
            <h1
              className="mt-2 font-display font-bold leading-[1.05] tracking-[-0.02em] text-foreground"
              style={{ fontSize: "clamp(24px, 3.5vw, 34px)" }}
            >
              {detail.name}
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              {settledWhen ? `Settled ${settledWhen} · ` : ""}
              This market is closed — winning shares paid $1.00, the rest $0.00.
            </p>
          </div>

          {/* 2 · Hero outcome */}
          <LiteOutcomeCard
            settledAt={detail.settled_at}
            winnerLabel={sides.winnerLabel}
            winnerIsYes={sides.winnerIsYes}
            loserLabel={sides.loserLabel}
            sourceName={detail.source_name}
            sourceUrl={detail.source_url}
            summary={consumerText(detail.settlement_description)}
            holding={holding}
            resultLine={resultLine}
            onSeeHow={scrollToHow}
            onBrowse={() => navigate("/events")}
          />

          {/* 3 · How it settled */}
          <div
            ref={howRef}
            className="scroll-mt-24 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">How it settled</div>
                <p className="mt-1.5 text-xs text-muted-foreground">{outcomeSentence}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {hasEvidence && detail.source_name ? (
                    <>
                      Settled from {detail.source_name} ·{" "}
                      {detail.source_url ? (
                        <a
                          href={detail.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
                        >
                          Official result <ArrowUpRight className="h-3 w-3" />
                        </a>
                      ) : (
                        "Official result"
                      )}
                    </>
                  ) : (
                    "Settled by the OmenX team from the official result."
                  )}
                </p>

                {detail.rules && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setFinePrintOpen((v) => !v)}
                      className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      The fine print
                    </button>
                    {finePrintOpen && (
                      <p className="mt-2 whitespace-pre-line text-[11px] leading-relaxed text-muted-foreground/80">
                        {detail.rules}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4 · Your activity */}
          {fills.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 text-sm font-medium">Your activity</div>
              <ul className="space-y-1.5">
                {fills.map((f) => {
                  const isYes = lc(f.optionLabel) === lc(sides.yesOpt.label);
                  return (
                    <li
                      key={f.id}
                      className={cn(ROW_GRID, "rounded-lg px-2 py-1.5 hover:bg-muted/20")}
                    >
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-center text-[11px] font-semibold",
                          isYes ? "bg-yes/13 text-yes" : "bg-no/13 text-no",
                        )}
                      >
                        {isYes ? sides.yesLabel : sides.noLabel}
                      </span>
                      <span className="text-right font-mono text-xs text-foreground">
                        ${f.amount.toFixed(0)}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-xs",
                          f.boost > 1
                            ? "text-muted-foreground"
                            : "text-muted-foreground/50",
                        )}
                      >
                        {f.boost}×
                      </span>
                      <span className="text-right font-mono text-[11px] text-muted-foreground">
                        {relTime(f.createdAt)}
                      </span>
                    </li>
                  );
                })}
                <li className={cn(ROW_GRID, "rounded-lg bg-muted/20 px-2 py-1.5")}>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-center text-[11px] font-semibold text-muted-foreground">
                    Payout
                  </span>
                  <span
                    className={cn(
                      "text-right font-mono text-xs font-semibold",
                      profit >= 0 ? "text-trading-green" : "text-trading-red",
                    )}
                  >
                    {profit >= 0 ? "+" : "−"}
                    {money(profit)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground/50">—</span>
                  <span className="text-right font-mono text-[11px] text-muted-foreground">
                    settled
                  </span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => navigate("/portfolio/settlements")}
                className="mt-3 text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                See this in your Portfolio →
              </button>
            </div>
          )}

          {/* 5 · CTA */}
          <button
            type="button"
            onClick={() => navigate("/events")}
            className="h-12 w-full rounded-xl bg-white font-display text-sm font-bold text-[#0A0B0D]"
          >
            Find your next market →
          </button>
        </div>
      </div>

      {isMobile && <BottomNav />}
    </div>
  );
};

export default LiteSettledEventDetail;
