import { ExternalLink, FileCheck, CheckCircle2 } from "lucide-react";

interface SettlementEvidenceCardProps {
  sourceName: string | null;
  sourceUrl: string | null;
  settlementDescription: string | null;
  winningOptionLabel: string | null;
}

export const SettlementEvidenceCard = ({ 
  sourceName, 
  sourceUrl, 
  settlementDescription,
  winningOptionLabel 
}: SettlementEvidenceCardProps) => {
  const hasSourceInfo = sourceName || sourceUrl;
  const hasAnyContent = hasSourceInfo || settlementDescription || winningOptionLabel;

  if (!hasAnyContent) {
    return (
      <div className="p-4 rounded-xl bg-muted/20 text-center">
        <p className="text-sm text-muted-foreground">
          No settlement evidence available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Source Link - clickable card style */}
      {hasSourceInfo && (
        <div 
          className="p-4 rounded-xl bg-muted/30 border border-border/30 cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => sourceUrl && window.open(sourceUrl, "_blank")}
        >
          <div className="flex items-start gap-3">
            <ExternalLink className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm">
                {sourceName || "Resolution Source"}
              </div>
              {sourceUrl && (
                <div className="text-xs text-primary/80 truncate mt-1">
                  {sourceUrl}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result Confirmed - settlement description */}
      {settlementDescription && (
        <div className="p-4 rounded-xl bg-trading-green/10 border border-trading-green/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-trading-green mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-trading-green mb-1">
                Result Confirmed
              </div>
              <p className="text-sm text-trading-green/90 leading-relaxed">
                {settlementDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Winning Result - only show if no other content shows the winner */}
      {winningOptionLabel && !settlementDescription && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-trading-green/10 border border-trading-green/30">
          <div className="p-2 rounded-lg bg-trading-green/20">
            <FileCheck className="h-5 w-5 text-trading-green" />
          </div>
          <div>
            <div className="text-xs text-trading-green/80 uppercase tracking-wide mb-0.5">
              Final Result
            </div>
            <div className="text-lg font-semibold text-trading-green">
              {winningOptionLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
