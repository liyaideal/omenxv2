import { Badge } from "@/components/ui/badge";
import { RelatedEvent } from "@/hooks/useResolvedEventDetail";
import { Check, ChevronRight } from "lucide-react";
import { getCategoryInfo, CATEGORY_STYLES, CategoryType } from "@/lib/categoryUtils";

interface RelatedEventCardProps {
  event: RelatedEvent;
  onClick?: () => void;
}

export const RelatedEventCard = ({ event, onClick }: RelatedEventCardProps) => {
  const categoryInfo = getCategoryInfo(event.category);

  return (
    <div 
      className="group flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all border border-transparent hover:border-border/50"
      onClick={onClick}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge 
            variant={CATEGORY_STYLES[categoryInfo.label as CategoryType]?.variant || "general"}
            className="text-[9px] uppercase tracking-wide px-1.5 py-0"
          >
            {categoryInfo.label}
          </Badge>
          {event.is_resolved && (
            <Badge 
              variant="outline"
              className="text-[9px] uppercase tracking-wide px-1.5 py-0 bg-muted/50 text-muted-foreground border-border/50"
            >
              Settled
            </Badge>
          )}
        </div>
        <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {event.name}
        </h4>
        {event.is_resolved && event.winning_option_label && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-trading-green">
            <Check className="h-3 w-3" />
            <span>{event.winning_option_label}</span>
          </div>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
    </div>
  );
};
