import { useState } from "react";
import { FileSearch, Loader2, CheckCircle2, ExternalLink, Copy, Check, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesktopBackLink } from "@/components/ui/desktop-back-link";
import { useTradeVerification } from "@/hooks/useTradeVerification";
import { ProductLineBadge } from "@/lib/productLineBadge";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
}

export const TradeVerification = ({ onBack }: Props) => {
  const { step, trades, selectedTrade, comparison, isLoadingTrades, openSelector, selectTrade, reset } = useTradeVerification();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Idle
  if (step === "idle") {
    return (
      <div className="space-y-6">
        <DesktopBackLink onClick={onBack} />
        <div className="trading-card p-6 md:p-8 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
            <FileSearch className="w-10 h-10 text-blue-400" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold">Is My Trade Real?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select a recent filled trade and compare its database record against the on-chain <code className="text-xs bg-muted/50 px-1 rounded">TradeLogged</code> event to verify execution integrity.
            </p>
          </div>
          <Button onClick={openSelector} className="px-8 gap-2">
            <FileSearch className="w-4 h-4" /> Select a Trade
          </Button>
        </div>
      </div>
    );
  }

  // Trade selector
  if (step === "select") {
    return (
      <div className="space-y-6">
        <DesktopBackLink onClick={() => reset()} />
        <div className="trading-card p-5 md:p-6 space-y-4">
          <h3 className="font-semibold">Select a Filled Trade</h3>
          {isLoadingTrades ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading trades...
            </div>
          ) : trades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No filled trades found.</p>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {trades.map((t) => {
                const isSpot = t.product_line === "spot";
                const sideText = isSpot
                  ? (t.side === "buy" ? "BUY" : "REDUCE")
                  : (t.side === "buy" ? "YES" : "NO");
                return (
                  <button key={t.id} onClick={() => selectTrade(t)} className="w-full text-left p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-sm font-medium truncate flex-1">{t.event_name}</span>
                      {isSpot && (
                        <ProductLineBadge line="spot" />
                      )}
                      <span className={`text-xs font-semibold ${t.side === "buy" ? "text-emerald-400" : "text-red-400"}`}>{sideText}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{t.option_label}</span>
                      <span>@ {t.price}</span>
                      <span>×{t.quantity}</span>
                      <span className="ml-auto">{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fetching / Comparing / Result
  return (
    <div className="space-y-6">
      <DesktopBackLink onClick={() => { reset(); onBack(); }} />

      <div className="trading-card p-5 md:p-6 space-y-5">
        {/* Progress */}
        {(step === "fetching" || step === "comparing") && (
          <div className="space-y-3 animate-fade-in">
            {[
              { key: "fetching", label: "Fetching on-chain TradeLogged event..." },
              { key: "comparing", label: "Comparing contract fields..." },
            ].map((s, i) => {
              const isActive = s.key === step;
              const isDone = s.key === "fetching" && step === "comparing";
              return (
                <div key={s.key} className={`flex items-center gap-3 transition-opacity duration-300 ${!isActive && !isDone ? "opacity-30" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? "bg-blue-400/20 text-blue-400" : isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <span className={`text-sm ${isDone ? "text-blue-400" : isActive ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Result */}
        {step === "result" && comparison && (
          <div className="animate-fade-in space-y-5">
            {/* Match banner */}
            <div className="rounded-xl bg-blue-400/10 border border-blue-400/20 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-blue-400 shrink-0" />
              <div>
                <h3 className="font-bold text-blue-400">All Fields Match ✓</h3>
                <p className="text-xs text-muted-foreground">
                  {comparison.dbFields.filter(f => f.match).length} of {comparison.dbFields.length} contract fields verified against on-chain data.
                </p>
              </div>
            </div>

            {/* Trade info */}
            <div className="bg-muted/20 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold flex-1">{comparison.trade.event_name}</p>
                {comparison.trade.product_line === "spot" && (
                  <ProductLineBadge line="spot" />
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{comparison.trade.option_label}</span>
                <span className={comparison.trade.side === "buy" ? "text-emerald-400" : "text-red-400"}>
                  {comparison.trade.product_line === "spot"
                    ? (comparison.trade.side === "buy" ? "BUY" : "REDUCE")
                    : (comparison.trade.side === "buy" ? "YES" : "NO")}
                </span>
                <span>@ {comparison.trade.price}</span>
                <span>×{comparison.trade.quantity}</span>
              </div>
            </div>

            {/* Field-by-field comparison */}
            <div>
              {/* Desktop / tablet: 4-column table */}
              <div className="hidden sm:block">
                <div className="grid grid-cols-[0.8fr,1fr,1fr,0.7fr] gap-0 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-2">
                  <span>Field</span>
                  <span>DB Record</span>
                  <span>On-Chain Log</span>
                  <span>Raw Value</span>
                </div>
                <div className="space-y-1">
                  {comparison.dbFields.map((f) => (
                    <div key={f.key} className={`grid grid-cols-[0.8fr,1fr,1fr,0.7fr] gap-0 rounded-lg px-2 py-1.5 text-xs ${f.match ? "bg-emerald-400/5" : "bg-muted/20"}`}>
                      <span className="text-muted-foreground min-w-0 truncate">{f.label}</span>
                      <span className={`font-mono min-w-0 truncate ${f.match ? "text-emerald-400" : ""}`}>{f.dbValue}</span>
                      <span className={`font-mono min-w-0 truncate ${f.match ? "text-emerald-400" : ""}`}>{f.chainValue}</span>
                      <span className="font-mono min-w-0 truncate text-muted-foreground/70">{f.chainRaw}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile: stacked cards per field */}
              <div className="sm:hidden space-y-2">
                {comparison.dbFields.map((f) => (
                  <div key={f.key} className={`rounded-lg px-3 py-2.5 space-y-1.5 ${f.match ? "bg-emerald-400/5 border border-emerald-400/10" : "bg-muted/20"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-foreground/90 min-w-0 truncate">{f.label}</span>
                      {f.match && (
                        <span className="text-[10px] text-emerald-400 shrink-0 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> match
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-[44px,1fr] gap-x-2 gap-y-1 text-[11px]">
                      <span className="text-muted-foreground">DB</span>
                      <span className={`font-mono break-all ${f.match ? "text-emerald-400" : "text-foreground/80"}`}>{f.dbValue}</span>
                      <span className="text-muted-foreground">Chain</span>
                      <span className={`font-mono break-all ${f.match ? "text-emerald-400" : "text-foreground/80"}`}>{f.chainValue}</span>
                      <span className="text-muted-foreground">Raw</span>
                      <span className="font-mono break-all text-muted-foreground/70">{f.chainRaw}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Role */}
            <div className="bg-muted/20 rounded-xl p-4 space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Execution Role</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Your Role</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${comparison.onchain.userRole === "Maker" ? "bg-emerald-400/10 text-emerald-400" : "bg-blue-400/10 text-blue-400"}`}>
                    {comparison.onchain.userRole}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Match Type</span>
                  <code className="text-[10px] font-mono text-foreground/80">{comparison.onchain.matchType}</code>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1 border-t border-border/20">
                Your counterparty is matched by the platform's execution engine. For privacy and to prevent front-running, counterparty identity is not disclosed.
              </p>
            </div>

            {/* TX details */}
            <div className="bg-muted/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">txHash</span>
                <div className="flex items-center gap-1">
                  <code className="text-[10px] font-mono text-foreground/80">{comparison.onchain.txHash.slice(0, 6)}...{comparison.onchain.txHash.slice(-6)}</code>
                  <button onClick={() => copyText(comparison.onchain.txHash, "tx")} className="text-muted-foreground hover:text-foreground">
                    {copiedField === "tx" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">blockNumber</span>
                <code className="text-[10px] font-mono text-foreground/80">#{comparison.onchain.blockNumber.toLocaleString()}</code>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5"
                onClick={() => window.open(`https://basescan.org/tx/${comparison.onchain.txHash}`, "_blank")}
              >
                <ExternalLink className="w-3.5 h-3.5" /> View on BaseScan
              </Button>
              <Button size="sm" className="flex-1 text-xs gap-1.5" onClick={openSelector}>
                <ArrowRightLeft className="w-3.5 h-3.5" /> Verify Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
