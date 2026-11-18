// ============================================================
// Voucher call card on the Lite trade pages (Boost + Standard).
// Pure presentational — every figure is passed in so the style-guide can
// drive every state. Spec: mock "用券之后" ①③ (CPO 2026-11-18).
//
// Standard is spot: `boost` is only ever > 1 on the Boost page. On Standard
// the title is the side word + the VOUCHER mark — never a multiplier
// (DESIGN.md §Addendum 2026-11-18 · Standard 面不展示杠杆).
// ============================================================
import { hasVoucherProfit } from "@/lib/voucherMath";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

export const VoucherMark = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex h-5 shrink-0 items-center rounded-full border px-2 text-[10px] font-bold uppercase tracking-[0.06em]",
      className,
    )}
    style={{
      color: "#CFFF4A",
      background: "rgba(207,255,74,0.1)",
      borderColor: "rgba(207,255,74,0.3)",
    }}
  >
    {t("vouchers.lite.mark")}
  </span>
);

const usd = (n: number) => `$${n.toFixed(2)}`;

export interface LiteVoucherCardProps {
  /** Leg name — same word the regular position card uses ("76ers", "Lakers · Yes"). */
  sideLabel: string;
  isYes: boolean;
  /** 5 on the Boost page, 1 on Standard (renders no multiplier). */
  boost: number;
  faceValue: number;
  /** What closing now would credit — clamp(rawPnl, 0, cap). */
  credit: number;
  /** Unclamped PnL — only its sign is shown ("down right now"). */
  rawPnl: number;
  cap: number;
  /** Already formatted, e.g. "Nov 21, 13:36". */
  closesBy: string;
  compact?: boolean;
  /** Which page the card sits on. It mirrors its neighbour: "boost" follows
   *  LitePositionCard (coloured side text, 2×2 on mobile); "standard" follows
   *  SpotYourPosition (side chip, always four cells in one row). */
  surface?: "boost" | "standard";
  onCashOut: () => void;
  /** Option id — lets the "View your call" toast action find this card. */
  anchorKey?: string;
  /** Style-guide fixture only: render the card already outlined. */
  flashOpen?: boolean;
}

export const LiteVoucherCard = ({
  sideLabel,
  isYes,
  boost,
  faceValue,
  credit,
  rawPnl,
  cap,
  closesBy,
  compact = false,
  surface = "boost",
  onCashOut,
  anchorKey,
  flashOpen = false,
}: LiteVoucherCardProps) => {
  const winning = hasVoucherProfit(credit);
  const standard = surface === "standard";
  // Four narrow cells on a phone: the date takes the value line, the time the sub line.
  const cut = standard && compact ? closesBy.lastIndexOf(", ") : -1;
  const closesDate = cut > 0 ? closesBy.slice(0, cut) : closesBy;
  const closesTime = cut > 0 ? closesBy.slice(cut + 2) : undefined;
  return (
    <div
      className={cn("rounded-2xl border border-border bg-card p-4", flashOpen && "lite-call-flash")}
      data-lite-your-call={anchorKey ?? ""}
      data-lite-voucher-card=""
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
        {standard ? (
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-semibold",
              isYes ? "bg-yes/14 text-yes" : "bg-no/14 text-no",
            )}
          >
            {sideLabel}
          </span>
        ) : (
        <span>
          <span className={isYes ? "text-yes" : "text-no"}>{sideLabel}</span>
          {boost > 1 && (
            <span className="text-foreground">
              {" · "}
              <span className="font-mono">{boost}×</span>{" "}
              {t("trade.screen.lite.lite_contract_account_sections.boost")}
            </span>
          )}
        </span>
        )}
        <VoucherMark />
      </div>

      <div
        className={cn(
          "grid gap-2 border-t border-border pt-3 text-xs",
          compact && !standard ? "grid-cols-2" : "grid-cols-4",
        )}
      >
        <Cell label={t("vouchers.lite.card.voucher")} value={usd(faceValue)} />
        <Cell
          label={t("vouchers.lite.card.profit_now")}
          value={winning ? `+${usd(credit)}` : usd(0)}
          tone={winning ? "up" : undefined}
          sub={rawPnl < 0 ? t("vouchers.lite.card.down_now") : undefined}
        />
        <Cell label={t("vouchers.lite.card.max_profit")} value={usd(cap)} />
        <Cell label={t("vouchers.lite.card.closes_by")} value={closesDate} sub={closesTime} />
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <button
          type="button"
          onClick={onCashOut}
          className="h-9 w-full rounded-lg bg-muted px-2 text-xs font-semibold hover:bg-muted/80"
        >
          {winning ? (
            <CashOutKeepLabel amount={`+${usd(credit)}`} />
          ) : (
            t("common.cash_out")
          )}
        </button>
      </div>
    </div>
  );
};

/** "Cash out · keep +$0.04" with the amount in the numeric face. */
export const CashOutKeepLabel = ({ amount }: { amount: string }) => {
  const [before, after] = t("vouchers.lite.cash_out_keep", { amount: "\u0000" }).split("\u0000");
  return (
    <span>
      {before}
      <span className="font-mono">{amount}</span>
      {after}
    </span>
  );
};

const Cell = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "up";
}) => (
  <div className="min-w-0">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div
      className={cn(
        "font-mono text-sm font-semibold",
        tone === "up" ? "text-trading-green" : "text-foreground",
      )}
    >
      {value}
    </div>
    {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
  </div>
);
