import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Star, RotateCcw, ArrowLeft, ExternalLink } from "lucide-react";
import { CodePreview } from "./CodePreview";

interface OptionChip {
  label: string;
  price: string;
  active?: boolean;
}

const defaultOptions: OptionChip[] = [
  { label: "0 - 500", price: "0.1800", active: true },
  { label: "500 - 1,000", price: "0.2300" },
  { label: "1,000 - 1,500", price: "0.1800" },
  { label: "1,500 - 2,000", price: "0.1500" },
  { label: "2,000 - 3,000", price: "0.1600" },
  { label: "Above 3,000", price: "0.1100" },
];

export const TradingHeaderPlayground = () => {
  // Event Settings
  const [eventTitle, setEventTitle] = useState("Elon Musk tweets in Q2 2026?");
  const [countdownDays, setCountdownDays] = useState(151);
  const [countdownTime, setCountdownTime] = useState("12:17:22");
  
  // Indicator Settings
  const [indicatorType, setIndicatorType] = useState<"tweets" | "price">("tweets");
  const [tweetCount, setTweetCount] = useState(1847);
  const [currentPrice, setCurrentPrice] = useState("$4,287.50");
  const [priceChange, setPriceChange] = useState("+2.34%");
  const [priceLabel, setPriceLabel] = useState("ETH/USD");
  const [period, setPeriod] = useState("Q2 2026");
  const [high24h, setHigh24h] = useState("$4,352.10");
  const [low24h, setLow24h] = useState("$4,156.80");
  
  // Stats Settings
  const [volume24h, setVolume24h] = useState("$2.45M");
  const [fundingRate, setFundingRate] = useState("+0.05%");
  const [nextFunding, setNextFunding] = useState("28min");
  
  // UI State
  const [showBackButton, setShowBackButton] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [options, setOptions] = useState<OptionChip[]>(defaultOptions);

  const resetPlayground = () => {
    setEventTitle("Elon Musk tweets in Q2 2026?");
    setCountdownDays(151);
    setCountdownTime("12:17:22");
    setIndicatorType("tweets");
    setTweetCount(1847);
    setCurrentPrice("$4,287.50");
    setPriceChange("+2.34%");
    setPriceLabel("ETH/USD");
    setPeriod("Q2 2026");
    setHigh24h("$4,352.10");
    setLow24h("$4,156.80");
    setVolume24h("$2.45M");
    setFundingRate("+0.05%");
    setNextFunding("28min");
    setShowBackButton(true);
    setIsFavorite(false);
    setSelectedOptionIndex(0);
    setOptions(defaultOptions);
  };

  return (
    <Card className="trading-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Trading Page Header</CardTitle>
            <CardDescription>
              Specialized header for the trading interface - no main navigation, focused on event context
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={resetPlayground} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Preview */}
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            {/* Left: Back + Event Title + Countdown */}
            <div className="flex items-center gap-3">
              {showBackButton && (
                <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{eventTitle}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <span className="w-1.5 h-1.5 bg-trading-red rounded-full animate-pulse" />
                  <span>Ends in</span>
                  <span className="text-trading-red font-mono font-medium">
                    {countdownDays}d {countdownTime}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Center: Real-time Indicator Badge with Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="flex items-center gap-2 px-3 py-1.5 bg-indicator/10 border border-indicator/30 rounded-lg transition-all hover:bg-indicator/20 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indicator rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground">
                      {indicatorType === "tweets" ? "Current Tweets" : "Current Price"}
                    </span>
                  </div>
                  <span className="text-sm text-indicator font-mono font-bold">
                    {indicatorType === "tweets" ? tweetCount.toLocaleString() : currentPrice}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <div className="space-y-3">
                  {/* Header with title and value */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {indicatorType === "tweets" ? "Tweet Count" : priceLabel}
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indicator">
                        {indicatorType === "tweets" ? tweetCount.toLocaleString() : currentPrice}
                      </div>
                      {indicatorType === "price" && priceChange && (
                        <div className={`text-xs font-mono ${priceChange.startsWith('+') ? 'text-trading-green' : 'text-trading-red'}`}>
                          {priceChange} (24h)
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats section */}
                  <div className="text-xs text-muted-foreground space-y-1 border-t border-border/30 pt-2">
                    <div className="flex justify-between">
                      <span>Period</span>
                      <span>{period}</span>
                    </div>
                    {indicatorType === "price" && (
                      <>
                        <div className="flex justify-between">
                          <span>24h High</span>
                          <span className="text-trading-green font-mono">{high24h}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>24h Low</span>
                          <span className="text-trading-red font-mono">{low24h}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span>Last updated</span>
                      <span>Just now</span>
                    </div>
                  </div>
                  
                  {/* Source link */}
                  <a
                    href="#"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    onClick={(e) => e.preventDefault()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {indicatorType === "tweets" ? "View on Twitter/X" : "View on CoinGecko"}
                  </a>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Toggle indicator type button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setIndicatorType(indicatorType === "tweets" ? "price" : "tweets")}
            >
              Switch to {indicatorType === "tweets" ? "Price" : "Tweets"}
            </Button>

            {/* Right: Stats + Favorite */}
            <div className="flex items-center gap-6 text-xs">
              <div>
                <div className="text-muted-foreground">24h Volume</div>
                <div className="font-mono font-medium">{volume24h}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Funding Rate</div>
                <div className={`font-mono font-medium ${fundingRate.startsWith('+') ? 'text-trading-green' : fundingRate.startsWith('-') ? 'text-trading-red' : ''}`}>
                  {fundingRate}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Next Funding</div>
                <div className="font-mono font-medium">{nextFunding}</div>
              </div>
              <button 
                className="p-2 rounded-md hover:bg-muted/50 transition-colors"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Star 
                  className={`w-5 h-5 transition-colors ${
                    isFavorite ? 'fill-trading-yellow text-trading-yellow' : 'text-muted-foreground'
                  }`} 
                />
              </button>
            </div>
          </div>

          {/* Option Chips Row */}
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
            <span className="text-xs text-muted-foreground flex-shrink-0">Select Option:</span>
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOptionIndex(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  i === selectedOptionIndex
                    ? "bg-trading-purple/20 border border-trading-purple text-foreground"
                    : "bg-muted border border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{opt.label}</span>
                <span className={`ml-2 font-mono ${i === selectedOptionIndex ? "text-trading-purple" : ""}`}>
                  ${opt.price}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Event Settings */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Event Settings</h4>
            
            <div className="space-y-2">
              <Label className="text-xs">Event Title</Label>
              <Input 
                value={eventTitle} 
                onChange={(e) => setEventTitle(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Countdown Days</Label>
                <Input 
                  type="number"
                  value={countdownDays} 
                  onChange={(e) => setCountdownDays(Number(e.target.value))}
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Time (HH:MM:SS)</Label>
                <Input 
                  value={countdownTime} 
                  onChange={(e) => setCountdownTime(e.target.value)}
                  className="h-8 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Show Back Button</Label>
              <Switch checked={showBackButton} onCheckedChange={setShowBackButton} />
            </div>
          </div>

          {/* Indicator Settings */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Real-time Indicator</h4>
            
            <div className="space-y-2">
              <Label className="text-xs">Indicator Type</Label>
              <Select value={indicatorType} onValueChange={(v) => setIndicatorType(v as "tweets" | "price")}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tweets">Tweet Count</SelectItem>
                  <SelectItem value="price">Asset Price</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {indicatorType === "tweets" ? (
              <div className="space-y-2">
                <Label className="text-xs">Tweet Count</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[tweetCount]}
                    onValueChange={([v]) => setTweetCount(v)}
                    min={0}
                    max={5000}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-12 text-right">{tweetCount}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Price Label (e.g., ETH/USD)</Label>
                  <Input 
                    value={priceLabel} 
                    onChange={(e) => setPriceLabel(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Current Price</Label>
                  <Input 
                    value={currentPrice} 
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    className="h-8 text-sm font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">24h Change</Label>
                  <Input 
                    value={priceChange} 
                    onChange={(e) => setPriceChange(e.target.value)}
                    className="h-8 text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">24h High</Label>
                    <Input 
                      value={high24h} 
                      onChange={(e) => setHigh24h(e.target.value)}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">24h Low</Label>
                    <Input 
                      value={low24h} 
                      onChange={(e) => setLow24h(e.target.value)}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                </div>
              </>
            )}
            
            {/* Shared: Period */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <Label className="text-xs">Period</Label>
              <Input 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Stats Settings */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Trading Stats</h4>
            
            <div className="space-y-2">
              <Label className="text-xs">24h Volume</Label>
              <Input 
                value={volume24h} 
                onChange={(e) => setVolume24h(e.target.value)}
                className="h-8 text-sm font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Funding Rate</Label>
              <Input 
                value={fundingRate} 
                onChange={(e) => setFundingRate(e.target.value)}
                className="h-8 text-sm font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Next Funding</Label>
              <Input 
                value={nextFunding} 
                onChange={(e) => setNextFunding(e.target.value)}
                className="h-8 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Component Specifications Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Component</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Spec</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr>
                <td className="py-2 font-medium">Back Button</td>
                <td className="py-2 font-mono text-primary">ArrowLeft w-5 h-5</td>
                <td className="py-2 text-muted-foreground">Only if navigationType === "PUSH"</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Event Title</td>
                <td className="py-2 font-mono text-primary">font-semibold + ChevronDown</td>
                <td className="py-2 text-muted-foreground">Dropdown to switch events</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Countdown</td>
                <td className="py-2 font-mono text-primary">text-trading-red font-mono</td>
                <td className="py-2 text-muted-foreground">Red pulse dot + "Ends in" label</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Real-time Badge</td>
                <td className="py-2 font-mono text-primary">bg-indicator/10 border-indicator/30</td>
                <td className="py-2 text-muted-foreground">Click opens Popover with details</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">↳ Popover Content</td>
                <td className="py-2 font-mono text-primary">PopoverContent w-72 p-3</td>
                <td className="py-2 text-muted-foreground">Title, value, 24h change, period, high/low, source link</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Stats Row</td>
                <td className="py-2 font-mono text-primary">text-xs + font-mono</td>
                <td className="py-2 text-muted-foreground">Volume, Funding Rate, Next Funding</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Favorite Star</td>
                <td className="py-2 font-mono text-primary">Star w-5 h-5</td>
                <td className="py-2 text-muted-foreground">Toggles favorites (yellow when active)</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Option Chips</td>
                <td className="py-2 font-mono text-primary">bg-trading-purple/20 (active)</td>
                <td className="py-2 text-muted-foreground">Horizontal scrollable, label + price</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Code Preview */}
        <CodePreview 
          code={`// Trade header is part of DesktopTrading.tsx
// No separate component - embedded in the page layout

<header className="sticky top-0 z-40 flex items-center gap-4 px-4 py-3 
                   bg-background/95 backdrop-blur border-b border-border/30">
  {/* Back button (conditional) */}
  {showBackButton && <ArrowLeft className="w-5 h-5" />}
  
  {/* Event dropdown trigger */}
  <div className="flex items-center gap-2">
    <span className="font-semibold">{selectedEvent.name}</span>
    <ChevronDown className="w-4 h-4" />
  </div>
  
  {/* Real-time indicator badge */}
  <div className="bg-indicator/10 border border-indicator/30 rounded-lg px-3 py-1.5">
    <span className="text-indicator font-mono">{tweetCount || currentPrice}</span>
  </div>
  
  {/* Stats: Volume, Funding, Next Funding */}
  <div className="flex items-center gap-6 text-xs">...</div>
  
  {/* Favorite star */}
  <Star className={favorites.has(eventId) ? "fill-trading-yellow" : ""} />
</header>

{/* Option chips row */}
<div className="flex items-center gap-2 px-4 py-2 border-b">
  {options.map(option => <OptionChip key={option.id} />)}
</div>`}
          collapsible
          defaultExpanded={false}
        />
      </CardContent>
    </Card>
  );
};
