import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { ViewToggle, ViewMode } from "./ViewToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChgTimeframe } from "@/hooks/useMarketListData";

export interface FilterState {
  search: string;
  expiry: string;
  sort: string;
}

interface FilterChipsProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  showViewToggle?: boolean;
  chgTimeframe?: ChgTimeframe;
}

const isActive = (val: string) => val !== "all" && val !== "";

const expiryOptions = [
  { value: "all", label: "All Expiry" },
  { value: "24h", label: "< 24h" },
  { value: "7d", label: "< 7d" },
  { value: "30d", label: "< 30d" },
  { value: "30d+", label: "> 30d" },
];

const sortOptions = [
  { value: "volume", label: "Volume ↓" },
  { value: "change", label: "Change ↓" },
  { value: "oi", label: "Total Vol ↓" },
];

// Mobile Filter Drawer for Active events page
export const MobileActiveFilterDrawer = ({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [local, setLocal] = useState(filters);

  const handleOpen = () => {
    setLocal(filters);
    setIsOpen(true);
  };

  const handleApply = () => {
    onChange(local);
    setIsOpen(false);
  };

  const handleReset = () => {
    const reset: FilterState = { search: "", expiry: "all", sort: "volume" };
    setLocal(reset);
    onChange(reset);
  };

  const activeCount = [
    filters.search.trim() ? 1 : 0,
    isActive(filters.expiry) ? 1 : 0,
    filters.sort !== "volume" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full bg-muted/50 relative"
        onClick={handleOpen}
      >
        <Filter className="h-4 w-4" />
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </Button>

      <MobileDrawer
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Filters"
      >
        <div className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={local.search}
                onChange={(e) => setLocal({ ...local, search: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Expiry</label>
            <div className="flex flex-wrap gap-2">
              {expiryOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={local.expiry === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocal({ ...local, expiry: opt.value })}
                  className="flex-1 min-w-[70px]"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Sort By</label>
            <Select value={local.sort} onValueChange={(v) => setLocal({ ...local, sort: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              Reset
            </Button>
            <Button className="flex-1" onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </MobileDrawer>
    </>
  );
};

// Desktop filter chips
export const FilterChips = ({
  filters,
  onChange,
  view,
  onViewChange,
  showViewToggle = true,
}: FilterChipsProps) => {
  const isMobile = useIsMobile();
  const update = (key: keyof FilterState, val: string) =>
    onChange({ ...filters, [key]: val });

  const hasActive =
    isActive(filters.expiry) ||
    filters.sort !== "volume";

  const clearAll = () =>
    onChange({ ...filters, expiry: "all", sort: "volume" });

  // Mobile: don't render inline chips — use MobileActiveFilterDrawer instead
  if (isMobile) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          placeholder="Search events..."
          className="h-8 w-44 pl-8 text-xs bg-muted/50 border-border/40"
        />
      </div>

      {/* Expiry */}
      <Select value={filters.expiry} onValueChange={(v) => update("expiry", v)}>
        <SelectTrigger
          className={`h-8 w-[100px] text-xs ${
            isActive(filters.expiry) ? "bg-primary/15 text-primary border-primary/40" : "bg-muted/50 border-border/40"
          }`}
        >
          <SelectValue placeholder="Expiry" />
        </SelectTrigger>
        <SelectContent>
          {expiryOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={filters.sort} onValueChange={(v) => update("sort", v)}>
        <SelectTrigger
          className={`h-8 w-[110px] text-xs ${
            filters.sort !== "volume" ? "bg-primary/15 text-primary border-primary/40" : "bg-muted/50 border-border/40"
          }`}
        >
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActive && (
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground" onClick={clearAll}>
          <X className="h-3 w-3 mr-1" /> Clear
        </Button>
      )}

      <div className="flex-1" />

      {showViewToggle && <ViewToggle view={view} onChange={onViewChange} />}
    </div>
  );
};