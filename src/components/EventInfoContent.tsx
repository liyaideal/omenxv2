import { ExternalHedgeLinks } from "@/components/ExternalHedgeLinks";
import type { TradingEvent } from "@/hooks/useEvents";

interface EventInfoContentProps {
  event: TradingEvent;
}

export function EventInfoContent({ event }: EventInfoContentProps) {
  return (
    <div className="space-y-4">
      {/* Event Header */}
      <div>
        <h2 className="text-lg font-bold">{event.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {event.description || "Predict the outcome of this event."}
        </p>
      </div>

      {/* Real-time Indicator Card */}
      {(event.currentPrice || event.tweetCount !== undefined) && (
        <div className="bg-gradient-to-r from-indicator/20 to-indicator/5 rounded-lg p-3 border border-indicator/30">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {event.currentPrice ? "Current Price" : "Current Count"}
            </div>
            <div className="text-xl font-bold text-indicator">
              {event.currentPrice || `${event.tweetCount} tweets`}
            </div>
            {event.priceChange24h && (
              <div className={`text-sm mt-1 ${event.priceChange24h.startsWith('+') ? 'text-trading-green' : 'text-trading-red'}`}>
                {event.priceChange24h} (24h)
              </div>
            )}
          </div>
          {event.stats && (
            <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-indicator/20">
              <div>
                <div className="text-[10px] text-muted-foreground">24h High</div>
                <div className="text-sm font-medium">{event.stats.high24h}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">24h Low</div>
                <div className="text-sm font-medium">{event.stats.low24h}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">24h Volume</div>
                <div className="text-sm font-medium">{event.stats.volume24h}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Market Cap</div>
                <div className="text-sm font-medium">{event.stats.marketCap}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event Details Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-0.5">Event End Date</div>
          <div className="text-sm font-medium">{event.ends}</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-0.5">Total Volume</div>
          <div className="text-sm font-medium">{event.volume}</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-0.5">Open Interest</div>
          <div className="text-sm font-medium">$1.2M</div>
        </div>
      </div>

      {/* Resolution Source */}
      <div className="bg-muted/30 rounded-lg p-3">
        <div className="text-[10px] text-muted-foreground mb-1">Resolution Source</div>
        <p className="text-sm">
          {event.resolutionSource || "This market will be resolved based on official data sources as specified in the market rules."}
        </p>
      </div>

      {/* Market Rules */}
      {event.rules && event.rules.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Market Rules</div>
          <ul className="text-sm space-y-1.5">
            {event.rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-trading-purple">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* External Hedge Links */}
      {event.externalLinks && event.externalLinks.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3">
          <ExternalHedgeLinks links={event.externalLinks} />
        </div>
      )}
    </div>
  );
}
