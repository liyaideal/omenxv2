import { useNavigate } from "react-router-dom";
import { TrendingUp, BarChart3, Zap } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePositions } from "@/hooks/usePositions";

const featuredEvents = [
  {
    id: 1,
    title: "Fed decision in December?",
    topOption: "25 bps decrease",
    probability: "72%",
    volume: "$2.45M",
    timeLeft: "23:47:15",
  },
  {
    id: 2,
    title: "Bitcoin above $100k by EOY?",
    topOption: "Yes",
    probability: "45%",
    volume: "$8.2M",
    timeLeft: "12:05:32",
  },
  {
    id: 3,
    title: "Next US President 2028?",
    topOption: "Republican",
    probability: "51%",
    volume: "$156M",
    timeLeft: "1,095 days",
  },
];

export default function Index() {
  const navigate = useNavigate();
  const { balance } = useUserProfile();
  const { positions } = usePositions();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground">Prediction Market</h1>
        <p className="text-muted-foreground text-sm mt-1">Trade on future outcomes</p>
      </header>

      {/* Stats Bar */}
      <div className="px-4 mb-6">
        <div className="trading-card p-4 flex justify-around">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-trading-green mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-trading-purple mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">{positions.length}</span>
            </div>
            <span className="text-xs text-muted-foreground">Positions</span>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-foreground mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">+$142</span>
            </div>
            <span className="text-xs text-muted-foreground">P&L Today</span>
          </div>
        </div>
      </div>

      {/* Featured Events */}
      <section className="px-4">
        <h2 className="text-lg font-semibold mb-4">Trending Events</h2>
        <div className="space-y-4">
          {featuredEvents.map((event, index) => (
            <button
              key={event.id}
              onClick={() => navigate("/trade")}
              className="w-full trading-card p-4 text-left transition-all duration-200 active:scale-[0.98] animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-foreground pr-4">{event.title}</h3>
                <div className="flex items-center gap-1 text-xs text-trading-red flex-shrink-0">
                  <span className="w-2 h-2 bg-trading-red rounded-full animate-pulse-soft" />
                  {event.timeLeft}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">{event.topOption}</span>
                  <div className="text-xl font-bold font-mono text-trading-purple">
                    {event.probability}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Volume</span>
                  <div className="font-mono text-sm text-foreground">{event.volume}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
