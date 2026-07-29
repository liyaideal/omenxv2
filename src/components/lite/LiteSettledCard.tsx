// ============================================================
// Settled market card for the Lite surface. Visual sibling of
// LiteEventCard with exactly three swaps: result/neutral tag pill,
// a single winner row instead of the two price chips, and a
// "Settled …" footer. Consumer wording only.
// ============================================================
import { Check } from "lucide-react";
import type { ResolvedEvent } from "@/hooks/useResolvedEvents";
import { liteSideName } from "@/lib/liteSideName";

interface Props {
  event: ResolvedEvent;
  onSelect: (eventId: string) => void;
}

const MICROLABEL: Record<string, string> = {
  stocks: "Stocks",
  crypto: "Crypto",
  tech: "Tech",
  macro: "Macro",
  politics: "Macro",
  finance: "Stocks",
  sports: "Sports",
  entertainment: "Entertainment",
  social: "Social",
};

const CATEGORY_IMAGE: Record<string, string> = {
  stocks: "/card-bg/finance.jpg",
  finance: "/card-bg/finance.jpg",
  macro: "/card-bg/finance.jpg",
  politics: "/card-bg/politics.jpg",
  crypto: "/card-bg/crypto.jpg",
  tech: "/card-bg/tech.jpg",
  sports: "/card-bg/sports.jpg",
  entertainment: "/card-bg/entertainment.jpg",
  social: "/card-bg/social.jpg",
};

const STRIPE_FALLBACK =
  "repeating-linear-gradient(135deg,#1D2026,#1D2026 12px,#131519 12px,#131519 24px)";
const SCRIM = "linear-gradient(to top, rgba(10,11,13,0.85), transparent 60%)";

/** Same date-tier logic as the live card, past tense. */
export const settledFooter = (settledAt: string | null): string | null => {
  if (!settledAt) return null;
  const when = new Date(settledAt);
  if (isNaN(when.getTime())) return null;
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(when)) / 86_400_000);
  const hhmm = when.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (dayDiff <= 0) return `Settled today ${hhmm}`;
  if (dayDiff === 1) return "Settled yesterday";
  if (dayDiff <= 6)
    return `Settled ${when.toLocaleDateString(undefined, { weekday: "short" })}`;
  if (dayDiff <= 300)
    return `Settled ${when.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  return `Settled ${when.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
};

/**
 * Winner label + market axis, using the same side_labels alias resolution the
 * live card uses. A negative-alias winner ("Not Up") never renders verbatim.
 */
export const resolveWinner = (event: ResolvedEvent) => {
  const alias = (event.sideLabels?.yes ?? "").trim().toLowerCase();
  const lc = (s: string) => s.trim().toLowerCase();
  const yesOpt =
    (alias && event.options.find((o) => lc(o.label) === alias)) ||
    event.options.find((o) => ["yes", "up"].includes(lc(o.label))) ||
    event.options[0];
  const winner =
    event.options.find((o) => o.is_winner) ||
    event.options.find((o) => (o.final_price ?? 0) >= 0.5) ||
    null;
  if (!winner || !yesOpt) return null;
  const winnerIsYes = winner.id === yesOpt.id;
  const raw = winnerIsYes
    ? event.sideLabels?.yes ?? winner.label
    : event.sideLabels?.no ?? winner.label;
  const isNegativeAlias = lc(raw) === "not up";
  const label = isNegativeAlias ? "No — didn't go up" : liteSideName(raw);
  return { winnerIsYes, label };
};

const money = (n: number) => `$${Math.abs(n).toFixed(2)}`;

export const LiteSettledCard = ({ event, onSelect }: Props) => {
  const categoryRaw = (event.category || "").toLowerCase();
  const microlabel = MICROLABEL[categoryRaw] ?? "Market";
  const image = (event as { imageUrl?: string | null }).imageUrl ?? CATEGORY_IMAGE[categoryRaw];
  const footer = settledFooter(event.settled_at);
  const winner = resolveWinner(event);

  const result = event.userParticipated ? event.userPnl ?? 0 : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(event.id)}
      className="mkt-card group flex w-full flex-col overflow-hidden rounded-[16px] border border-[#1D2026] bg-[#131519] text-left"
    >
      <div
        className="relative h-[130px] w-full"
        style={{
          backgroundImage: image ? `${SCRIM}, url("${image}")` : STRIPE_FALLBACK,
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
        }}
      >
        {result === null ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#242830] px-3 py-[5px] text-[11px] font-semibold text-[#C9CED6]">
            Settled
          </span>
        ) : result >= 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-trading-green px-3 py-[5px] font-mono text-[11px] font-semibold text-[#0A0B0D]">
            Won +{money(result)}
          </span>
        ) : (
          <span className="absolute left-3 top-3 rounded-full bg-trading-red/85 px-3 py-[5px] font-mono text-[11px] font-semibold text-[#0A0B0D]">
            Lost −{money(result)}
          </span>
        )}
      </div>

      <div className="p-[18px]">
        <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#6B7280]">
          {microlabel}
        </div>
        <h3 className="mt-[7px] mb-4 min-h-[42px] font-display text-[17px] font-bold leading-[1.2] text-foreground">
          {event.name}
        </h3>

        {winner && (
          <div
            className={
              winner.winnerIsYes
                ? "flex items-center justify-center gap-1.5 rounded-[11px] bg-yes/14 py-[11px] text-sm font-bold text-yes"
                : "flex items-center justify-center gap-1.5 rounded-[11px] bg-no/14 py-[11px] text-sm font-bold text-no"
            }
          >
            <Check className="h-4 w-4" />
            {winner.label} won
          </div>
        )}

        <div className="mt-[14px] flex justify-end text-[11px] text-[#6B7280]">
          {footer && <span>{footer}</span>}
        </div>
      </div>
    </button>
  );
};

export default LiteSettledCard;
