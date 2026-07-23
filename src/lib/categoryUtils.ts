// Unified category system with consistent colors
// Each category has a unique color - no duplicates allowed

export interface CategoryInfo {
  category: string;
  label: string; // Display label
  color: string; // HSL color value for custom styling
}

// Master category definitions with consistent colors
// RULE: Each category MUST have a unique color
// variant: Badge variant for proper hover states (matches badge.tsx variants)
export const CATEGORY_STYLES = {
  // Purple - Social media & influencers
  Social: { class: "bg-primary/20 text-primary", hsl: "260 60% 55%", variant: "social" as const, cardBg: "/card-bg/social.jpg" },
  
  // Yellow - Cryptocurrency
  Crypto: { class: "bg-trading-yellow/20 text-trading-yellow", hsl: "48 100% 55%", variant: "crypto" as const, cardBg: "/card-bg/crypto.jpg" },
  
  // Green - Finance & economy
  Finance: { class: "bg-trading-green/20 text-trading-green", hsl: "145 80% 42%", variant: "finance" as const, cardBg: "/card-bg/finance.jpg" },
  
  // Red - Politics & government
  Politics: { class: "bg-trading-red/20 text-trading-red", hsl: "0 85% 60%", variant: "politics" as const, cardBg: "/card-bg/politics.jpg" },
  
  // Cyan - Technology & space
  Tech: { class: "bg-cyan-500/20 text-cyan-400", hsl: "190 90% 50%", variant: "tech" as const, cardBg: "/card-bg/tech.jpg" },
  
  // Orange - Entertainment & awards
  Entertainment: { class: "bg-orange-500/20 text-orange-400", hsl: "25 95% 55%", variant: "entertainment" as const, cardBg: "/card-bg/entertainment.jpg" },
  
  // Blue - Sports & competitions
  Sports: { class: "bg-blue-500/20 text-blue-400", hsl: "210 90% 55%", variant: "sports" as const, cardBg: "/card-bg/sports.jpg" },
  
  // Gray - Generic/fallback
  Market: { class: "bg-muted text-foreground", hsl: "222 25% 55%", variant: "general" as const, cardBg: null },
  General: { class: "bg-muted text-foreground", hsl: "222 25% 55%", variant: "general" as const, cardBg: null },
} as const;

export type CategoryType = keyof typeof CATEGORY_STYLES;

// Get category info based on category string from database
export const getCategoryInfo = (categoryKey: string): CategoryInfo => {
  const normalizedKey = categoryKey.toLowerCase();
  
  const categoryMap: Record<string, { label: CategoryType; hsl: string }> = {
    social: { label: "Social", hsl: CATEGORY_STYLES.Social.hsl },
    crypto: { label: "Crypto", hsl: CATEGORY_STYLES.Crypto.hsl },
    finance: { label: "Finance", hsl: CATEGORY_STYLES.Finance.hsl },
    politics: { label: "Politics", hsl: CATEGORY_STYLES.Politics.hsl },
    tech: { label: "Tech", hsl: CATEGORY_STYLES.Tech.hsl },
    entertainment: { label: "Entertainment", hsl: CATEGORY_STYLES.Entertainment.hsl },
    sports: { label: "Sports", hsl: CATEGORY_STYLES.Sports.hsl },
    market: { label: "Market", hsl: CATEGORY_STYLES.Market.hsl },
    general: { label: "General", hsl: CATEGORY_STYLES.General.hsl },
  };

  const match = categoryMap[normalizedKey] || categoryMap.general;
  return {
    category: normalizedKey,
    label: match.label,
    color: match.hsl,
  };
};

// Get category info based on event icon (legacy support)
export const getCategoryInfoFromIcon = (icon: string): CategoryInfo => {
  switch (icon) {
    case "🐦": // Twitter/Social
      return getCategoryInfo("social");
    case "₿": // Bitcoin
    case "⟠": // Ethereum
      return getCategoryInfo("crypto");
    case "🏦": // Federal Reserve/Banking
    case "📈": // Stock market
      return getCategoryInfo("finance");
    case "🏛️": // Politics
    case "🗳️": // Voting
      return getCategoryInfo("politics");
    case "🚀": // SpaceX
    case "🤖": // AI/Tech
    case "🍎": // Apple
      return getCategoryInfo("tech");
    case "🎬": // Movies
    case "🎵": // Music
    case "🏆": // Awards
      return getCategoryInfo("entertainment");
    case "⚽": // Soccer
    case "🏀": // Basketball
    case "🏈": // Football
      return getCategoryInfo("sports");
    default:
      return getCategoryInfo("general");
  }
};

// Get category from event name as fallback
// Add keywords here when new event types are introduced
export const getCategoryFromName = (name: string): CategoryInfo => {
  const lowerName = name.toLowerCase();
  
  // Social - Twitter, influencers
  if (lowerName.includes("tweet") || lowerName.includes("twitter") || lowerName.includes("elon musk")) {
    return getCategoryInfo("social");
  }
  
  // Crypto - Cryptocurrency
  if (lowerName.includes("bitcoin") || lowerName.includes("btc") || lowerName.includes("ethereum") || lowerName.includes("eth") || lowerName.includes("crypto")) {
    return getCategoryInfo("crypto");
  }
  
  // Finance - Fed, stocks, economy
  if (lowerName.includes("fed") || lowerName.includes("interest rate") || lowerName.includes("s&p") || lowerName.includes("stock") || lowerName.includes("gdp") || lowerName.includes("inflation")) {
    return getCategoryInfo("finance");
  }
  
  // Politics - Government, elections
  if (lowerName.includes("president") || lowerName.includes("election") || lowerName.includes("government") || lowerName.includes("shutdown") || lowerName.includes("congress") || lowerName.includes("senate") || lowerName.includes("vote")) {
    return getCategoryInfo("politics");
  }
  
  // Tech - Technology, space, AI
  if (lowerName.includes("spacex") || lowerName.includes("starship") || lowerName.includes("openai") || lowerName.includes("gpt") || lowerName.includes("tesla") || lowerName.includes("apple") || lowerName.includes("iphone") || lowerName.includes("ai ") || lowerName.includes("rocket") || lowerName.includes("launch")) {
    return getCategoryInfo("tech");
  }
  
  // Entertainment - Movies, music, awards
  if (lowerName.includes("oscar") || lowerName.includes("grammy") || lowerName.includes("emmy") || lowerName.includes("movie") || lowerName.includes("film") || lowerName.includes("album") || lowerName.includes("box office") || lowerName.includes("netflix") || lowerName.includes("disney")) {
    return getCategoryInfo("entertainment");
  }
  
  // Sports - Games, leagues, competitions
  if (lowerName.includes("super bowl") || lowerName.includes("nba") || lowerName.includes("nfl") || lowerName.includes("world cup") || lowerName.includes("championship") || lowerName.includes("playoff") || lowerName.includes("finals") || lowerName.includes("olympics")) {
    return getCategoryInfo("sports");
  }
  
  return getCategoryInfo("general");
};
