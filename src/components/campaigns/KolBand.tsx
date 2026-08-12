/**
 * KOL brand band — pure presentational, props-driven.
 * Extracted verbatim out of LiteCampaignDetailPage (same JSX, same tokens);
 * the detail page keeps rendering both variants in place.
 */
export const KolBandDesktop = ({ kolName, avatar }: { kolName: string; avatar?: string | null }) => (
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
    <div className="flex min-w-0 flex-col gap-[1px]">
      <span className="font-display text-[13.5px] font-bold">{kolName} × OmenX · Exclusive entry</span>
      <span className="truncate text-[11.5px] font-semibold">
        You joined through {kolName}'s link — his terms apply.
      </span>
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
