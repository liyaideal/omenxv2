import { useVoucherEarnings } from "@/hooks/useVoucherEarnings";
import { VOUCHER_TIERS, formatTierCap, deriveVoucherTierState } from "@/lib/voucherTiers";
import { VT, money, compactMoney } from "./voucherTokens";

/**
 * Voucher earnings hero — data opening of the Vouchers surface.
 * Frozen spec: OmenX Lite Vouchers v2 Final, frames 1/2/5.
 * Desktop = two cells (1fr / 392px) inside one #131519 r16 shell, single
 * hairline between, zero glow. Mobile stacks the tier cell underneath.
 */
interface Props {
  /** Optional override (for /style-guide playground). */
  data?: {
    pending: number;
    lifetimeCredited: number;
    volume: number;
    depositTotal?: number;
  };
  /** Summary strip counts. */
  stats?: {
    readyCount: number;
    readyValue: number;
    activeCount: number;
    activeValue: number;
    redeemedCount: number;
  };
  mobile?: boolean;
  /** Secondary CTA when nothing is claimable yet. */
  onRedeemPrompt?: () => void;
}

const Caps = ({ children, color = VT.muted, size = 10, ls = ".14em" }: { children: React.ReactNode; color?: string; size?: number; ls?: string }) => (
  <span
    className="font-display uppercase"
    style={{ fontSize: size, fontWeight: 700, letterSpacing: ls, color }}
  >
    {children}
  </span>
);

export const VoucherEarningsCard = ({ data, stats, mobile, onRedeemPrompt }: Props = {}) => {
  const live = useVoucherEarnings();
  const pending = data?.pending ?? live.pending;
  const lifetimeCredited = data?.lifetimeCredited ?? live.lifetimeCredited;
  const volume = data?.volume ?? live.volume;
  const depositTotal = data?.depositTotal ?? live.depositTotal;
  const loading = data ? false : live.loading;
  const claiming = live.claiming;

  const tierState = data
    ? deriveVoucherTierState(volume, pending, lifetimeCredited, depositTotal)
    : live.tierState;
  const canClaim = data ? tierState.claimable > 0 : live.canClaim;
  const { current, next, claimable, nextProgress } = tierState;

  const topTier = VOUCHER_TIERS[VOUCHER_TIERS.length - 1];
  const topVolume = topTier.unlock.kind === "volume" ? topTier.unlock.amount : 0;

  const nextLine = (() => {
    if (!next || !nextProgress) return "Top tier reached — the full pending balance is claimable.";
    if (nextProgress.kind === "deposit") return `$${money(nextProgress.remaining)} more deposit to ${next.label}`;
    if (nextProgress.kind === "volume") return `$${money(nextProgress.remaining)} more volume to ${next.label}`;
    return "";
  })();

  const capLine = current
    ? `${current.label} releases up to ${formatTierCap(current)} per claim. Higher volume raises the cap.`
    : "Trade to unlock claim caps.";

  /* ------------------------------ left cell ------------------------------ */
  const leftCell = (
    <div className="flex flex-col gap-[10px]" style={{ padding: mobile ? 16 : "20px 22px" }}>
      <Caps>Voucher earnings</Caps>
      <div className="flex items-end gap-[9px]">
        <span
          className="font-display tabular-nums"
          style={{
            fontSize: mobile ? 36 : 44,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: "-.03em",
            color: VT.blue,
          }}
        >
          ${loading ? "—" : money(pending)}
        </span>
        <span style={{ fontSize: mobile ? 12 : 13, fontWeight: 600, color: VT.ink3, paddingBottom: mobile ? 4 : 5 }}>
          USDC pending
        </span>
      </div>
      <div style={{ fontSize: 11.5, lineHeight: 1.55, color: VT.ink3, maxWidth: 430 }}>
        Tiered voucher profit accrues here — unlock claim caps by depositing and trading. Instant vouchers pay
        straight to your Standard balance.
      </div>

      {stats && (
        <div
          className="flex items-center gap-[14px] flex-wrap rounded-[10px]"
          style={{
            marginTop: 4,
            background: VT.surfaceInset,
            border: `1px solid ${VT.line}`,
            padding: mobile ? "10px 12px" : "10px 14px",
          }}
        >
          <span className="flex items-baseline gap-[7px]">
            <Caps size={9.5} ls=".12em">{mobile ? "Ready" : "Ready to claim"}</Caps>
            <span className="font-display tabular-nums" style={{ fontSize: 15, lineHeight: 1, fontWeight: 700, color: VT.volt }}>
              {stats.readyCount}
            </span>
            <span className="tabular-nums" style={{ fontSize: 11, color: VT.muted }}>${Math.round(stats.readyValue)}</span>
          </span>
          <span style={{ width: 1, height: 12, background: VT.line2 }} />
          <span className="flex items-baseline gap-[7px]">
            <Caps size={9.5} ls=".12em">Active</Caps>
            <span className="font-display tabular-nums" style={{ fontSize: 15, lineHeight: 1, fontWeight: 700, color: VT.ink }}>
              {stats.activeCount}
            </span>
            <span className="tabular-nums" style={{ fontSize: 11, color: VT.muted }}>${Math.round(stats.activeValue)}</span>
          </span>
        </div>
      )}

      <div
        className="flex items-center gap-[12px] mt-auto"
        style={{ paddingTop: 12, borderTop: `1px solid ${VT.line}` }}
      >
        <span className="flex items-baseline gap-[6px]">
          <span style={{ fontSize: 11.5, color: VT.muted }}>Lifetime claimed</span>
          <span className="font-display tabular-nums" style={{ fontSize: 12.5, fontWeight: 700, color: VT.ink }}>
            ${money(lifetimeCredited)}
          </span>
        </span>
        {stats && (
          <>
            <span style={{ width: 1, height: 11, background: VT.line2 }} />
            <span className="flex items-baseline gap-[6px]">
              <span style={{ fontSize: 11.5, color: VT.muted }}>Vouchers redeemed</span>
              <span className="font-display tabular-nums" style={{ fontSize: 12.5, fontWeight: 700, color: VT.ink }}>
                {stats.redeemedCount}
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  );

  /* ------------------------------ right cell ----------------------------- */
  const rightCell = (
    <div
      className="flex flex-col gap-[12px]"
      style={{
        background: VT.surfaceInset,
        borderLeft: mobile ? undefined : `1px solid ${VT.line}`,
        borderTop: mobile ? `1px solid ${VT.line}` : undefined,
        padding: mobile ? "14px 16px" : "18px 20px",
      }}
    >
      <div className="flex items-center justify-between">
        <Caps>Payout tier</Caps>
        <Caps ls=".06em" color={current ? VT.volt : VT.muted}>{current ? current.label : "Not started"}</Caps>
      </div>

      <div className="flex gap-[4px]">
        {VOUCHER_TIERS.map((t) => {
          const reached = !!current && current.id > t.id;
          const isCurrent = current?.id === t.id;
          return (
            <span
              key={t.id}
              className="flex-1 rounded-[3px]"
              style={{
                height: 6,
                boxSizing: "border-box",
                background: reached ? VT.volt : VT.railOff,
                border: isCurrent ? `1px solid ${VT.volt}` : undefined,
              }}
            />
          );
        })}
      </div>

      <div className="grid gap-[4px]" style={{ gridTemplateColumns: `repeat(${VOUCHER_TIERS.length},minmax(0,1fr))` }}>
        {VOUCHER_TIERS.map((t) => (
          <span key={t.id} className="flex flex-col gap-[1px]">
            <Caps size={9.5} ls=".08em" color={current?.id === t.id ? VT.volt : VT.muted}>{t.label}</Caps>
            <span className="font-display tabular-nums" style={{ fontSize: 9.5, fontWeight: 600, color: VT.muted2 }}>
              {t.unlock.kind === "none"
                ? "$0"
                : t.unlock.kind === "deposit"
                  ? `${compactMoney(t.unlock.amount)} dep`
                  : compactMoney(t.unlock.amount)}
            </span>
          </span>
        ))}
      </div>

      <div
        className="flex items-baseline justify-between gap-[8px]"
        style={{ paddingTop: 9, borderTop: `1px solid ${VT.line}` }}
      >
        <span style={{ fontSize: 11, color: VT.muted }}>Traded volume</span>
        <span className="font-display tabular-nums" style={{ fontSize: 11.5, fontWeight: 700, color: VT.ink }}>
          ${money(volume)} <span style={{ color: VT.muted, fontWeight: 600 }}>/ {compactMoney(topVolume)}</span>
        </span>
      </div>
      <div className="tabular-nums" style={{ fontSize: 11, color: VT.ink3 }}>{nextLine}</div>
      <div style={{ fontSize: 11.5, lineHeight: 1.5, color: VT.ink3 }}>{capLine}</div>

      {canClaim ? (
        <button
          type="button"
          onClick={live.claim}
          disabled={claiming || !!data}
          className="font-display w-full rounded-[10px] mt-auto"
          style={{
            minHeight: 44,
            border: "none",
            background: "#FFFFFF",
            color: "#0A0B0D",
            fontSize: 13,
            fontWeight: 700,
            cursor: claiming ? "default" : "pointer",
          }}
        >
          {claiming ? "Claiming…" : `Claim $${money(claimable)} to wallet`}
        </button>
      ) : (
        <button
          type="button"
          onClick={onRedeemPrompt}
          disabled={!onRedeemPrompt}
          className="font-display w-full rounded-[10px] mt-auto"
          style={{
            minHeight: 44,
            border: `1px solid ${VT.line3}`,
            background: "transparent",
            color: onRedeemPrompt ? VT.ink : VT.muted2,
            fontSize: 13,
            fontWeight: 600,
            cursor: onRedeemPrompt ? "pointer" : "default",
          }}
        >
          Redeem a voucher
        </button>
      )}
    </div>
  );

  return (
    <section
      className="overflow-hidden rounded-[16px]"
      style={{
        background: VT.surfaceRow,
        border: `1px solid ${VT.line}`,
        display: "grid",
        gridTemplateColumns: mobile ? "1fr" : "1fr 392px",
      }}
    >
      {leftCell}
      {rightCell}
    </section>
  );
};
