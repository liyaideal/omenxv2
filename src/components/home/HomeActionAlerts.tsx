import { useNavigate } from "react-router-dom";
import { ChevronRight, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";

export const HomeActionAlerts = () => {
  const navigate = useNavigate();
  const { pendingAirdrops } = useAirdropPositions();

  if (pendingAirdrops.length === 0) return null;

  return (
    <section aria-label="Action alerts" className="space-y-3">
      <div
        className="trading-card p-4 border-trading-yellow/30 bg-trading-yellow/5 cursor-pointer hover:bg-trading-yellow/10 transition-colors"
        onClick={() => navigate("/portfolio/airdrops")}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-trading-yellow/20 flex items-center justify-center flex-shrink-0">
            <Gift className="h-5 w-5 text-trading-yellow" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm">
                {pendingAirdrops.length} Airdrop{pendingAirdrops.length > 1 ? "s" : ""} pending
              </h3>
              <Badge className="bg-trading-yellow/20 text-trading-yellow border-trading-yellow/30 text-[10px] px-1.5 py-0">
                NEW
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Make a trade to activate your free counter-positions
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </section>
  );
};
