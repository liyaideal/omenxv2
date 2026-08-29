// ============================================================
// HOME · EDITOR'S DESK (HP-1)
// Same data contract as EditorPicksModule (metadata.editorial, MAX 3,
// mandatory note). Zero picks → the whole module is absent.
// ============================================================
import { useNavigate } from "react-router-dom";
import { DirectionButton } from "@/components/lite/categoryviews/verticalBlocks";
import { EditorPick, pickHref } from "@/components/lite/picks/editorialPicks";
import { HomeCard, HomeEyebrow, HomeQuestion, LIME, MUTED } from "./homeShell";

const CYAN = "#33D6FF";

const PickRow = ({ pick, index }: { pick: EditorPick; index: number }) => {
  const navigate = useNavigate();
  const multi = pick.optionCount > 2;
  return (
    <div style={{ padding: "15px 0", borderBottom: "1px solid rgba(148,163,184,0.09)" }}>
      <div className="flex" style={{ gap: 14 }}>
        <span
          className="font-display"
          style={{ fontSize: 20, fontWeight: 700, color: "rgba(148,163,184,0.4)" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <div style={{ fontWeight: 700, fontSize: 15.5, color: "#fff" }}>{pick.name}</div>
          <div
            style={{
              fontSize: 13,
              marginTop: 4,
              color: MUTED,
              fontStyle: "italic",
            }}
          >
            “{pick.note}”
          </div>
          <div className="flex items-center" style={{ gap: 8, marginTop: 10 }}>
            {multi ? (
              <>
                <DirectionButton
                  label={pick.yesLabel}
                  price={pick.yesPrice}
                  tone="up"
                  minHeight={38}
                  labelSize={13}
                  priceSize={13}
                  grow
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(pickHref(pick, pick.yesOptionId));
                  }}
                />
                <button
                  type="button"
                  className="font-display flex-none"
                  style={{ fontSize: 12.5, color: CYAN }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(pickHref(pick));
                  }}
                >
                  +{pick.optionCount - 1} markets →
                </button>
              </>
            ) : (
              <>
                <DirectionButton
                  label={pick.yesLabel}
                  price={pick.yesPrice}
                  tone="up"
                  minHeight={38}
                  labelSize={13}
                  priceSize={13}
                  grow
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(pickHref(pick, pick.yesOptionId));
                  }}
                />
                <DirectionButton
                  label={pick.noLabel}
                  price={pick.noPrice}
                  tone="down"
                  minHeight={38}
                  labelSize={13}
                  priceSize={13}
                  grow
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(pickHref(pick, pick.noOptionId));
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const HomeDeskCard = ({
  picks,
  isMobile,
}: {
  picks: EditorPick[];
  isMobile: boolean;
}) => {
  if (picks.length === 0) return null;
  return (
    <HomeCard style={{ padding: isMobile ? "18px 16px" : "26px 28px" }}>
      <HomeEyebrow color={LIME}>✦ Editor's Desk</HomeEyebrow>
      <div style={{ marginTop: 12 }}>
        <HomeQuestion size={isMobile ? 18 : 22}>What's worth watching</HomeQuestion>
      </div>
      {picks.map((p, i) => (
        <PickRow key={p.id} pick={p} index={i} />
      ))}
    </HomeCard>
  );
};

export default HomeDeskCard;
