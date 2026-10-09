// ============================================================
// TABLE chip — matte face + inner edge rings (no gloss, no sphere).
// Sizes: tray 44 px · on-zone 28 px · drag ghost 44 px.
// A chip can carry a Boost badge (×N). Pending chips spin a cancel ring.
// ============================================================
import { CHIP_STYLE, type Boost, type ChipValue } from "./tableMath";

interface Props {
  value: ChipValue;
  boost?: Boost | number;
  size?: 44 | 28;
  selected?: boolean;
  pending?: boolean;
  queued?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  /** Spread pointer handlers etc. */
  [k: string]: unknown;
}

const RING = "inset 0 0 0 3px rgba(0,0,0,.22),inset 0 0 0 4px rgba(255,255,255,.35)";
const RING_SM = "inset 0 0 0 2px rgba(0,0,0,.22),inset 0 0 0 3px rgba(255,255,255,.35)";

export const TableChip = ({ value, boost = 1, size = 44, selected, pending, queued, onClick, style, className, ...rest }: Props) => {
  const face = CHIP_STYLE[value];
  const sm = size === 28;
  const shadow = sm
    ? `${RING_SM},0 2px 0 rgba(0,0,0,.5)`
    : selected
      ? `${RING},0 7px 0 rgba(0,0,0,.5),0 14px 22px rgba(0,0,0,.55),0 0 0 2px #141719,0 0 0 3.5px #fff`
      : `${RING},0 3px 0 rgba(0,0,0,.5),0 8px 16px rgba(0,0,0,.55)`;
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', 'Space Grotesk', monospace",
        fontSize: sm ? 9 : 11,
        fontWeight: 700,
        border: 0,
        cursor: sm ? "pointer" : "grab",
        position: "relative",
        touchAction: "none",
        background: face.bg,
        color: face.fg,
        boxShadow: shadow,
        transform: selected && !sm ? "translateY(-4px)" : undefined,
        transition: "transform .15s, box-shadow .15s",
        opacity: queued ? 0.55 : 1,
        outline: queued ? "1px dashed rgba(255,255,255,.5)" : undefined,
        outlineOffset: queued ? 2 : undefined,
        userSelect: "none",
        ...style,
      }}
      {...rest}
    >
      {value}
      {boost > 1 && (
        <span
          style={{
            position: "absolute",
            right: sm ? -7 : -6,
            top: sm ? -7 : -6,
            background: "#0A0A10",
            color: "#fff",
            border: "1px solid rgba(255,255,255,.4)",
            borderRadius: 999,
            fontSize: sm ? 8 : 9,
            padding: sm ? "0 4px" : "1px 5px",
            lineHeight: 1.3,
          }}
        >
          ×{boost}
        </span>
      )}
      {pending && (
        <span
          className="animate-spin"
          style={{
            position: "absolute",
            inset: -5,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#fff",
          }}
        />
      )}
    </button>
  );
};
