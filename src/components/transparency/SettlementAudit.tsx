import { Button } from "@/components/ui/button";
import { DesktopBackLink } from "@/components/ui/desktop-back-link";
import { Loader2, CheckCircle2, Gavel, ExternalLink, ArrowRightLeft, Trophy, Hash } from "lucide-react";
import { useSettlementAudit } from "@/hooks/useSettlementAudit";
import { format } from "date-fns";

interface Props {
  onBack: () => void;
}

export const SettlementAudit = ({ onBack }: Props) => {
  const { step, events, selectedEvent, audit, isLoading, openSelector, selectEvent, reset } = useSettlementAudit();

  /* ── Idle ── */
  if (step === "idle") {
    return (
      <div className="space-y-6">
        <DesktopBackLink onClick={onBack} />
        <div className="trading-card p-6 md:p-8 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
            <Gavel className="w-10 h-10 text-cyan-400" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold">Was the Result Fair?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select a resolved event and verify its on-chain{" "}
              <code className="text-xs bg-muted/50 px-1 rounded">EventResolved</code> record against the external oracle proof to confirm the outcome was not fabricated.
            </p>
          </div>
          <Button onClick={openSelector} className="px-8 gap-2">
            <Gavel className="w-4 h-4" /> Select a Resolved Event
          </Button>
        </div>
      </div>
    );
  }

  /* ── Select ── */
  if (step === "select") {
    return (
      <div className="space-y-6">
        <DesktopBackLink onClick={reset} />
        <div className="trading-card p-5 md:p-6 space-y-4">
          <h3 className="font-semibold">Select a Resolved Event</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading events...
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No resolved events found.</p>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {events.map((ev) => (
                <button key={ev.id} onClick={() => selectEvent(ev)} className="w-full text-left p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate flex-1">{ev.name}</span>
                    <span className="text-[10px] font-medium text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full ml-2">{ev.category}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {ev.settled_at && <span>Settled {format(new Date(ev.settled_at), "MMM d, yyyy")}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Processing ── */
  if (step === "fetching" || step === "verifying") {
    return (
      <div className="space-y-6">
        <DesktopBackLink onClick={reset} />
        <div className="trading-card p-5 md:p-6 space-y-3 animate-fade-in">
          {[
            { key: "fetching", label: "Fetching on-chain EventResolved log..." },
            { key: "verifying", label: "Verifying oracle proof hash..." },
          ].map((s) => {
            const isActive = s.key === step;
            const isDone = s.key === "fetching" && step === "verifying";
            return (
              <div key={s.key} className={`flex items-center gap-3 transition-opacity duration-300 ${!isActive && !isDone ? "opacity-30" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? "bg-cyan-400/20 text-cyan-400" : isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                </div>
                <span className={`text-sm ${isDone ? "text-cyan-400" : isActive ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Result ── */
  if (step === "result" && audit) {
    return (
      <div className="space-y-6">
        <DesktopBackLink onClick={() => { reset(); onBack(); }} />

        <div className="space-y-4 animate-fade-in">
          {/* Verified banner */}
          <div className="rounded-xl bg-cyan-400/10 border border-cyan-400/20 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-cyan-400 shrink-0" />
            <div>
              <h3 className="font-bold text-cyan-400">Settlement Verified ✓</h3>
              <p className="text-xs text-muted-foreground">The winning outcome matches the oracle proof. Result is authentic.</p>
            </div>
          </div>

          {/* Event info */}
          <div className="trading-card p-4 space-y-1">
            <p className="text-sm font-semibold">{audit.event.name}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{audit.event.category}</span>
              {audit.event.settled_at && <span>Settled {format(new Date(audit.event.settled_at), "MMM d, yyyy HH:mm")}</span>}
            </div>
          </div>

          {/* Winning outcome */}
          <div className="trading-card p-4 text-center space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">winningMarketId</p>
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-6 h-6 text-amber-400" />
              <p className="text-2xl font-bold">{audit.winningOutcomeLabel}</p>
            </div>
            <p className="text-xs font-mono text-muted-foreground">Market index: {audit.winningOutcomeId} — settles at $1.00</p>
          </div>

          {/* All outcomes */}
          <div className="trading-card p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">All Outcomes</p>
            {audit.options.map((opt, i) => (
              <div key={opt.id} className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-xs ${opt.is_winner ? "bg-emerald-400/10 border border-emerald-400/20" : "bg-muted/20"}`}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground w-4">{i}</span>
                  <span className={opt.is_winner ? "font-semibold text-emerald-400" : "text-foreground/80"}>{opt.label}</span>
                </div>
                <span className={`font-mono ${opt.is_winner ? "text-emerald-400 font-bold" : "text-muted-foreground"}`}>
                  {opt.is_winner ? "$1.00" : "$0.00"}
                </span>
              </div>
            ))}
          </div>

          {/* Oracle proof */}
          <div className="trading-card p-4 space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Oracle Proof</p>
            </div>
            {[
              { label: "oracleProof", value: `${audit.oracleProof.slice(0, 6)}...${audit.oracleProof.slice(-6)}`, mono: true },
              { label: "sourceName", value: audit.oracleSourceName },
              { label: "txHash", value: `${audit.txHash.slice(0, 6)}...${audit.txHash.slice(-6)}`, mono: true },
              { label: "blockNumber", value: `#${audit.blockNumber.toLocaleString()}` },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/20 text-xs">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={`${row.mono ? "font-mono" : ""} text-foreground/80`}>{row.value}</span>
              </div>
            ))}
            {audit.oracleSourceUrl && (
              <Button variant="ghost" size="sm" className="text-[10px] gap-1 text-muted-foreground w-full mt-2"
                onClick={() => window.open(audit.oracleSourceUrl, "_blank")}
              >
                <ExternalLink className="w-3 h-3" /> View Oracle Source
              </Button>
            )}
          </div>

          {/* Conclusion */}
          <div className="trading-card overflow-hidden border border-cyan-400/30">
            <div className="px-4 py-3 border-b border-border/30 bg-cyan-400/5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-semibold">Conclusion</h4>
            </div>
            <div className="p-5">
              <p className="text-sm leading-relaxed text-foreground/90">
                The on-chain <code className="text-xs bg-muted/50 px-1 rounded">EventResolved</code> record confirms that outcome{" "}
                <span className="font-bold">"{audit.winningOutcomeLabel}"</span> (market index {audit.winningOutcomeId}) was declared the winner.
                The oracle proof hash matches the external data source ({audit.oracleSourceName}),
                confirming this result was not fabricated by the platform. All winning positions settle at $1.00 per contract.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5"
              onClick={() => window.open(`https://basescan.org/tx/${audit.txHash}`, "_blank")}
            >
              <ExternalLink className="w-3.5 h-3.5" /> View on BaseScan
            </Button>
            <Button size="sm" className="flex-1 text-xs gap-1.5" onClick={openSelector}>
              <ArrowRightLeft className="w-3.5 h-3.5" /> Verify Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
