import { t } from "@/i18n";
/**
 * KOL brand band — pure presentational, props-driven.
 * Extracted verbatim out of LiteCampaignDetailPage (same JSX, same tokens);
 * the detail page keeps rendering both variants in place.
 */
export const KolBandDesktop = ({
  kolName,
  avatar,
  joined = true,
}: {
  kolName: string;
  avatar?: string | null;
  /** The viewer is bound to this entry. Visitors who are not (signed out, or not joined yet) see no second line. */
  joined?: boolean;
}) => (
  <div
    className="inline-flex self-start items-center gap-[11px] rounded-full"
    style={{ background: "#FF8A3D", color: "#2A1200", padding: "5px 15px 5px 5px" }}
  >
    <span
      className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-full text-[13px] font-bold"
      style={{ background: "#2A1200", color: "#FF8A3D" }}
    >
      {avatar ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        kolName.slice(0, 1)
      )}
    </span>
    <div className="flex min-h-[34px] min-w-0 flex-col justify-center gap-[1px]">
      <span className="font-display text-[13.5px] font-bold">
        {t("rewards.screen.campaign_detail_page.kol_exclusive_entry", { name: kolName })}
      </span>
      {joined && (
        <span className="truncate text-[11.5px] font-semibold" data-kol-joined>
          {t("rewards.screen.campaign_detail_page.kol_joined_through", { name: kolName })}
        </span>
      )}
    </div>
  </div>
);

export const KolBandMobile = ({ kolName, avatar }: { kolName: string; avatar?: string | null }) => (
  <div
    className="inline-flex max-w-full self-start items-center gap-[8px] rounded-full"
    style={{ background: "#FF8A3D", color: "#2A1200", padding: "3px 11px 3px 3px" }}
  >
    <span
      className="grid h-[22px] w-[22px] shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-bold"
      style={{ background: "#2A1200", color: "#FF8A3D" }}
    >
      {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : kolName.slice(0, 1)}
    </span>
    <span className="truncate font-display text-[11.5px] font-bold">{kolName} × OmenX</span>
  </div>
);
