import { LayoutList, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "grid";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}

export const ViewToggle = ({ view, onChange }: ViewToggleProps) => (
  <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
    <button
      onClick={() => onChange("list")}
      className={cn(
        "p-1.5 transition-colors",
        view === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
      )}
      aria-label="List view"
    >
      <LayoutList className="h-4 w-4" />
    </button>
    <button
      onClick={() => onChange("grid")}
      className={cn(
        "p-1.5 transition-colors",
        view === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
      )}
      aria-label="Grid view"
    >
      <LayoutGrid className="h-4 w-4" />
    </button>
  </div>
);
