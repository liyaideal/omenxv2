import { ChevronDown, Star, Info } from "lucide-react";

interface DesktopHeaderProps {
  symbol: string;
  price: string;
  markPrice: string;
  indexPrice: string;
  change24h: string;
  changePercent: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  openInterest: string;
  fundingRate: string;
  countdown: string;
  isPositive?: boolean;
}

export const DesktopHeader = ({
  symbol = "BTCUSDT",
  price = "88,131.30",
  markPrice = "88,132.18",
  indexPrice = "88,155.51",
  change24h = "+1,065.30",
  changePercent = "+1.22%",
  high24h = "89,483.50",
  low24h = "84,408.10",
  volume24h = "11,641,546,452.24",
  openInterest = "48,516.803",
  fundingRate = "0.0100%",
  countdown = "06:26:01",
  isPositive = true,
}: Partial<DesktopHeaderProps>) => {
  return (
    <header className="flex items-center gap-6 px-4 py-2 bg-background border-b border-border/30">
      {/* Symbol & Price */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-trading-yellow flex items-center justify-center">
            <span className="text-background font-bold text-sm">₿</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">{symbol}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">USDT Perpetual</span>
          </div>
        </div>
        <Star className="w-4 h-4 text-muted-foreground hover:text-trading-yellow cursor-pointer" />
      </div>

      {/* Price */}
      <div>
        <div className={`text-xl font-bold font-mono ${isPositive ? 'text-trading-green' : 'text-trading-red'}`}>
          {price}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{markPrice}</div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-xs">
        <div>
          <div className="text-muted-foreground">Index Price</div>
          <div className="font-mono">{indexPrice}</div>
        </div>
        <div>
          <div className="text-muted-foreground">24H Change %</div>
          <div className={`font-mono ${isPositive ? 'text-trading-green' : 'text-trading-red'}`}>
            {change24h} ({changePercent})
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">24H High</div>
          <div className="font-mono">{high24h}</div>
        </div>
        <div>
          <div className="text-muted-foreground">24H Low</div>
          <div className="font-mono">{low24h}</div>
        </div>
        <div>
          <div className="text-muted-foreground">24H Turnover(USDT)</div>
          <div className="font-mono">{volume24h}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Open Interest(BTC)</div>
          <div className="font-mono">{openInterest}</div>
        </div>
        <div>
          <div className="text-muted-foreground flex items-center gap-1">
            Funding Rate / Countdown
            <Info className="w-3 h-3" />
          </div>
          <div className="font-mono">
            <span className="text-trading-green">{fundingRate}</span>
            <span className="text-muted-foreground"> / {countdown}</span>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="ml-auto">
        <button className="p-2 text-muted-foreground hover:text-foreground">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </header>
  );
};
