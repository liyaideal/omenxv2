import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { Filter, Search, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResolvedViewToggle, ResolvedViewMode } from "@/components/resolved/ResolvedViewToggle";

export interface ResolvedFiltersProps {
  category: string;
  onCategoryChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "crypto", label: "Crypto" },
  { value: "politics", label: "Politics" },
  { value: "finance", label: "Finance" },
  { value: "tech", label: "Tech" },
  { value: "sports", label: "Sports" },
  { value: "entertainment", label: "Entertainment" },
];

const isActive = (val: string) => val !== "all" && val !== "";

// Mobile Filter Drawer
interface MobileResolvedFilterDrawerProps extends ResolvedFiltersProps {
  viewMode: ResolvedViewMode;
  onViewModeChange: (value: ResolvedViewMode) => void;
}

export const MobileResolvedFilterDrawer = ({
  viewMode,
  onViewModeChange,
  category,
  onCategoryChange,
  search,
  onSearchChange,
}: MobileResolvedFilterDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);
  const [localCategory, setLocalCategory] = useState(category);

  const handleOpen = () => {
    setLocalSearch(search);
    setLocalCategory(category);
    setIsOpen(true);
  };

  const handleApply = () => {
    onSearchChange(localSearch);
    onCategoryChange(localCategory);
    setIsOpen(false);
  };

  const handleReset = () => {
    onViewModeChange("all");
    setLocalCategory("all");
    onCategoryChange("all");
    setLocalSearch("");
    onSearchChange("");
  };

  const activeCount =
    (search.trim() ? 1 : 0) + (isActive(category) ? 1 : 0);

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

      <MobileDrawer open={isOpen} onOpenChange={setIsOpen} title="Filters">
        <div className="space-y-6">
          {/* View */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">View</label>
            <ResolvedViewToggle value={viewMode} onChange={onViewModeChange} />
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Category</label>
            <Select value={localCategory} onValueChange={setLocalCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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

// Desktop inline filter chips (no card wrapper, matches /events FilterChips)
export const ResolvedFilters = ({
  category,
  onCategoryChange,
  search,
  onSearchChange,
}: ResolvedFiltersProps) => {
  const isMobile = useIsMobile();
  if (isMobile) return null;

  const hasActive = isActive(category);
  const clearAll = () => {
    onCategoryChange("all");
    onSearchChange("");
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search events..."
          className="h-8 w-44 pl-8 text-xs bg-muted/50 border-border/40"
        />
      </div>

      {/* Category */}
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger
          className={`h-8 w-[140px] text-xs ${
            isActive(category)
              ? "bg-primary/15 text-primary border-primary/40"
              : "bg-muted/50 border-border/40"
          }`}
        >
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          {categoryOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(hasActive || search.trim()) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={clearAll}
        >
          <X className="h-3 w-3 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
};
