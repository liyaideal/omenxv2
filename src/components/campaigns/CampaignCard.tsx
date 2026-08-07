import { useNavigate } from "react-router-dom";
import { CampaignKeyVisual } from "./CampaignKeyVisual";
import { formatDateRange, type CampaignView } from "@/hooks/useCampaigns";

const Badge = ({ view }: { view: CampaignView }) => {
  const isSpecial = view.entry?.kind === "special";
  if (isSpecial) {
    const name = view.entry?.branding.display_name ?? "Partner";
    const avatar = view.entry?.branding.avatar_url;
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em]"
        style={{ background: "rgba(255,138,61,.16)", border: "1px solid rgba(255,138,61,.4)", color: "#FF8A3D" }}
      >
        <span className="grid h-4 w-4 place-items-center overflow-hidden rounded-full bg-[#2A2016] text-[8px] text-[#FF8A3D]">
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1)}
        </span>
        {name}
      </span>
    );
  }

  if (view.phase === "live") {
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em]"
        style={{ background: "rgba(207,255,74,.14)", color: "#CFFF4A" }}
      >
        Live
      </span>
    );
  }

  const label =
    view.phase === "always-on"
      ? "Always on"
      : view.phase === "upcoming"
        ? `Starts ${new Date(view.campaign.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "Ended";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em]"
      style={{ background: "#242830", color: "#C9CED6" }}
    >
      {label}
    </span>
  );
};

export const CampaignCard = ({ view, signedOut }: { view: CampaignView; signedOut?: boolean }) => {
  const navigate = useNavigate();
  const pct = view.tasksTotal > 0 ? (view.tasksDone / view.tasksTotal) * 100 : 0;
  const dateLine = formatDateRange(view.campaign.startsAt, view.campaign.endsAt);

  const meta: string[] = [];
  const claimedTotal = view.voucherClaimed + view.usdcClaimed;
  if (claimedTotal > 0) meta.push(`$${claimedTotal} claimed`);
  meta.push(`${view.joined.toLocaleString()} joined`);
  if (view.daysLeft !== null) meta.push(`Ends in ${view.daysLeft}d`);

  return (
    <button
      type="button"
      onClick={() => navigate(`/rewards/campaign/${view.campaign.id}`)}
      className="w-full overflow-hidden rounded-[14px] border border-[#1D2026] bg-[#0F1114] text-left transition-colors hover:border-[#2B2F38]"
      style={{ opacity: view.phase === "upcoming" ? 0.65 : 1 }}
    >
      <CampaignKeyVisual src={view.entry?.branding.key_visual_url} accent={view.accent} ratio="16 / 6.4">
        <div>
          <Badge view={view} />
        </div>
        <div>
          <div className="font-display text-[17px] font-bold leading-tight text-[#F2F3F5]">{view.campaign.name}</div>
          <div className="mt-1 font-display text-[11.5px] tabular-nums text-[#C9CED6]">{dateLine}</div>
        </div>
      </CampaignKeyVisual>

      <div className="space-y-3 p-4">
        {!signedOut && (
          <>
            <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#9AA1AC]">Your progress</span>
          <span className="font-display text-[12.5px] font-semibold tabular-nums text-[#F2F3F5]">
            {view.tasksDone} / {view.tasksTotal} tasks done
          </span>
            </div>
            <div className="h-[5px] w-full overflow-hidden rounded-[3px] bg-[#1A1D22]">
              <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: view.accent }} />
            </div>
          </>
        )}

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px]">
          <span className="text-[#9AA1AC]">Rewards up to</span>
          {view.rewardVoucherUpTo > 0 && (
            <span className="font-display font-semibold tabular-nums text-[#CFFF4A]">
              ${view.rewardVoucherUpTo} in vouchers
            </span>
          )}
          {view.rewardUsdcUpTo > 0 && (
            <>
              <span className="font-display font-semibold tabular-nums text-[#33D6FF]">
                +${view.rewardUsdcUpTo} USDC
              </span>
              <span className="text-[11px] text-[#6B7280]">not guaranteed</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold text-[#CFFF4A]">
            {!signedOut && view.claimableCount > 0 ? `● ${view.claimableCount} ready to claim` : ""}
          </span>
          <span className="text-[11px] tabular-nums text-[#6B7280]">{meta.join(" · ")}</span>
        </div>
      </div>
    </button>
  );
};