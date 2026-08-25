import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useH2eRewardsSummary } from "@/hooks/useH2eRewardsSummary";

export const H2eCampaignCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const h2e = useH2eRewardsSummary();
  const signedOut = !user;
  const capPct = Math.min((h2e.totalEarned / h2e.earningsCap) * 100, 100);
  return (
    <button
      type="button"
      onClick={() => navigate("/rewards/campaign/h2e")}
      className="w-full overflow-hidden rounded-[14px] border border-[#1D2026] bg-[#0F1114] text-left transition-colors hover:border-[#2B2F38]"
    >
      <div
        className="relative flex min-h-[120px] flex-col justify-between p-4"
        style={{ background: "linear-gradient(135deg, rgba(1,50,129,.55), rgba(51,214,255,.18) 55%, rgba(10,11,13,.2)), #0C0E12" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,11,13,0) 0%, rgba(10,11,13,.55) 55%, rgba(10,11,13,.92) 100%)" }} />
        <div className="relative">
          <span className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em]" style={{ background: "#242830", color: "#C9CED6" }}>
            Always on
          </span>
        </div>
        <div className="relative">
          <div className="font-display text-[17px] font-bold leading-tight text-[#F2F3F5]">Hedge Airdrop Rewards</div>
          <div className="mt-1 font-display text-[11.5px] tabular-nums text-[#C9CED6]">Always valid · Platform program</div>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {!signedOut && (
          <>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#9AA1AC]">Earned / Cap</span>
              <span className="font-display text-[12.5px] font-semibold tabular-nums text-[#F2F3F5]">
                ${h2e.totalEarned.toFixed(2)} / ${h2e.earningsCap}
              </span>
            </div>
            <div className="h-[5px] w-full overflow-hidden rounded-[3px] bg-[#1A1D22]">
              <div className="h-full rounded-[3px] bg-[#33D6FF]" style={{ width: `${capPct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#9AA1AC]">Withdrawal unlock</span>
              <span className="font-display text-[12.5px] font-semibold tabular-nums text-[#33D6FF]">
                {h2e.isFullyUnlocked
                  ? "100% — fully unlocked"
                  : `${h2e.unlockedPercent}% · next ${h2e.nextTierPercent}% at $${((h2e.nextTierVolume ?? h2e.volumeRequired) / 1000).toFixed(0)}K`}
              </span>
            </div>
          </>
        )}
        <div className="text-[12px] text-[#9AA1AC]">
          Rewards up to <span className="font-display font-semibold tabular-nums text-[#33D6FF]">${h2e.earningsCap} USDC in airdrops</span>
        </div>
        <div className="text-[11px] text-[#6B7280]">
          Hedge Polymarket positions — settled losses return as USDC airdrops.{signedOut ? " Sign in to track yours." : ""}
        </div>
      </div>
    </button>
  );
};
