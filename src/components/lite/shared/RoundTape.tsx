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
  currentSlot?: TapeCurrentSlot;
  legend?: React.ReactNode;
  isMobile?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const CHIP = 26;

export const RoundTape = ({
  leftLabel,
  chips,
  currentSlot = null,
  legend,
  isMobile,
  className,
  style,
}: Props) => {
  if (chips.length === 0 && !currentSlot) return null;

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

          {currentSlot?.kind === "countdown" && (
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
                  {currentSlot.text}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {currentSlot.tooltip ?? `Current round · closes in ${currentSlot.text}`}
              </TooltipContent>
            </Tooltip>
          )}

          {currentSlot?.kind === "today" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={currentSlot.onClick}
                  className="font-display flex shrink-0 items-center"
                  style={{
                    border: "1.5px solid #2B2F38",
                    borderRadius: 13,
                    padding: "3px 10px",
                    color: "#F2F3F5",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    outline: currentSlot.active
                      ? "1.5px solid currentColor"
                      : undefined,
                  }}
                >
                  NOW
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {currentSlot.tooltip ?? "Today · still trading"}
              </TooltipContent>
            </Tooltip>
          )}

          {currentSlot?.kind === "next" && (
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
                {currentSlot.tooltip ??
                  "Next round starts the moment this one settles"}
              </TooltipContent>
            </Tooltip>
          )}
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
