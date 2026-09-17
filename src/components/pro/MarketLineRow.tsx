// ============================================================
// SL-P · MarketLineRow — the Pro terminal's fixture market row.
//
// One chip per market group (Winner / Handicap / Total goals / Map n …).
// A chip with more than one line opens a picker listing every line with
// both side prices; picking one switches the terminal to that sibling event
// (the host navigates). Desktop = DropdownMenu, mobile = MobileDrawer.
// Replaces the `Select Option` chip row on fixture events.
// ============================================================
import { forwardRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { cn } from "@/lib/utils";
import { priceCents, type FixtureMarkets, type MarketGroup, type MarketLine } from "@/lib/fixtureMarkets";

export interface MarketLineRowProps {
  markets: FixtureMarkets;
  /** Event id the terminal is currently on (winner or sibling). */
  currentId: string;
  onSelect: (lineId: string) => void;
  variant: "desktop" | "mobile";
  /** Style-guide only: force one group's picker open (desktop dropdown / mobile drawer). */
  previewOpenGroup?: string;
}

const lineCount = (g: MarketGroup) => g.sections.reduce((n, s) => n + s.lines.length, 0);

const chipLine = (g: MarketGroup, currentId: string, byId: FixtureMarkets["byId"]): MarketLine | undefined =>
  byId.get(currentId)?.group.key === g.key ? byId.get(currentId)!.line : byId.get(g.defaultId)?.line;

type ChipProps = {
  group: MarketGroup;
  active: boolean;
  line?: MarketLine;
  hasPicker: boolean;
  onClick?: () => void;
  size: "desktop" | "mobile";
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

// forwardRef: DropdownMenuTrigger (asChild) anchors the popper to this node.
const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { group, active, line, hasPicker, onClick, size, ...rest },
  ref,
) {
  return (
  <button
    ref={ref}
    {...rest}
    type="button"
    onClick={onClick}
    aria-pressed={active}
    aria-haspopup={hasPicker ? "listbox" : undefined}
    className={cn(
      "flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-2.5 transition-colors",
      size === "desktop" ? "h-[30px] text-xs" : "h-8 text-xs",
      active
        ? "border-yes bg-yes/10 text-foreground"
        : "border-border/80 bg-muted/35 text-muted-foreground hover:text-foreground hover:bg-muted/60",
    )}
  >
    <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{group.title}</span>
    {line && (active || lineCount(group) === 1 || group.sections.length === 1) && (
      <span className="font-mono text-foreground">
        {line.short} · {priceCents(line.yes.price)}
      </span>
    )}
    {hasPicker && <ChevronDown className="h-3 w-3 text-muted-foreground" />}
  </button>
  );
});

const LineRows = ({
  group,
  currentId,
  onSelect,
  mobile,
}: {
  group: MarketGroup;
  currentId: string;
  onSelect: (id: string) => void;
  mobile: boolean;
}) => (
  <>
    {group.sections.map((sec, i) => (
      <div key={sec.title}>
        {mobile ? (
          <div className={cn("px-1 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground", i > 0 && "pt-3")}>
            {sec.title}
          </div>
        ) : (
          <>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {sec.title}
            </DropdownMenuLabel>
          </>
        )}
        {sec.lines.map((line) => {
          const on = line.id === currentId;
          const body = (
            <>
              <span className={cn("text-xs", on ? "text-foreground" : "text-foreground/90")}>{line.label}</span>
              <span className="ml-auto flex items-center gap-2.5 font-mono text-[11px]">
                <span className="text-yes">{priceCents(line.yes.price)}</span>
                {!line.single && <span className="text-no">{priceCents(line.no.price)}</span>}
              </span>
            </>
          );
          return mobile ? (
            <button
              key={line.id}
              type="button"
              onClick={() => onSelect(line.id)}
              aria-current={on ? "true" : undefined}
              className={cn(
                "flex w-full items-center rounded-lg px-3 py-3 text-left transition-colors focus:outline-none",
                on ? "bg-primary/10 border border-primary/30" : "bg-muted/30 border border-transparent hover:bg-muted/50",
              )}
            >
              {body}
            </button>
          ) : (
            <DropdownMenuItem
              key={line.id}
              onSelect={() => onSelect(line.id)}
              aria-current={on ? "true" : undefined}
              className={cn("flex items-center gap-4 text-xs", on && "bg-muted")}
            >
              {body}
            </DropdownMenuItem>
          );
        })}
      </div>
    ))}
  </>
);

export const MarketLineRow = ({ markets, currentId, onSelect, variant, previewOpenGroup }: MarketLineRowProps) => {
  const [drawerGroup, setDrawerGroup] = useState<string | null>(previewOpenGroup ?? null);
  const openGroup = markets.groups.find((g) => g.key === drawerGroup) ?? null;
  // Style-guide: open the desktop dropdown one tick after mount so the popper
  // can measure its anchor (opening on first render positions it off-screen).
  const [forcedOpen, setForcedOpen] = useState<string | null>(null);
  useEffect(() => {
    if (!previewOpenGroup) return;
    const t = window.setTimeout(() => setForcedOpen(previewOpenGroup), 80);
    return () => window.clearTimeout(t);
  }, [previewOpenGroup]);

  const chips = markets.groups.map((g) => {
    const active = markets.byId.get(currentId)?.group.key === g.key;
    const line = chipLine(g, currentId, markets.byId);
    const hasPicker = lineCount(g) > 1;

    if (!hasPicker) {
      const only = g.sections[0]?.lines[0];
      return (
        <Chip
          key={g.key}
          group={g}
          active={active}
          line={line}
          hasPicker={false}
          size={variant}
          onClick={() => only && onSelect(only.id)}
        />
      );
    }

    if (variant === "mobile") {
      return (
        <Chip key={g.key} group={g} active={active} line={line} hasPicker size="mobile" onClick={() => setDrawerGroup(g.key)} />
      );
    }

    return (
      <DropdownMenu key={g.key} {...(forcedOpen === g.key ? { open: true } : {})}>
        <DropdownMenuTrigger asChild>
          <Chip group={g} active={active} line={line} hasPicker size="desktop" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[260px]">
          <LineRows group={g} currentId={currentId} onSelect={onSelect} mobile={false} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  });

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-border/30 overflow-x-auto scrollbar-hide",
        variant === "desktop" ? "px-4 py-2" : "px-4 py-2.5",
      )}
      role="group"
      aria-label="Markets"
    >
      {variant === "desktop" && (
        <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mr-1">
          Markets
        </span>
      )}
      {chips}
      {variant === "mobile" && (
        <MobileDrawer
          open={!!openGroup}
          onOpenChange={(o) => !o && setDrawerGroup(null)}
          title={openGroup?.title}
          height="auto"
        >
          {openGroup && (
            <div className="space-y-1.5 pb-2">
              <LineRows
                group={openGroup}
                currentId={currentId}
                onSelect={(id) => {
                  setDrawerGroup(null);
                  onSelect(id);
                }}
                mobile
              />
            </div>
          )}
        </MobileDrawer>
      )}
    </div>
  );
};
