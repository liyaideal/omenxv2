// ============================================================
// H2E detail — Airdropped positions module (CPO 已批 mock6 §A–§D).
// Sits between ConnectedAccountsCard and H2eRewardsCard.
// Shows pending / activated / expired hedge airdrops (source !== "voucher");
// settled airdrops live in Recent settlements below, never here.
// ============================================================
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useAirdropPositions, type AirdropPosition } from "@/hooks/useAirdropPositions";
import { useRealtimePositionsPnL } from "@/hooks/useRealtimePositionsPnL";
import { useIsMobile } from "@/hooks/use-mobile";

const cents = (p: number) => `${Math.round(p * 100)}¢`;

/** "Activate in {h}h {m}m" — floor on both units. */
const countdownLabel = (expiresAt: string) => {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expiring…";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `Activate in ${h}h ${m}m`;
};

/** Third line of a row. default/unknown source → null (neutral, never invent an origin). */
const sourceLine = (a: AirdropPosition): string | null => {
  if (a.source === "welcome_gift")
    return "Welcome gift — no matching OmenX event for your positions, so we sent one on us";
  if (a.source === "matched" && a.externalEventName)
    return `Matched: ${a.externalEventName} — ${a.externalSide} @ ${cents(a.externalPrice ?? 0)} on Polymarket`;
  return null;
};

export const AirdroppedPositionsCard = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useUserProfile();
  const { activeAccounts } = useConnectedAccounts();
  const { airdrops, activateAirdrop } = useAirdropPositions();
  const { calculateRealtimePnL } = useRealtimePositionsPnL();
  const [busyId, setBusyId] = useState<string | null>(null);

  const hasScanComplete = activeAccounts.some((a) => a.scanStatus === "complete");

  // pending → activated → expired；settled 与 voucher 永不出现在本模块
  const rows = useMemo(() => {
    const order: Record<string, number> = { pending: 0, activated: 1, expired: 2 };
    return airdrops
      .filter((a) => a.source !== "voucher")
      .filter((a) => a.status === "pending" || a.status === "activated" || a.status === "expired")
      .sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
  }, [airdrops]);

  // 徽标只数 pending + activated（与 Connected accounts 行 "Airdrops: n" 同口径）
  const activeCount = rows.filter((r) => r.status !== "expired").length;

  // S0 游客 / S1 未绑定 / 扫描中 / 零行 → 不渲染
  if (!user || activeAccounts.length === 0 || !hasScanComplete || rows.length === 0) return null;

  const livePnl = (a: AirdropPosition): number => {
    const qty = Math.max(1, Math.round(a.airdropValue / Math.max(a.counterPrice, 0.0001)));
    const rt = calculateRealtimePnL({
      event: a.counterEventName,
      option: a.counterOptionLabel,
      optionId: a.optionId ?? null,
      type: a.counterSide as "long" | "short",
      entryPrice: `$${a.counterPrice.toFixed(4)}`,
      size: String(qty),
      margin: `$${a.airdropValue.toFixed(2)}`,
    });
    return rt.hasRealtimePrice ? rt.pnl : 0;
  };

  const handleActivate = async (id: string) => {
    setBusyId(id);
    try {
      await activateAirdrop(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      id="airdropped-positions"
      className="scroll-mt-24 rounded-[16px] border border-[#1D2026] bg-[#131519] p-4 md:p-[18px]"
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
        Airdropped positions{" "}
        <span className="ml-1 font-display text-[11px] tabular-nums normal-case tracking-normal text-[#C9CED6]">
          {activeCount}
        </span>
      </div>
      <p className="mt-1 text-[11.5px] text-[#9AA1AC]">
        Hedge positions we airdropped against your Polymarket exposure. Activate within 72h or they expire.
      </p>

      <div className="mt-3 space-y-3">
        {rows.map((a) => {
          const expired = a.status === "expired";
          const pending = a.status === "pending";
          const activated = a.status === "activated";
          const src = sourceLine(a);
          const pnl = activated ? livePnl(a) : 0;
          const busy = busyId === a.id;

          const mid = (
            <div className="min-w-0 flex-1 space-y-[3px]">
              <div className="truncate text-[13px] font-semibold text-[#F2F3F5]">{a.counterEventName}</div>
              <div className="text-[11px] tabular-nums text-[#9AA1AC]">
                {a.counterOptionLabel} · {a.counterSide} @ {cents(a.counterPrice)} ·{" "}
                <span className={expired ? undefined : "font-semibold text-[#33D6FF]"}>
                  ${a.airdropValue.toFixed(0)} hedge
                </span>
              </div>
              {src && <div className="truncate text-[10.5px] text-[#6B7280]">{src}</div>}
            </div>
          );

          const cd = pending && (
            <span className="font-display text-[11px] font-semibold tabular-nums text-[#FFD666]">
              {countdownLabel(a.expiresAt)}
            </span>
          );

          const activateBtn = pending && (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleActivate(a.id)}
              className={`rounded-[10px] bg-white font-display text-[12.5px] font-bold text-[#0A0B0D] transition-colors hover:bg-[#E6E9EE] disabled:opacity-60 ${
                isMobile ? "h-11 w-full" : "px-4 py-[7px]"
              }`}
            >
              {busy ? "Activating…" : "Activate"}
            </button>
          );

          const liveBits = activated && (
            <>
              <span className="font-display text-[11px] font-semibold tabular-nums text-[#CFFF4A]">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#CFFF4A] align-middle" />
                Live · {pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => navigate("/portfolio")}
                className="font-display text-[11.5px] font-semibold text-[#33D6FF] hover:underline"
              >
                View in portfolio ›
              </button>
            </>
          );

          return (
            <div
              key={a.id}
              className={`rounded-[12px] border border-[#1D2026] bg-[#0F1114] px-3.5 py-[13px] ${
                expired ? "opacity-55" : ""
              }`}
            >
              {isMobile ? (
                <div className="space-y-2.5">
                  {mid}
                  {pending && <div>{cd}</div>}
                  {activateBtn}
                  {activated && <div className="flex items-center justify-between">{liveBits}</div>}
                  {expired && <div className="font-display text-[11.5px] font-bold text-[#6B7280]">Expired</div>}
                </div>
              ) : (
                <div className="flex items-center gap-3.5">
                  {mid}
                  <div className="flex flex-none flex-col items-end gap-1.5">
                    {cd}
                    {activateBtn}
                    {liveBits}
                    {expired && <span className="font-display text-[11.5px] font-bold text-[#6B7280]">Expired</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-[#6B7280]">
        Settled airdrops move to Recent settlements below. Airdrop profit stays locked here until you unlock it by trading.
      </p>
    </div>
  );
};
