import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewportSize = "auto" | "mobile" | "tablet" | "desktop";

interface ViewportSwitcherProps {
  value: ViewportSize;
  onChange: (value: ViewportSize) => void;
  className?: string;
}

export const ViewportSwitcher = ({ value, onChange, className }: ViewportSwitcherProps) => {
  return (
    <div className={cn("flex items-center gap-1 bg-muted/50 rounded-lg p-1", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={value === "auto" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2 gap-1.5"
            onClick={() => onChange("auto")}
          >
            <span className="text-xs">Auto</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Use actual device size</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={value === "mobile" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Mobile (375px)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={value === "tablet" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange("tablet")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Tablet (768px)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={value === "desktop" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Desktop (1280px)</TooltipContent>
      </Tooltip>
    </div>
  );
};

interface ViewportBannerProps {
  viewport: ViewportSize;
  onClose: () => void;
}

export const ViewportBanner = ({ viewport, onClose }: ViewportBannerProps) => {
  if (viewport === "auto") return null;

  const icons = {
    mobile: Smartphone,
    tablet: Tablet,
    desktop: Monitor,
  };
  const Icon = icons[viewport];

  return (
    <div className="mt-2 flex items-center justify-center gap-2 py-1.5 px-3 bg-trading-purple/10 border border-trading-purple/20 rounded-lg">
      <Icon className="h-3.5 w-3.5 text-trading-purple" />
      <span className="text-xs text-trading-purple font-medium">
        Previewing {viewport} layout
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 ml-1 hover:bg-trading-purple/20"
        onClick={onClose}
      >
        <X className="h-3 w-3 text-trading-purple" />
      </Button>
    </div>
  );
};
