import { cn } from "@/lib/utils";

export type ResolvedViewMode = "all" | "mine";

interface ResolvedViewToggleProps {
  value: ResolvedViewMode;
  onChange: (next: ResolvedViewMode) => void;
}

const TABS: { id: ResolvedViewMode; label: string }[] = [
  { id: "all", label: "All Resolved" },
  { id: "mine", label: "My Settled" },
];

export const ResolvedViewToggle = ({ value, onChange }: ResolvedViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-0.5">
      {TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
