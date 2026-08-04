// ============================================================
// EDITOR'S PICKS — "What's worth watching?"
// Ops-curated module between the Sports module and the catalogue.
// Pixel contract: docs/design-contracts/list-final-touches-11.html (11A / 11B).
// ============================================================
import { useNavigate } from "react-router-dom";
import { CardArtTile } from "@/components/lite/CardArtTile";
import { cardImageFor, microlabelFor } from "@/components/lite/categoryArt";
import {
  EditorPick,
  formatPickVolume,
  pickHref,
  relativeSince,
} from "./editorialPicks";

const cents = (p: number) => `${Math.round(p * 100)}¢`;

const MICRO: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#6B7280",
  fontWeight: 700,
};

/** Tier-2 outcome chip — neutral surface, only the price is coloured. */
const OutcomeChip = ({
  label,
  price,
  tone,
  compact,
  onClick,
}: {
  label: string;
  price: number;
  tone: string;
  compact?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="chip-t2 flex flex-1 items-center justify-between"
    style={{
      minHeight: 48,
      padding: compact ? "0 12px" : "0 13px",
      borderRadius: 9,
      color: tone,
    }}
  >
    <span style={{ fontSize: 11, color: "#9AA1AC" }}>{label}</span>
    <span
      className="font-display"
      style={{
        fontSize: compact ? 16 : 17,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {cents(price)}
    </span>
  </button>
);

const ReasonStrip = ({ note, compact }: { note: string; compact?: boolean }) => (
  <span
    className="flex"
    style={{
      gap: compact ? 9 : 10,
      background: "#0A0B0D",
      border: "1px solid #23262D",
      borderRadius: compact ? 11 : 12,
      padding: compact ? "10px 12px" : "11px 13px",
    }}
  >
    <span
      className="font-display shrink-0"
      style={{
        fontSize: compact ? 20 : 22,
        lineHeight: 0.9,
        color: "#33D6FF",
        fontWeight: 700,
      }}
      aria-hidden
    >
      &ldquo;
    </span>
    <span className="flex min-w-0 flex-col" style={{ gap: 3 }}>
      <span style={{ ...MICRO, letterSpacing: "0.16em" }}>Why this</span>
      <span
        style={{
          fontSize: 12,
          color: "#C9CED6",
          lineHeight: 1.45,
          minHeight: compact ? undefined : 53,
        }}
      >
        {note}
      </span>
    </span>
  </span>
);

const PickCard = ({
  pick,
  compact,
  priority,
}: {
  pick: EditorPick;
  compact?: boolean;
  priority?: boolean;
}) => {
  const navigate = useNavigate();
  const go = (optionId?: string | null) => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(pickHref(pick, optionId));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(pickHref(pick))}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(pickHref(pick));
      }}
      className="mkt-card flex cursor-pointer flex-col overflow-hidden text-left"
      style={{
        background: "#131519",
        border: "1px solid #1D2026",
        borderRadius: compact ? 14 : 16,
      }}
    >
      <CardArtTile
        src={cardImageFor(pick.category, pick.imageUrl)}
        priority={priority}
        className={compact ? "h-[96px]" : "h-[118px]"}
      />
      <div
        className="flex flex-1 flex-col"
        style={{
          padding: compact ? "13px 14px 14px" : "14px 16px 16px",
          gap: compact ? 11 : 12,
        }}
      >
        <span style={MICRO}>{microlabelFor(pick.category)}</span>
        <span
          style={{
            fontSize: compact ? 14 : 16,
            color: "#fff",
            fontWeight: 600,
            lineHeight: 1.3,
            minHeight: compact ? undefined : 63,
          }}
        >
          {pick.name}
        </span>
        <ReasonStrip note={pick.note} compact={compact} />
        {compact && (
          <span
            style={{ fontSize: 10, color: "#6B7280", fontVariantNumeric: "tabular-nums" }}
          >
            {formatPickVolume(pick.volume)}
          </span>
        )}
        <span
          className="flex"
          style={{ gap: compact ? 7 : 8, marginTop: compact ? undefined : "auto" }}
        >
          <OutcomeChip
            label={pick.yesLabel}
            price={pick.yesPrice}
            tone="#33D6FF"
            compact={compact}
            onClick={go(pick.yesOptionId)}
          />
          <OutcomeChip
            label={pick.noLabel}
            price={pick.noPrice}
            tone="#CFFF4A"
            compact={compact}
            onClick={go(pick.noOptionId)}
          />
        </span>
        {!compact && (
          <span
            style={{ fontSize: 11, color: "#6B7280", fontVariantNumeric: "tabular-nums" }}
          >
            {formatPickVolume(pick.volume)}
          </span>
        )}
      </div>
    </div>
  );
};

export const EditorPicksModule = ({
  picks,
  updatedAt,
  isMobile = false,
}: {
  picks: EditorPick[];
  updatedAt: Date | null;
  isMobile?: boolean;
}) => {
  // No valid pick (or every pick missing its reason) → module disappears.
  if (picks.length === 0) return null;

  if (isMobile) {
    return (
      <section className="flex flex-col" style={{ gap: 12 }}>
        <div className="flex flex-col" style={{ gap: 6 }}>
          <h2
            className="font-display"
            style={{
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            What's worth watching?
          </h2>
          <p style={{ fontSize: 12, color: "#9AA1AC" }}>
            Hand-picked markets — and why we think they matter. Winning shares pay{" "}
            <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>.
          </p>
          <span style={{ ...MICRO, fontSize: 10 }}>
            Picked by the OmenX desk · {relativeSince(updatedAt)}
          </span>
        </div>
        {picks.map((p, i) => (
          <PickCard key={p.id} pick={p} compact priority={i === 0} />
        ))}
      </section>
    );
  }

  return (
    <section
      className="flex flex-col"
      style={{
        gap: 16,
      }}
    >
      <div className="flex items-end justify-between" style={{ gap: 24 }}>
        <div className="flex flex-col" style={{ gap: 7 }}>
          <h2
            className="font-display"
            style={{
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            What's worth watching?
          </h2>
          <p style={{ fontSize: 13, color: "#9AA1AC" }}>
            Hand-picked markets — and why we think they matter. Winning shares pay{" "}
            <strong style={{ color: "#fff", fontWeight: 600 }}>$1</strong>.
          </p>
        </div>
        <span className="flex shrink-0 items-center" style={{ gap: 9 }}>
          <span style={{ ...MICRO, fontSize: 10 }}>Picked by the OmenX desk</span>
          <span style={{ fontSize: 12, color: "#9AA1AC", fontWeight: 600 }}>
            Updated {relativeSince(updatedAt)}
          </span>
        </span>
      </div>
      <div className="grid gap-[16px]" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {picks.map((p) => (
          <PickCard key={p.id} pick={p} />
        ))}
      </div>
    </section>
  );
};

export default EditorPicksModule;