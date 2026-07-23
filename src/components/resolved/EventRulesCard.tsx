import { format } from "date-fns";

interface EventRulesCardProps {
  startDate: string | null;
  endDate: string | null;
  settledAt: string | null;
  rules: string | null;
  eventName?: string;
  isMobile?: boolean;
}

interface RuleItemProps {
  label: string;
  value: string;
}

const RuleItem = ({ label, value }: RuleItemProps) => (
  <div className="space-y-1">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-sm font-medium text-foreground">{value}</div>
  </div>
);

const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "yyyy-MM-dd HH:mm:ss") + " UTC";
  } catch {
    return "—";
  }
};

const formatDateRange = (start: string | null, end: string | null): string => {
  if (!start && !end) return "—";
  const startFormatted = start ? format(new Date(start), "MMM d, yyyy") : "—";
  const endFormatted = end ? format(new Date(end), "MMM d, yyyy") : "—";
  return `${startFormatted} - ${endFormatted}`;
};

export const EventRulesCard = ({ 
  startDate, 
  endDate, 
  settledAt, 
  rules,
  eventName,
  isMobile = false 
}: EventRulesCardProps) => {
  return (
    <div className="space-y-4">
      {/* Question - if provided */}
      {eventName && (
        <RuleItem label="Question" value={eventName} />
      )}

      {/* Created */}
      <RuleItem label="Created" value={formatDateTime(startDate)} />
      
      {/* Trading Period */}
      <RuleItem label="Trading Period" value={formatDateRange(startDate, endDate)} />
      
      {/* Settlement Rules */}
      {rules && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Settlement Rules</div>
          <p className="text-sm text-foreground leading-relaxed">
            {rules}
          </p>
        </div>
      )}
    </div>
  );
};
