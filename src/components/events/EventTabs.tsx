import { cn } from "@/lib/utils";
import { Flame, Star } from "lucide-react";
import { CATEGORY_STYLES } from "@/lib/categoryUtils";

export type EventTab = string;

const FIXED_TABS: { key: string; label: string; icon?: React.ReactNode }[] = [
  { key: "all", label: "All" },
  { key: "hot", label: "Hot", icon: <Flame className="h-3.5 w-3.5" /> },
  { key: "watchlist", label: "Watchlist", icon: <Star className="h-3.5 w-3.5" /> },
];

// Category display order from CATEGORY_STYLES (excluding fallback entries)
const CATEGORY_ORDER = Object.keys(CATEGORY_STYLES).filter(
  (k) => k !== "Market" && k !== "General"
);

interface EventTabsProps {
  active: EventTab;
  onChange: (tab: EventTab) => void;
  categories: string[]; // unique category keys from actual data
}

export const EventTabs = ({ active, onChange, categories }: EventTabsProps) => {
  // Sort categories by CATEGORY_STYLES order; unknown ones go last
  const sortedCategories = [...categories].sort((a, b) => {
    const aIdx = CATEGORY_ORDER.findIndex((k) => k.toLowerCase() === a.toLowerCase());
    const bIdx = CATEGORY_ORDER.findIndex((k) => k.toLowerCase() === b.toLowerCase());
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  // Build display label from CATEGORY_STYLES key
  const getLabel = (cat: string) => {
    const match = CATEGORY_ORDER.find((k) => k.toLowerCase() === cat.toLowerCase());
    return match || cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-0.5">
      {FIXED_TABS.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
            active === key
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {icon}
          {label}
        </button>
      ))}
      {sortedCategories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
            active === cat
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {getLabel(cat)}
        </button>
      ))}
    </div>
  );
};
