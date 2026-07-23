import { useNavigate } from "react-router-dom";
import { Clock, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpiredEventFallbackProps {
  eventId: string;
}

export function ExpiredEventFallback({ eventId }: ExpiredEventFallbackProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Clock className="w-10 h-10 text-muted-foreground" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Event Has Ended</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The event you're looking for has already been settled or is no longer available for trading.
          </p>
        </div>

        {/* Event ID hint */}
        <div className="w-full bg-muted/50 rounded-lg px-4 py-3 border border-border/50">
          <p className="text-xs text-muted-foreground">Event ID</p>
          <p className="text-sm font-mono text-foreground mt-0.5 truncate">{eventId}</p>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <Button
            onClick={() => navigate("/resolved")}
            variant="outline"
            className="w-full gap-2"
          >
            <Search className="w-4 h-4" />
            View Settled Events
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="w-full gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Active Events
          </Button>
        </div>
      </div>
    </div>
  );
}
