import { Check } from "lucide-react";
import { format, formatDistanceStrict } from "date-fns";

interface SettlementTimelineProps {
  startDate: string | null;
  endDate: string | null;
  settledAt: string | null;
  /** If true, use simplified 2-step layout for settlement detail (Opened -> Settled + Duration) */
  variant?: "full" | "compact";
}

interface TimelineStep {
  label: string;
  date: string | null;
  completed: boolean;
}

export const SettlementTimeline = ({ 
  startDate, 
  endDate, 
  settledAt,
  variant = "full" 
}: SettlementTimelineProps) => {
  // Compact variant: Opened and Settled only (for settlement detail pages)
  const isCompact = variant === "compact";
  
  const steps: TimelineStep[] = isCompact
    ? [
        {
          label: "Opened",
          date: startDate,
          completed: !!startDate,
        },
        {
          label: "Settled",
          date: settledAt,
          completed: !!settledAt,
        },
      ]
    : [
        {
          label: "Market Opened",
          date: startDate,
          completed: !!startDate,
        },
        {
          label: "Trading Ended",
          date: endDate,
          completed: !!endDate,
        },
        {
          label: "Settled",
          date: settledAt,
          completed: !!settledAt,
        },
      ];

  // Calculate duration for compact variant
  const duration = isCompact && startDate && settledAt
    ? formatDistanceStrict(new Date(settledAt), new Date(startDate))
    : null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "MMM d, yyyy");
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "HH:mm");
  };

  // Calculate progress width
  const getProgressWidth = () => {
    if (isCompact) {
      return settledAt ? "100%" : startDate ? "50%" : "0%";
    }
    return settledAt ? "100%" : endDate ? "66%" : startDate ? "33%" : "0%";
  };

  return (
    <div className="relative">
      {/* Main timeline row */}
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-border" />
        <div 
          className="absolute top-3.5 left-0 h-0.5 bg-trading-green transition-all"
          style={{ width: getProgressWidth() }}
        />
        
        {steps.map((step) => (
          <div key={step.label} className="flex flex-col items-center relative z-10">
            <div 
              className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                step.completed 
                  ? "bg-trading-green border-trading-green" 
                  : "bg-background border-border"
              }`}
            >
              {step.completed && <Check className="h-4 w-4 text-primary-foreground" />}
            </div>
            <span className="text-xs text-muted-foreground mt-2 text-center">
              {step.label}
            </span>
            <span className="text-sm font-medium text-foreground mt-0.5 text-center">
              {formatDate(step.date)}
            </span>
            <span className="text-xs text-muted-foreground text-center">
              {formatTime(step.date)}
            </span>
          </div>
        ))}

        {/* Duration indicator in the middle - compact variant only */}
        {isCompact && duration && (
          <div className="absolute left-1/2 -translate-x-1/2 top-3.5 flex flex-col items-center z-20">
            {/* Vertical line down from timeline */}
            <div className="w-px h-4 bg-border" />
            {/* Duration badge */}
            <div className="mt-1 px-2.5 py-1 bg-card border border-border rounded-full">
              <span className="text-xs text-muted-foreground mr-1">Duration</span>
              <span className="text-xs font-medium text-foreground">{duration}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};