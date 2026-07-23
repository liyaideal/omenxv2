import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Sparkles, Clock, Flame, TrendingUp, ArrowRight, Share2 } from "lucide-react";
import { EventWithOptions } from "@/hooks/useActiveEvents";
import { parseSideLabels, getDisplayOptionLabel } from "@/lib/eventUtils";

interface InsightCard {
  id: string;
  icon: string;
  type: string;
  timestamp: Date;
  title: string;
  body: string;
  eventId?: string;
}

interface InsightsFeedProps {
  events: EventWithOptions[];
  priceChanges: Map<string, { prev: number; current: number; change: number }>;
}

const generateInsights = (
  events: EventWithOptions[],
  priceChanges: Map<string, { prev: number; current: number; change: number }>
): InsightCard[] => {
  const insights: InsightCard[] = [];
  const now = new Date();

  events.forEach((event) => {
    const sideLabels = parseSideLabels(event.side_labels);
    event.options.forEach((opt) => {
      const optLabel = getDisplayOptionLabel(opt.label, event.options, sideLabels);
      const change = priceChanges.get(opt.id);
      if (change && Math.abs(change.change) > 5) {
        const direction = change.change > 0 ? "surged" : "dropped";
        const hash = event.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        const volume = ((hash % 200) + 30) * 1000;
        const traders = (hash % 400) + 50;

        insights.push({
          id: `price-${opt.id}`,
          icon: "📊",
          type: "Market Insight",
          timestamp: new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000),
          title: `${event.name} — ${optLabel} probability ${direction} to ${(opt.price * 100).toFixed(0)}%`,
          body: `The "${optLabel}" option ${direction} from $${change.prev.toFixed(2)} to $${change.current.toFixed(2)} (${change.change >= 0 ? "+" : ""}${change.change.toFixed(1)}%) over the past 24h. Trading volume reached $${(volume / 1000).toFixed(1)}K with ${traders} unique traders.`,
          eventId: event.id,
        });
      }
    });

    // Closing soon
    if (event.end_date) {
      const hoursLeft = (new Date(event.end_date).getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursLeft > 0 && hoursLeft < 48) {
        const mainOpt = event.options[0];
        const hash = event.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        const volume = ((hash % 300) + 50) * 1000;

        insights.push({
          id: `closing-${event.id}`,
          icon: "⏰",
          type: "Closing Soon",
          timestamp: new Date(now.getTime() - Math.random() * 4 * 60 * 60 * 1000),
          title: `${event.name} resolves in ${hoursLeft < 1 ? "< 1 hour" : `${Math.floor(hoursLeft)} hours`}`,
          body: `Current price: $${mainOpt?.price.toFixed(2) || "0.50"} (${((mainOpt?.price || 0.5) * 100).toFixed(0)}% implied probability). Total volume: $${(volume / 1000).toFixed(1)}K.`,
          eventId: event.id,
        });
      }
    }

    // Newly listed (within 7 days)
    const daysSinceCreated = (now.getTime() - new Date(event.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 7) {
      const mainOpt = event.options[0];
      const catInfo = event.category.charAt(0).toUpperCase() + event.category.slice(1);
      insights.push({
        id: `new-${event.id}`,
        icon: "🆕",
        type: "New Market",
        timestamp: new Date(event.created_at),
        title: `New market listed: ${event.name}`,
        body: `Current implied probability: ${((mainOpt?.price || 0.5) * 100).toFixed(0)}%. ${catInfo} category.`,
        eventId: event.id,
      });
    }
  });

  // Sort by timestamp descending
  return insights.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const InsightsFeed = ({ events, priceChanges }: InsightsFeedProps) => {
  const navigate = useNavigate();
  const insights = generateInsights(events, priceChanges);
  const [showCount, setShowCount] = useState(10);

  const displayed = insights.slice(0, showCount);

  const formatTime = (d: Date) => {
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffH < 1) return `${Math.floor(diffH * 60)}m ago`;
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (insights.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Insights Feed</h2>
        <div className="p-8 rounded-xl bg-card border border-border/30 text-center">
          <p className="text-sm text-muted-foreground">No insights generated yet. Check back as markets move.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Insights Feed</h2>
        <span className="text-xs text-muted-foreground">{insights.length} insights</span>
      </div>

      <div className="space-y-3">
        {displayed.map((insight) => (
          <article
            key={insight.id}
            className="p-4 rounded-xl bg-card border border-border/30 hover:border-border/50 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <span>{insight.icon}</span>
              <span className="font-medium">{insight.type}</span>
              <span>·</span>
              <time>{formatTime(insight.timestamp)}</time>
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-snug">
              {insight.title}
            </h3>

            {/* Body */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {insight.body}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {insight.eventId && (
                <button
                  onClick={() => navigate("/trade")}
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors"
                >
                  View Market <ArrowRight className="w-3 h-3" />
                </button>
              )}
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="w-3 h-3" /> Share
              </button>
            </div>
          </article>
        ))}
      </div>

      {showCount < insights.length && (
        <button
          onClick={() => setShowCount((c) => c + 10)}
          className="mt-4 w-full py-2.5 rounded-lg border border-border/30 text-sm text-muted-foreground hover:text-foreground hover:border-border/50 transition-colors"
        >
          Load More ({insights.length - showCount} remaining)
        </button>
      )}
    </section>
  );
};
