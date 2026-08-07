import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CampaignView } from "@/hooks/useCampaigns";

export const EndedCampaignsArchive = ({
  views,
  defaultOpen = false,
}: {
  views: CampaignView[];
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  if (views.length === 0) return null;

  const totalVouchers = views.reduce((sum, v) => sum + v.voucherClaimed, 0);

  return (
    <div className="rounded-[12px] border border-[#1D2026] bg-[#0F1114]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-[12.5px] text-[#C9CED6]">
          Ended campaigns ({views.length}) · ${totalVouchers} in vouchers earned
        </span>
        <span className="flex items-center gap-1 text-[12px] text-[#9AA1AC]">
          {open ? "Hide" : "Show"}
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-[#1D2026]">
          {views.map((v) => {
            const ended = v.campaign.endsAt
              ? new Date(v.campaign.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—";

            if (isMobile) {
              return (
                <button
                  key={v.campaign.id}
                  type="button"
                  onClick={() => navigate(`/rewards/campaign/${v.campaign.id}`)}
                  className="flex w-full items-center gap-3 border-b border-[#16191E] px-4 py-3 text-left last:border-b-0"
                >
                  <div
                    className="h-[40px] w-[72px] shrink-0 overflow-hidden rounded-[8px]"
                    style={{ background: v.entry?.branding.key_visual_url ? undefined : v.accent }}
                  >
                    {v.entry?.branding.key_visual_url && (
                      <img src={v.entry.branding.key_visual_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-[#F2F3F5]">{v.campaign.name}</div>
                    <div className="mt-0.5 truncate text-[11.5px] tabular-nums text-[#6B7280]">
                      Ended {ended} · {v.tasksDone}/{v.tasksTotal} tasks
                    </div>
                    <div className="mt-0.5 text-[11.5px] font-semibold text-[#CFFF4A]">
                      ${v.voucherClaimed} in vouchers
                      {v.usdcClaimed > 0 && <span className="text-[#33D6FF]"> · +${v.usdcClaimed} USDC</span>}
                    </div>
                  </div>
                </button>
              );
            }

            return (
            <button
              key={v.campaign.id}
              type="button"
              onClick={() => navigate(`/rewards/campaign/${v.campaign.id}`)}
              className="flex w-full items-center gap-3 border-b border-[#16191E] px-4 py-3 text-left last:border-b-0"
            >
              <div
                className="h-[54px] w-[96px] shrink-0 overflow-hidden rounded-[8px]"
                style={{ background: v.entry?.branding.key_visual_url ? undefined : v.accent }}
              >
                {v.entry?.branding.key_visual_url && (
                  <img src={v.entry.branding.key_visual_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-[#F2F3F5]">{v.campaign.name}</div>
                <div className="text-[11.5px] text-[#6B7280]">Ended {ended}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[12.5px] font-semibold text-[#CFFF4A]">${v.voucherClaimed} in vouchers</div>
                {v.usdcClaimed > 0 && <div className="text-[11.5px] text-[#33D6FF]">+${v.usdcClaimed} USDC</div>}
                <div className="text-[11.5px] text-[#6B7280]">
                  {v.tasksDone} / {v.tasksTotal} tasks
                </div>
              </div>
            </button>
            );
          })}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => navigate("/vouchers")}
              className="text-[11.5px] text-[#6B7280] underline-offset-2 hover:underline"
            >
              All rewards you've received live in Position Vouchers →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};