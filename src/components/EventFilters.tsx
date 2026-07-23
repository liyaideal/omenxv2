import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MobileDrawer,
  MobileDrawerSection,
} from "@/components/ui/mobile-drawer";

export type EventStatusFilter = "active" | "resolved";

// Props for just the status dropdown (header use)
interface StatusDropdownProps {
  statusFilter: EventStatusFilter;
  onStatusFilterChange: (status: EventStatusFilter) => void;
}

// Props for the filter button and drawer (content area use)
interface FilterDrawerProps {
  statusFilter: EventStatusFilter;
  settlementFilter: string;
  onSettlementFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

interface EventFiltersProps {
  statusFilter: EventStatusFilter;
  onStatusFilterChange: (status: EventStatusFilter) => void;
  settlementFilter: string;
  onSettlementFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

// Status dropdown for header
export const MobileStatusDropdown = ({
  statusFilter,
  onStatusFilterChange,
}: StatusDropdownProps) => {
  const statusOptions: { value: EventStatusFilter; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "resolved", label: "Resolved" },
  ];

  return (
    <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as EventStatusFilter)}>
      <SelectTrigger className="w-[100px] bg-secondary border-border/50 h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Filter button and drawer for content area
export const MobileFilterDrawer = ({
  statusFilter,
  settlementFilter,
  onSettlementFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortByChange,
}: FilterDrawerProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const settlementOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "this-week", label: "This Week" },
    { value: "this-month", label: "This Month" },
    { value: "next-month", label: "Next Month" },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "crypto", label: "Crypto" },
    { value: "finance", label: "Finance" },
    { value: "politics", label: "Politics" },
    { value: "sports", label: "Sports" },
    { value: "tech", label: "Tech" },
  ];

  const sortOptions = [
    { value: "volume", label: "Volume ↓" },
    { value: "ending-soon", label: "Ending Soon" },
    { value: "newest", label: "Newest" },
    { value: "participants", label: "Participants" },
  ];

  // Only show filter for Active events
  if (statusFilter !== "active") {
    return null;
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="icon" 
        className="flex-shrink-0 border-border/50"
        onClick={() => setIsFilterOpen(true)}
      >
        <Filter className="h-4 w-4" />
      </Button>

      <MobileDrawer
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        title="Filters"
      >
        <MobileDrawerSection className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Settlement</label>
            <Select value={settlementFilter} onValueChange={onSettlementFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settlementOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Category</label>
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Sort By</label>
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger>
                <SelectValue />
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

          <Button 
            className="w-full bg-primary hover:bg-primary-hover" 
            onClick={() => setIsFilterOpen(false)}
          >
            Apply Filters
          </Button>
        </MobileDrawerSection>
      </MobileDrawer>
    </>
  );
};

export const EventFilters = ({
  statusFilter,
  onStatusFilterChange,
  settlementFilter,
  onSettlementFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortByChange,
}: EventFiltersProps) => {
  const isMobile = useIsMobile();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const statusOptions: { value: EventStatusFilter; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "resolved", label: "Resolved" },
  ];

  const settlementOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "this-week", label: "This Week" },
    { value: "this-month", label: "This Month" },
    { value: "next-month", label: "Next Month" },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "crypto", label: "Crypto" },
    { value: "finance", label: "Finance" },
    { value: "politics", label: "Politics" },
    { value: "sports", label: "Sports" },
    { value: "tech", label: "Tech" },
  ];

  const sortOptions = [
    { value: "volume", label: "Volume ↓" },
    { value: "ending-soon", label: "Ending Soon" },
    { value: "newest", label: "Newest" },
    { value: "participants", label: "Participants" },
  ];

  // Mobile - should not be used directly anymore, use MobileStatusDropdown and MobileFilterDrawer separately
  if (isMobile) {
    return null;
  }

  // Desktop Filters - No status pills since header has Resolved nav
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap py-2">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Settlement Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">Settlement:</span>
          <Select value={settlementFilter} onValueChange={onSettlementFilterChange}>
            <SelectTrigger className="w-[130px] bg-secondary/50 border-border/30 h-9 hover:bg-secondary transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {settlementOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">Category:</span>
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="w-[150px] bg-secondary/50 border-border/30 h-9 hover:bg-secondary transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">Sort:</span>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[130px] bg-secondary/50 border-border/30 h-9 hover:bg-secondary transition-colors">
            <SelectValue />
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
    </div>
  );
};