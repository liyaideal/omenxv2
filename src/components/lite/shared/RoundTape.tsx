// ============================================================
// ROUND TAPE — the ONE history-strip implementation on the Lite surface.
// Used by the crypto quick-round page (label "ROUND / #3332", orange live
// countdown pill, dashed NEXT slot) and by daily up/down stock pages
// (label "PAST DAYS", neutral NOW pill). Density/context differences are
// props — never re-drawn markup.
// ============================================================
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MICRO: React.CSSProperties = {
  fontSize: 9.5,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "#6B7280",
};

export interface TapeChip {
  key: string;
  /** true → ▲ (up axis, Pulse Blue) · false → ▼ (down axis, Volt) */
  up: boolean;
  tooltip: React.ReactNode;
  onClick?: () => void;
  /** Ring the chip that represents the page you are on. */
  active?: boolean;
}

export type TapeCurrentSlot =
  | { kind: "countdown"; text: string; tooltip?: React.ReactNode }
  | { kind: "today"; tooltip?: React.ReactNode; onClick?: () => void; active?: boolean }
  | { kind: "next"; tooltip?: React.ReactNode }
  | null;

interface Props {
  /** Left slot: micro caption plus an optional bold second line. */
  leftLabel: { micro: string; value?: string };
  chips: TapeChip[];
  /** One slot, or several (the quick-round tape shows countdown + NEXT). */
  currentSlot?: TapeCurrentSlot | TapeCurrentSlot[];
  legend?: React.ReactNode;
  isMobile?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const CHIP = 26;
/** Minimum effective hit area for interactive tape slots on touch. */
const TOUCH = 44;

export const RoundTape = ({
  leftLabel,
  chips,
  currentSlot = null,
  legend,
  isMobile,
  className,
  style,
}: Props) => {
  const slots = (Array.isArray(currentSlot) ? currentSlot : [currentSlot]).filter(
    Boolean,
  ) as Exclude<TapeCurrentSlot, null>[];
  if (chips.length === 0 && slots.length === 0) return null;

  return (
    <TooltipProvider delayDuration={120}>
      <div className={className} style={style}>
        <div
          className={cn(
            "flex items-center gap-[6px]",
            isMobile &&
              "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          <div className="shrink-0" style={{ marginRight: 4 }}>
            <div style={MICRO}>{leftLabel.micro}</div>
            {leftLabel.value && (
              <div className="font-display" style={{ fontSize: 13, fontWeight: 700 }}>
                {leftLabel.value}
              </div>
            )}
          </div>

          {chips.map((c) => {
            const Chip = c.onClick ? "button" : "span";
            // Clickable chips on mobile keep the 26px visual but get a ≥44px
            // hit area; negative margins keep the 6px gap and row height intact.
            if (c.onClick && isMobile) {
              return (
                <Tooltip key={c.key}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={c.onClick}
                      className="flex shrink-0 items-center justify-center"
                      style={{
                        minWidth: TOUCH,
                        minHeight: TOUCH,
                        margin: -((TOUCH - CHIP) / 2),
                      }}
                    >
                      <span
                        className="flex items-center justify-center"
                        style={{
                          width: CHIP,
                          height: CHIP,
                          borderRadius: 7,
                          fontSize: 12,
                          background: c.up
                            ? "rgba(51,214,255,.13)"
                            : "rgba(207,255,74,.13)",
                          color: c.up ? "#33D6FF" : "#CFFF4A",
                          outline: c.active ? "1.5px solid currentColor" : undefined,
                        }}
                      >
                        {c.up ? "▲" : "▼"}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{c.tooltip}</TooltipContent>
                </Tooltip>
              );
            }
            return (
              <Tooltip key={c.key}>
                <TooltipTrigger asChild>
                  <Chip
                    type={c.onClick ? "button" : undefined}
                    onClick={c.onClick}
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: CHIP,
                      height: CHIP,
                      borderRadius: 7,
                      fontSize: 12,
                      background: c.up
                        ? "rgba(51,214,255,.13)"
                        : "rgba(207,255,74,.13)",
                      color: c.up ? "#33D6FF" : "#CFFF4A",
                      outline: c.active ? "1.5px solid currentColor" : undefined,
                    }}
                  >
                    {c.up ? "▲" : "▼"}
                  </Chip>
                </TooltipTrigger>
                <TooltipContent>{c.tooltip}</TooltipContent>
              </Tooltip>
            );
          })}

          {slots.map((slot, si) => (
            <span key={si} className="contents">
          {slot.kind === "countdown" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="font-display flex shrink-0 items-center gap-[5px]"
                  style={{
                    border: "1.5px solid #FF8A3D",
                    borderRadius: 13,
                    padding: "3px 10px",
                    color: "#FF8A3D",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#FF8A3D",
                    }}
                  />
                  {slot.text}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {slot.tooltip ?? `Current round · closes in ${slot.text}`}
              </TooltipContent>
            </Tooltip>
          )}

          {slot.kind === "today" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={slot.onClick}
                  className="flex shrink-0 items-center justify-center"
                  style={
                    isMobile
                      ? { minWidth: TOUCH, minHeight: TOUCH, marginTop: -10, marginBottom: -10 }
                      : undefined
                  }
                >
                  <span
                    className="font-display flex items-center"
                    style={{
                      border: "1.5px solid #2B2F38",
                      borderRadius: 13,
                      padding: "3px 10px",
                      color: "#F2F3F5",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: ".06em",
                      outline: slot.active
                        ? "1.5px solid currentColor"
                        : undefined,
                    }}
                  >
                    NOW
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {slot.tooltip ?? "Today · still trading"}
              </TooltipContent>
            </Tooltip>
          )}

          {slot.kind === "next" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="flex shrink-0 items-center justify-center"
                  style={{
                    width: CHIP,
                    height: CHIP,
                    borderRadius: 7,
                    border: "1px dashed #2B2F38",
                    fontSize: 7.5,
                    letterSpacing: ".06em",
                    color: "#6B7280",
                  }}
                >
                  NEXT
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {slot.tooltip ??
                  "Next round starts the moment this one settles"}
              </TooltipContent>
            </Tooltip>
          )}
            </span>
          ))}
        </div>

        {legend && (
          <div
            className="font-display"
            style={{ marginTop: 6, fontSize: 10.5, color: "#6B7280" }}
          >
            {legend}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default RoundTape;
