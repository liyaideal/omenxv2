import * as React from "react";
import { LucideIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Additional classes for the content container */
  className?: string;
  /** Whether to show the drag handle indicator */
  showHandle?: boolean;
  /** Height of the drawer - can be a fixed height like "h-[85vh]" or "auto" */
  height?: string;
  /** Whether to hide the close button */
  hideCloseButton?: boolean;
}

/**
 * MobileDrawer - A reusable bottom sheet component for mobile
 * 
 * Features:
 * - Rounded top corners
 * - Drag handle indicator
 * - Safe area padding for bottom navigation
 * - Consistent styling across the app
 * 
 * @example
 * ```tsx
 * <MobileDrawer
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Settings"
 *   description="Manage your preferences"
 * >
 *   <div>Content here</div>
 * </MobileDrawer>
 * ```
 */
export function MobileDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showHandle = true,
  height,
  hideCloseButton = false,
}: MobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-3xl px-5 pt-4 max-h-[85vh] overflow-y-auto",
          height,
          hideCloseButton && "[&>button]:hidden",
          className
        )}
      >
        {/* Drag handle indicator */}
        {showHandle && (
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
        )}
        
        {/* Header with title and description */}
        {(title || description) && (
          <SheetHeader className="text-left mb-4">
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        
        {/* Content */}
        {children}
      </SheetContent>
    </Sheet>
  );
}

interface MobileDrawerSectionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * MobileDrawerSection - A styled section within the drawer
 */
export function MobileDrawerSection({ children, className }: MobileDrawerSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  );
}

interface MobileDrawerActionsProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * MobileDrawerActions - Container for action buttons at the bottom of the drawer
 */
export function MobileDrawerActions({ children, className }: MobileDrawerActionsProps) {
  return (
    <div className={cn("mt-4 pt-4 border-t border-border space-y-3", className)}>
      {children}
    </div>
  );
}

interface MobileDrawerListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * MobileDrawerList - A list container for menu items
 */
export function MobileDrawerList({ children, className }: MobileDrawerListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
}

interface MobileDrawerListItemProps {
  icon?: LucideIcon | React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * MobileDrawerListItem - A clickable list item for the drawer
 */
export function MobileDrawerListItem({
  icon: Icon,
  label,
  description,
  onClick,
  className,
  disabled = false,
}: MobileDrawerListItemProps) {
  const renderIcon = () => {
    if (!Icon) return null;
    // Check if it's already a React element
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    // Check if it's a component (Lucide icons are ForwardRefExoticComponent)
    if (typeof Icon === 'object' && Icon !== null && '$$typeof' in Icon) {
      const IconComponent = Icon as unknown as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-5 h-5 text-muted-foreground shrink-0" />;
    }
    // Check if it's a function component
    if (typeof Icon === 'function') {
      const IconComponent = Icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-5 h-5 text-muted-foreground shrink-0" />;
    }
    // Otherwise render as ReactNode (string, emoji, etc.)
    return <span className="text-2xl shrink-0">{Icon as React.ReactNode}</span>;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors text-left",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {renderIcon()}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
    </button>
  );
}

interface MobileDrawerStatusProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  className?: string;
}

/**
 * MobileDrawerStatus - A status indicator with icon for loading/success/error states
 */
export function MobileDrawerStatus({
  icon,
  title,
  description,
  variant = "default",
  className,
}: MobileDrawerStatusProps) {
  const bgColors = {
    default: "bg-primary/10",
    success: "bg-trading-green/20",
    error: "bg-trading-red/10",
    warning: "bg-trading-yellow/10",
  };

  const textColors = {
    default: "text-foreground",
    success: "text-trading-green",
    error: "text-trading-red",
    warning: "text-trading-yellow",
  };

  return (
    <div className={cn("py-8 text-center", className)}>
      <div className={cn(
        "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
        bgColors[variant]
      )}>
        {icon}
      </div>
      <p className={cn("font-medium", textColors[variant])}>{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}

