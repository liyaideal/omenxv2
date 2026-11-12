import { t } from "@/i18n";
import { useNavigate } from "react-router-dom";
import { omenxMark } from "@/components/Logo";
import type { CampaignView } from "@/hooks/useCampaigns";

export interface CampaignRewardsCardProps {
  view: CampaignView;
  isMobile: boolean;
  isSpecial: boolean;
  kolName: string;
  avatar: string | undefined;
  frozen: boolean;
  /** The entry has a leaderboard and this account takes part: show the rank row. */
  showRank?: boolean;
  /** The viewer's rank on the entry leaderboard; null = no score yet. */
  rank?: number | null;
}

/**
 * Signed-in "Your rewards here" card for /rewards/campaign/:id.
 * Extracted verbatim from LiteCampaignDetailPage (M3a-①) — DOM, classes,
 * and navigation targets unchanged. The signed-out branch (SignInPromptCard)
 * stays at the page.
 */
export const CampaignRewardsCard = ({
  view,
  isMobile,
  isSpecial,
  kolName,
  avatar,
  frozen,
  showRank,
  rank,
}: CampaignRewardsCardProps) => {
  const navigate = useNavigate();
  // Rows follow what the campaign pays: a ticket-only campaign shows no $0 voucher / USDC rows.
  const hasVoucherRow = view.rewardVoucherUpTo > 0 || view.voucherClaimed > 0;
  const hasUsdcRow = view.rewardUsdcUpTo > 0 || view.usdcClaimed > 0;
  const available = Math.max(0, view.rewardVoucherUpTo + view.rewardUsdcUpTo - view.voucherClaimed - view.usdcClaimed);
  const hasAvailable = view.rewardVoucherUpTo + view.rewardUsdcUpTo > 0;
  const rankText = rank ? String(rank) : "—";
  const stats = [
    hasVoucherRow && { label: "Vouchers", value: `$${view.voucherClaimed}`, color: "#CFFF4A" },
    hasUsdcRow && { label: "USDC", value: `$${view.usdcClaimed}`, color: "#33D6FF" },
    view.hasTickets && {
      label: t("rewards.screen.campaign_repeatable.tickets_earned"),
      value: view.ticketsEarned.toLocaleString("en-US"),
      color: "#FFFFFF",
    },
    showRank && { label: t("rewards.screen.campaign_leaderboard.your_rank"), value: rankText, color: "#FFFFFF" },
    hasAvailable && { label: "Available", value: `$${available}`, color: "#FFFFFF" },
  ].filter(Boolean) as { label: string; value: string; color: string }[];

  return (
    <aside
      className="flex flex-col gap-[14px] rounded-[16px] border border-[#1D2026] bg-[#131519]"
      style={{ padding: isMobile ? 16 : 18 }}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">{t("rewards.screen.h2e_rewards_rail.your_rewards_here")}</div>

      {isMobile ? (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${stats.length === 4 ? 2 : Math.max(1, Math.min(3, stats.length))}, minmax(0, 1fr))` }}
        >
          {stats.map((s) => (
            <div key={s.label} className="rounded-[12px] bg-[#0F1114] px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.1em] text-[#6B7280]">{s.label}</div>
              <div className="mt-1 font-display text-[16px] font-bold tabular-nums" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
      {hasVoucherRow && (
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] text-[#9AA1AC]">{t("rewards.screen.campaign_detail_page.vouchers_claimed")}</span>
        <span className="font-display text-[15px] font-bold tabular-nums text-[#CFFF4A]">${view.voucherClaimed}</span>
      </div>
      )}
      {hasUsdcRow && (
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] text-[#9AA1AC]">USDC credited</span>
        <span className="font-display text-[15px] font-bold tabular-nums text-[#33D6FF]">${view.usdcClaimed}</span>
      </div>
      )}
      {view.hasTickets && (
      <div className="flex items-baseline justify-between" data-rewards-row="tickets">
        <span className="text-[12.5px] text-[#9AA1AC]">{t("rewards.screen.campaign_repeatable.tickets_earned")}</span>
        <span className="font-display text-[15px] font-bold tabular-nums text-white">
          {view.ticketsEarned.toLocaleString("en-US")}
        </span>
      </div>
      )}
      {showRank && (
      <div className="flex items-baseline justify-between" data-rewards-row="rank">
        <span className="text-[12.5px] text-[#9AA1AC]">{t("rewards.screen.campaign_leaderboard.your_rank")}</span>
        <span className="font-display text-[15px] font-bold tabular-nums text-white">{rankText}</span>
      </div>
      )}
      {!frozen && hasAvailable && (
        <div
          className="flex items-baseline justify-between"
          style={{ borderTop: "1px solid #1D2026", paddingTop: 11 }}
        >
          <span className="text-[12.5px] text-[#9AA1AC]">{t("rewards.screen.campaign_detail_page.still_available")}</span>
          <span className="font-display text-[15px] font-bold tabular-nums text-white">${available}</span>
        </div>
      )}
        </>
      )}

      {(() => {
        const hasVoucher = view.rewardVoucherUpTo > 0;
        const hasUsdc = view.rewardUsdcUpTo > 0;
        if (!hasVoucher && !hasUsdc) return null;
        if (hasVoucher && !hasUsdc) {
          return (
            <button
              type="button"
              onClick={() => navigate("/vouchers")}
              className="w-full rounded-[10px] bg-white px-4 font-display text-[12.5px] font-bold text-[#0A0B0D] transition-colors hover:bg-[#E6E9EE]"
              style={{ minHeight: 44 }}
            >
              {t("rewards.screen.points_retired_notice.open_vouchers")}
            </button>
          );
        }
        if (hasUsdc && !hasVoucher) {
          return (
            <button
              type="button"
              onClick={() => navigate("/wallet")}
              className="w-full rounded-[10px] bg-white px-4 font-display text-[12.5px] font-bold text-[#0A0B0D] transition-colors hover:bg-[#E6E9EE]"
              style={{ minHeight: 44 }}
            >
              {t("rewards.screen.h2e_rewards_rail.open_wallet")}
            </button>
          );
        }
        return (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate("/vouchers")}
              className="w-full rounded-[10px] bg-white px-4 font-display text-[12.5px] font-bold text-[#0A0B0D] transition-colors hover:bg-[#E6E9EE]"
              style={{ minHeight: 44 }}
            >
              {t("rewards.screen.points_retired_notice.open_vouchers")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/wallet")}
              className="w-full rounded-[10px] border border-[#2B2F38] bg-transparent px-4 font-display text-[12.5px] font-semibold text-[#F2F3F5] transition-colors hover:border-[#3A3F47]"
              style={{ minHeight: 44 }}
            >
              {t("rewards.screen.h2e_rewards_rail.open_wallet")}
            </button>
          </div>
        );
      })()}

      <div
        className="flex items-center gap-2.5 rounded-[12px]"
        style={{ background: "#0F1115", border: "1px solid #1D2026", padding: "11px 12px" }}
      >
        <span
          className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-bold"
          style={{ background: isSpecial ? "#2A1200" : "#16181D", color: isSpecial ? "#FF8A3D" : "#9AA1AC" }}
        >
          {isSpecial ? (
            avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : kolName.slice(0, 1)
          ) : (
            <img src={omenxMark} alt={t("common.app_name")} className="h-3 w-auto" />
          )}
        </span>
        <div className="min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6B7280]">
            {isSpecial ? "Entry" : "Host"}
          </div>
          <div className="text-[12.5px] font-semibold" style={{ color: isSpecial ? "#FF8A3D" : "#F2F3F5" }}>
            {isSpecial ? `Joined via ${kolName}` : "Official OmenX campaign — open to everyone"}
          </div>
        </div>
      </div>
    </aside>
  );
};
