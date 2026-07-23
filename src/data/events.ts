// Event option type
export interface EventOption {
  id: string;
  label: string;
  price: string;
}

// Event stats type for price-based events
export interface EventStats {
  high24h?: string;
  low24h?: string;
  volume24h?: string;
  marketCap?: string;
}

// Main event type
export interface TradingEvent {
  id: string;
  name: string;
  icon: string;
  ends: string;
  endTime: Date;
  period: string;
  volume: string;
  description: string;
  rules: string[];
  sourceUrl: string;
  sourceName: string;
  resolutionSource: string;
  // Optional fields for specific event types
  tweetCount?: number;
  currentPrice?: string;
  priceChange24h?: string;
  stats?: EventStats;
}

// Event options map - maps event ID to available options
export const eventOptionsMap: Record<string, EventOption[]> = {
  "1": [ // Elon Musk tweets
    { id: "1", label: "140-159", price: "0.0534" },
    { id: "2", label: "160-179", price: "0.1234" },
    { id: "3", label: "200-219", price: "0.3456" },
    { id: "4", label: "220-239", price: "0.2834" },
    { id: "5", label: "240-259", price: "0.1942" },
  ],
  "2": [ // Bitcoin price
    { id: "1", label: "$80,000 - $90,000", price: "0.0823" },
    { id: "2", label: "$90,000 - $100,000", price: "0.1567" },
    { id: "3", label: "$100,000 - $110,000", price: "0.2891" },
    { id: "4", label: "$110,000 - $120,000", price: "0.2234" },
    { id: "5", label: "$120,000 - $130,000", price: "0.1456" },
    { id: "6", label: "$130,000 - $150,000", price: "0.0678" },
    { id: "7", label: "Above $150,000", price: "0.0251" },
    { id: "8", label: "Below $80,000", price: "0.0100" },
  ],
  "3": [ // ETH/BTC ratio
    { id: "1", label: "0.030 - 0.035", price: "0.1234" },
    { id: "2", label: "0.035 - 0.040", price: "0.2567" },
    { id: "3", label: "0.040 - 0.045", price: "0.3123" },
    { id: "4", label: "0.045 - 0.050", price: "0.1890" },
    { id: "5", label: "Above 0.050", price: "0.1186" },
  ],
  "4": [ // Fed interest rate
    { id: "1", label: "No Change", price: "0.4523" },
    { id: "2", label: "25bp Cut", price: "0.3567" },
    { id: "3", label: "50bp Cut", price: "0.1234" },
    { id: "4", label: "25bp Hike", price: "0.0456" },
    { id: "5", label: "50bp+ Cut", price: "0.0220" },
  ],
  "5": [ // S&P 500
    { id: "1", label: "5,800 - 6,000", price: "0.0912" },
    { id: "2", label: "6,000 - 6,200", price: "0.1823" },
    { id: "3", label: "6,200 - 6,400", price: "0.2567" },
    { id: "4", label: "6,400 - 6,600", price: "0.2345" },
    { id: "5", label: "6,600 - 6,800", price: "0.1453" },
    { id: "6", label: "Above 6,800", price: "0.0900" },
  ],
};

// Active trading events
export const activeEvents: TradingEvent[] = [
  { 
    id: "1", 
    name: "Elon Musk # tweets January 10 - January 17, 2026?", 
    icon: "🐦", 
    ends: "Jan 20, 2026", 
    endTime: new Date("2026-01-20T23:59:59"), 
    period: "Jan 10 - Jan 17, 2026",
    volume: "$2.45M", 
    tweetCount: 156,
    description: "Predict the number of tweets from @elonmusk during the specified period.",
    rules: [
      "Counting period: January 10, 2026 00:00:00 UTC to January 17, 2026 23:59:59 UTC",
      "Only original tweets from @elonmusk are counted",
      "Deleted tweets that were posted during the period still count",
      "Market settles within 24 hours after the end date",
    ],
    sourceUrl: "https://x.com/elonmusk",
    sourceName: "View on X (Twitter)",
    resolutionSource: "This market will be resolved based on the official tweet count from Elon Musk's verified X (Twitter) account (@elonmusk) as of the end date. Only original tweets count, excluding retweets and replies.",
  },
  { 
    id: "2", 
    name: "Bitcoin price on January 31, 2026?", 
    icon: "₿", 
    ends: "Jan 31, 2026", 
    endTime: new Date("2026-01-31T23:59:59"), 
    period: "Jan 1 - Jan 31, 2026",
    volume: "$5.12M",
    currentPrice: "$94,532.18",
    priceChange24h: "+2.34%",
    description: "Predict the closing price of Bitcoin (BTC/USD) on January 31, 2026 at 23:59:59 UTC.",
    rules: [
      "Settlement price is based on the CoinGecko BTC/USD price at exactly 23:59:59 UTC on January 31, 2026",
      "The price must be within the selected range at the exact settlement time",
      "In case of exchange downtime, the last available price will be used",
      "Market settles within 1 hour after the settlement time",
    ],
    stats: {
      high24h: "$95,234.00",
      low24h: "$92,156.00",
      volume24h: "$28.5B",
      marketCap: "$1.87T",
    },
    sourceUrl: "https://www.coingecko.com/en/coins/bitcoin",
    sourceName: "View on CoinGecko",
    resolutionSource: "This market will be resolved based on the CoinGecko BTC/USD price at the exact settlement time. The closing price must fall within the selected range for that option to settle at $1.00.",
  },
  { 
    id: "3", 
    name: "ETH/BTC ratio end of Q1 2026?", 
    icon: "⟠", 
    ends: "Mar 31, 2026", 
    endTime: new Date("2026-03-31T23:59:59"), 
    period: "Jan 1 - Mar 31, 2026",
    volume: "$1.89M",
    description: "Predict the ETH/BTC trading ratio at the end of Q1 2026.",
    rules: [
      "Based on Binance ETH/BTC spot price",
      "Settlement at 23:59:59 UTC on March 31, 2026",
    ],
    sourceUrl: "https://www.binance.com/en/trade/ETH_BTC",
    sourceName: "View on Binance",
    resolutionSource: "This market will be resolved based on the Binance ETH/BTC spot price at the exact settlement time.",
  },
  { 
    id: "4", 
    name: "Fed interest rate decision January 2026?", 
    icon: "🏦", 
    ends: "Jan 29, 2026", 
    endTime: new Date("2026-01-29T23:59:59"), 
    period: "Jan 28 - Jan 29, 2026",
    volume: "$3.21M",
    description: "Predict the Federal Reserve interest rate decision for January 2026.",
    rules: [
      "Based on the official FOMC announcement",
      "Settlement immediately after the official press release",
    ],
    sourceUrl: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    sourceName: "View on Federal Reserve",
    resolutionSource: "This market will be resolved based on the official FOMC announcement and press release.",
  },
  { 
    id: "5", 
    name: "S&P 500 closing price December 2025?", 
    icon: "📈", 
    ends: "Dec 31, 2025", 
    endTime: new Date("2025-12-31T23:59:59"), 
    period: "Dec 1 - Dec 31, 2025",
    volume: "$4.56M",
    description: "Predict the S&P 500 index closing price on December 31, 2025.",
    rules: [
      "Based on the official NYSE closing price",
      "Settlement after market close on the last trading day of 2025",
    ],
    sourceUrl: "https://www.nyse.com/quote/index/SPX",
    sourceName: "View on NYSE",
    resolutionSource: "This market will be resolved based on the official NYSE S&P 500 closing price on the last trading day of 2025.",
  },
];

// Helper function to get options for an event
export const getEventOptions = (eventId: string): EventOption[] => {
  return eventOptionsMap[eventId] || [];
};

// Helper function to get event by ID
export const getEventById = (eventId: string): TradingEvent | undefined => {
  return activeEvents.find(event => event.id === eventId);
};
