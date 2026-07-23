import { useState } from "react";
import { Shield, Loader2, CheckCircle2, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesktopBackLink } from "@/components/ui/desktop-back-link";
import { useMerkleVerification, type MerkleStep } from "@/hooks/useMerkleVerification";
import { toast } from "sonner";
import { format } from "date-fns";

const STEPS_CONFIG = [
  { key: "fetching_proof", label: "Fetching Merkle proof", description: "Requesting cryptographic proof from the platform..." },
  { key: "reading_chain", label: "Reading on-chain StateRoot", description: "Querying Base chain for the latest committed state root..." },
  { key: "verifying", label: "Verifying locally", description: "Computing Merkle path hash in your browser..." },
  { key: "result", label: "Verification complete", description: "" },
] as const;

const stepIndex = (step: MerkleStep) => {
  switch (step) {
    case "fetching_proof": return 0;
    case "reading_chain": return 1;
    case "verifying": return 2;
    case "result":
    case "details": return 3;
    default: return -1;
  }
};

interface Props {
  onBack: () => void;
}

export const MerkleProofVerification = ({ onBack }: Props) => {
  const { step, data, startVerification, reset, showDetails } = useMerkleVerification();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const currentIdx = stepIndex(step);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="ml-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
    >
      {copiedField === field ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  // Idle state
  if (step === "idle") {
    return (
      <div className="space-y-6">
        <DesktopBackLink onClick={onBack} />
        <div className="trading-card p-6 md:p-8 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold">My Funds Are Really There?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This verification proves your account balance and open positions are included in OmenX's on-chain Merkle state tree committed to Base network.
            </p>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 text-left max-w-sm mx-auto space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How it works</h4>
            {STEPS_CONFIG.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
          <Button onClick={startVerification} className="px-8 gap-2">
            <Shield className="w-4 h-4" /> Start Verification
          </Button>
        </div>
      </div>
    );
  }

  // Processing / Result
  return (
    <div className="space-y-6">
      <DesktopBackLink onClick={() => { reset(); onBack(); }} />

      <div className="trading-card p-6 md:p-8 space-y-6">
        {/* Progress steps */}
        <div className="space-y-3">
          {STEPS_CONFIG.map((s, i) => {
            const isActive = i === currentIdx && step !== "result" && step !== "details";
            const isDone = i < currentIdx || step === "result" || step === "details";
            return (
              <div key={s.key} className={`flex items-start gap-3 transition-all duration-500 ${i > currentIdx && step !== "result" && step !== "details" ? "opacity-30" : "opacity-100"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${isDone ? "bg-emerald-400/20 text-emerald-400" : isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {isDone ? <CheckCircle2 className="w-4.5 h-4.5" /> : isActive ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <div className="pt-1">
                  <p className={`text-sm font-medium ${isDone ? "text-emerald-400" : isActive ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                  {isActive && s.description && <p className="text-xs text-muted-foreground mt-0.5 animate-fade-in">{s.description}</p>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="ml-4 -mt-3 h-0" />

        {/* Result */}
        {(step === "result" || step === "details") && data && (
          <div className="animate-fade-in space-y-4">
            {/* Success banner */}
            <div className="rounded-xl bg-emerald-400/10 border border-emerald-400/20 p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-400/20 flex items-center justify-center shrink-0">
                <Shield className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-400 text-lg">Verified ✓</h3>
                <p className="text-sm text-muted-foreground">Your assets are cryptographically proven to exist in the platform's on-chain state.</p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Available Balance", value: `$${data.balance.toLocaleString()}` },
                { label: "Margin", value: `$${data.margin.toLocaleString()}` },
                { label: "Total Assets", value: `$${data.totalAssets.toLocaleString()}` },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-muted/30 rounded-xl px-3 py-2.5 sm:p-3 flex items-center justify-between sm:flex-col sm:items-center sm:justify-center sm:text-center gap-2 sm:gap-1"
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider sm:mb-1">{item.label}</p>
                  <p className="text-sm font-bold font-mono tabular-nums whitespace-nowrap">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed -mt-1">
              Only settled-state fields are committed on-chain. Floating PnL and live position mark value are real-time derivatives and are not part of the state root.
            </p>

            {/* Expandable cryptographic details */}
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <span className="font-medium">Cryptographic Details</span>
              {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {detailsOpen && (
              <div className="animate-fade-in space-y-3 bg-muted/20 rounded-xl p-4">
                {/* batchId */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">batchId</p>
                  <div className="flex items-center">
                    <code className="text-xs font-mono text-foreground">#{data.batchId.toLocaleString()}</code>
                    <CopyBtn text={data.batchId.toString()} field="batch" />
                  </div>
                </div>

                {/* leafHash */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">leafHash</p>
                  <div className="flex items-center">
                    <code className="text-xs font-mono text-emerald-400 break-all flex-1">{data.leafHash}</code>
                    <CopyBtn text={data.leafHash} field="leaf" />
                  </div>
                </div>

                {/* oldRoot */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">oldRoot</p>
                  <div className="flex items-center">
                    <code className="text-xs font-mono text-muted-foreground break-all flex-1">{data.oldRoot}</code>
                    <CopyBtn text={data.oldRoot} field="oldRoot" />
                  </div>
                </div>

                {/* newRoot */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">newRoot</p>
                  <div className="flex items-center">
                    <code className="text-xs font-mono text-blue-400 break-all flex-1">{data.stateRoot}</code>
                    <CopyBtn text={data.stateRoot} field="root" />
                  </div>
                </div>

                {/* timestamp */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">timestamp</p>
                  <code className="text-xs font-mono text-foreground">
                    {format(new Date(data.commitTimestamp), "yyyy-MM-dd HH:mm:ss 'UTC'")}
                  </code>
                </div>

                {/* proofPath */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">proofPath ({data.proofPath.length} nodes)</p>
                  <div className="space-y-1">
                    {data.proofPath.map((node, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/50 w-4 shrink-0">{i}</span>
                        <code className="text-[10px] font-mono text-muted-foreground break-all">{node}</code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verified at */}
                <div className="pt-2 border-t border-border/20">
                  <p className="text-[10px] text-muted-foreground">
                    Verified at {new Date(data.verifiedAt).toLocaleString()}
                  </p>
                </div>

                <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full"
                  onClick={() => window.open(`https://basescan.org/tx/${data.stateRoot}`, "_blank")}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View State Root on BaseScan
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={startVerification} className="flex-1 gap-2">
                <Shield className="w-4 h-4" /> Verify Again
              </Button>
              <Button variant="outline" onClick={() => { reset(); onBack(); }} className="flex-1">Done</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
