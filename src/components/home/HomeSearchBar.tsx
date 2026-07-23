import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Static-looking pill that acts as a tap-target into /events search.
 * Implements the sportsbook hero search affordance without owning input state.
 */
export const HomeSearchBar = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/events")}
      className="flex w-full items-center gap-2.5 rounded-xl border border-border/40 bg-card px-3.5 py-3 text-left text-[14px] text-muted-foreground transition-colors hover:bg-card-hover hover:border-border/70 active:scale-[0.99]"
    >
      <Search className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      <span>Search markets, categories…</span>
    </button>
  );
};
