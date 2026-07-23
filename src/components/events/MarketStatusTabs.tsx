import { useNavigate } from "react-router-dom";

interface MarketStatusTabsProps {
  active: "active" | "resolved";
}

/**
 * Active / Resolved segmented control shown on Events and Resolved pages.
 * Single click navigates between the two pages — no extra hop to reach
 * tradeable markets.
 */
export const MarketStatusTabs = ({ active }: MarketStatusTabsProps) => {
  const navigate = useNavigate();

  const items: { key: "active" | "resolved"; label: string; path: string }[] = [
    { key: "active", label: "Active", path: "/events" },
    { key: "resolved", label: "Resolved", path: "/resolved" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Market status"
      className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-muted/20 p-1"
    >
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              if (!isActive) navigate(item.path);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary/15 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
