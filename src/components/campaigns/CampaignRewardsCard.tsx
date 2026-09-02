import { useNavigate } from "react-router-dom";
import omenxLogo from "@/assets/omenx-logo.svg";
import type { CampaignView } from "@/hooks/useCampaigns";

export interface CampaignRewardsCardProps {
  view: CampaignView;
  isMobile: boolean;
  isSpecial: boolean;
  kolName: string;
  avatar: string | undefined;
  frozen: boolean;
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
}: CampaignRewardsCardProps) => {
  const navigate = useNavigate();

  return (
    <aside
      className="flex flex-col gap-[14px] rounded-[16px] border border-[#1D2026] bg-[#131519]"
      style={{ padding: isMobile ? 16 : 18 }}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Your rewards here</div>

      {isMobile ? (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Vouchers", value: `$${view.voucherClaimed}`, color: "#CFFF4A" },
            { label: "USDC", value: `$${view.usdcClaimed}`, color: "#33D6FF" },
            {
              label: "Available",
              value: `$${Math.max(
                0,
                view.rewardVoucherUpTo + view.rewardUsdcUpTo - view.voucherClaimed - view.usdcClaimed,
              )}`,
              color: "#FFFFFF",
            },
          ].map((s) => (
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
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] text-[#9AA1AC]">Vouchers claimed</span>
        <span className="font-display text-[15px] font-bold tabular-nums text-[#CFFF4A]">${view.voucherClaimed}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] text-[#9AA1AC]">USDC credited</span>
        <span className="font-display text-[15px] font-bold tabular-nums text-[#33D6FF]">${view.usdcClaimed}</span>
      </div>
      {!frozen && (
        <div
          className="flex items-baseline justify-between"
          style={{ borderTop: "1px solid #1D2026", paddingTop: 11 }}
        >
          <span className="text-[12.5px] text-[#9AA1AC]">Still available</span>
          <span className="font-display text-[15px] font-bold tabular-nums text-white">
            ${Math.max(0, view.rewardVoucherUpTo + view.rewardUsdcUpTo - view.voucherClaimed - view.usdcClaimed)}
          </span>
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
              Open Vouchers →
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
              Open Wallet →
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
              Open Vouchers →
            </button>
            <button
              type="button"
              onClick={() => navigate("/wallet")}
              className="w-full rounded-[10px] border border-[#2B2F38] bg-transparent px-4 font-display text-[12.5px] font-semibold text-[#F2F3F5] transition-colors hover:border-[#3A3F47]"
              style={{ minHeight: 44 }}
            >
              Open Wallet →
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
            <img src={omenxLogo} alt="OmenX" className="h-2.5 w-[18px] object-contain" />
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
