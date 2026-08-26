import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useH2eRewardsSummary } from "@/hooks/useH2eRewardsSummary";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useIsMobile } from "@/hooks/use-mobile";

const Step = ({ label, state }: { label: string; state: "done" | "active" | "todo" }) => (
  <span
    className="text-[11.5px]"
    style={{
      color: state === "done" ? "#4ADE80" : state === "active" ? "#33D6FF" : "#6B7280",
      fontWeight: state === "active" ? 600 : 400,
    }}
  >
    {state === "done" ? "✓ " : ""}{label}
  </span>
);

const Sep = () => <span className="text-[11.5px] text-[#3a4048]">→</span>;

export const H2eCampaignCard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const h2e = useH2eRewardsSummary();
  const { activeAccounts } = useConnectedAccounts();
  const stage = !user ? "S0" : h2e.totalEarned > 0 ? "S3" : activeAccounts.length > 0 ? "S2" : "S1";
  const acct = activeAccounts[0];
  const scanning = activeAccounts.some((a) => a.scanStatus === "scanning");
  const capPct = Math.min((h2e.totalEarned / h2e.earningsCap) * 100, 100);

  const s2Meta = scanning
    ? "Scanning positions…"
    : acct && acct.airdropsReceived > 0
      ? `${acct.positionsDetected} positions scanned · ${acct.airdropsReceived} airdrops active — earnings land when hedges settle.`
      : "No qualifying positions yet — positions ≥ $20 held a day qualify.";

  return (
    <button
      type="button"
      onClick={() => navigate("/rewards/campaign/h2e")}
      className="w-full overflow-hidden rounded-[14px] border border-[#1D2026] bg-[#0F1114] text-left transition-colors hover:border-[#2B2F38]"
    >
      <div
        className="relative flex flex-col justify-between p-4"
        style={{
          aspectRatio: isMobile ? "16 / 7" : "16 / 6.4",
          background: "linear-gradient(135deg, rgba(1,50,129,.55), rgba(51,214,255,.18) 55%, rgba(10,11,13,.2)), #0C0E12",
        }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,11,13,0) 0%, rgba(10,11,13,.55) 55%, rgba(10,11,13,.92) 100%)" }} />
        <div className="relative">
          <span className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em]" style={{ background: "#242830", color: "#C9CED6" }}>
            Always on
          </span>
        </div>
        <div className="relative">
          <div className="font-display text-[17px] font-bold leading-tight text-[#F2F3F5]">Hedge Airdrop Rewards</div>
          <div className="mt-1 font-display text-[11.5px] tabular-nums text-[#C9CED6]">Always valid</div>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {stage === "S3" && (
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
        {(stage === "S1" || stage === "S2") && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Step label="Connect wallet" state={stage === "S2" ? "done" : "active"} />
            <Sep />
            <Step label="Receive airdrops" state={stage === "S2" ? "active" : "todo"} />
            <Sep />
            <Step label="Trade to unlock" state="todo" />
          </div>
        )}
        <div className="text-[12px] text-[#9AA1AC]">
          Rewards up to <span className="font-display font-semibold tabular-nums text-[#33D6FF]">${h2e.earningsCap} USDC in airdrops</span>
        </div>
        <div className="text-[11px] text-[#6B7280]">
          {stage === "S0" && "Hedge Polymarket positions — settled losses return as USDC airdrops. Sign in to track yours."}
          {stage === "S1" && "Connect your Polymarket wallet — qualifying positions receive a $10 hedge on the counter side."}
          {stage === "S2" && s2Meta}
          {stage === "S3" && "Hedge Polymarket positions — settled losses return as USDC airdrops."}
        </div>
      </div>
    </button>
  );
};
