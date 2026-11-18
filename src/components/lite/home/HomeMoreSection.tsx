// ============================================================
// HOME · §4 MORE MARKETS (首页 All 改版 · L4 / B1 · M1–M5, 2026-11-09; cover-as-backdrop 2026-11-18)
// 稿源: Figma omenx_lite 1537:8499 (desktop, 画布 1440, 段宽 1232, 1:1) /
//       1537:9924 (mobile, 画布 390, 段宽 358, 1:1).
// Eyebrow "More markets · N open" + "Will it happen?" (same 48px as the
// other sections); no list entry, no explainer (M1). Long-dated events are
// few, so they lay down one per row (M2).
// Desktop row: the event cover is the row's backdrop — 497.5px wide, full row
// height, 40% opacity, fading out left and right, with a bottom-up dark wash —
// and on it, vertically centred: "CATEGORY (cyan) · N markets · [⚡ Boost n×]
// chip" + title (≤ 3 lines) + "Vol $x · settles date". A 520px outcome area sits
// on the right, vertically centred.
// Mobile row: cover as a 96×58 thumbnail + the same text (Boost stays plain text
// in the eyebrow), outcomes full width under it.
// Multi-outcome → one cyan / lime Yes-No share bar per market + Yes n¢ / No n¢
// 66px buttons, max 4 shown, the rest "+N more outcomes →"; mutually exclusive
// sets carry one line under the bars (M3). Binary → no bar: big "34%" + "chance
// of Yes" + Yes / No 110px buttons (B1, M4). Near settlement the eyebrow says
// "closes in Xh" (M5).
// ============================================================
import { useNavigate } from "react-router-dom";
import type { EventRow } from "@/hooks/useMarketListData";
import { CATEGORY_IMAGE } from "@/components/lite/LiteEventCard";
import { CY, LM, MU, SectionHead, cents, ht, rich, tradeLink, uiLocale } from "./homeAllShell";
import { MORE_ART_BY_EVENT } from "./homeMoreArt";
import { t, useT } from "@/i18n";

const volTxt = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K` : `$${Math.round(n)}`);
const settleTxt = (d: Date | null) => (d ? d.toLocaleDateString(uiLocale(), { month: "short", day: "numeric" }) : t("portfolio.tbd"));
const yesOf = (m: EventRow) => {
  const alias = (m.sideLabels?.yes ?? "").trim().toLowerCase();
  const norm = (s: string) => s.trim().toLowerCase();
  return (
    (alias && m.children.find((c) => norm(c.optionLabel) === alias)) ||
    m.children.find((c) => ["yes", "up"].includes(norm(c.optionLabel))) ||
    m.children[0] ||
    null
  );
};

const Bar = ({ p }: { p: number }) => (
  <span className="mbar">
    <i className="y" style={{ width: `${Math.round(p * 100)}%` }} />
    <i className="n" />
  </span>
);

export interface HomeMoreSectionProps {
  events: EventRow[];
  getBoostMax: (category: string) => number | null;
  isMobile: boolean;
  nowOverride?: number;
}

export const HomeMoreSection = ({ events, getBoostMax, isMobile, nowOverride }: HomeMoreSectionProps) => {
  const navigate = useNavigate();
  useT(); // re-render on language change / catalog arrival
  if (events.length === 0) return null;
  const now = nowOverride ?? Date.now();
  // G3: Yes / No open the trade page on that side (and that outcome, for multi-outcome rows).
  const go = (m: EventRow, pick?: { option?: string; side?: "yes" | "no" }) => () =>
    navigate(tradeLink(m.eventId, { ...pick, spot: !!m.productLines?.includes("spot") }));

  const row = (m: EventRow, k: number) => {
    const multi = m.children.length > 2;
    const boost = getBoostMax(m.category);
    const msLeft = m.expiry ? m.expiry.getTime() - now : null;
    const closesSoon = msLeft != null && msLeft > 0 && msLeft < 48 * 3_600_000; // M5: an expired event never reads "closes in 1h"
    const marketsTxt = multi ? ht("more.markets", { count: m.children.length }) : ht("more.yes_no");
    const boostTxt = boost && boost >= 2 ? t("events.screen.simple.event_card.boost_multiplier", { multiplier: boost }) : null;
    const closesTxt = closesSoon ? ht("more.closes_in_hours", { h: Math.max(1, Math.round(msLeft! / 3_600_000)) }) : null;
    const yes = yesOf(m);
    const yesP = yes ? yes.markPrice : 0.5;
    const cover = MORE_ART_BY_EVENT[m.eventId] ?? m.imageUrl ?? CATEGORY_IMAGE[(m.category || "").toLowerCase()];
    const shown = multi ? m.children.slice(0, 4) : [];
    const rest = multi ? m.children.length - shown.length : 0;
    const sumYes = multi ? m.children.reduce((a, c) => a + c.markPrice, 0) : 0;
    const exclusive = multi && Math.abs(sumYes - 1) < 0.12;

    const titleEl = (
      <div
        className="d"
        // M2: desktop clamps at 3 lines (2026-11-10, was 2); phone never cuts the title — it wraps.
        style={isMobile ? { fontWeight: 700, fontSize: 16, color: "#fff", marginTop: 5, lineHeight: 1.25 } : { fontWeight: 700, fontSize: 20, color: "#fff", marginTop: 3, lineHeight: "25px", letterSpacing: "-.5px", maxWidth: 420, textWrap: "balance", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {m.eventName}
      </div>
    );
    const volEl = (
      <div className={isMobile ? "kv" : "kv more-vol"} style={isMobile ? { marginTop: 4, fontSize: 11.5 } : undefined}>
        {rich(ht("more.vol_settles", { date: settleTxt(m.expiry) }), { vol: <b>{volTxt(m.totalVolume)}</b> })}
      </div>
    );
    const left = isMobile ? (
      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        {cover ? (
          <img src={cover} alt="" style={{ width: 96, height: 58, borderRadius: 8, objectFit: "cover", flex: "none", background: "#1B2130" }} onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
        ) : (
          <span style={{ width: 96, height: 58, borderRadius: 8, background: "#1B2130", flex: "none" }} />
        )}
        <span style={{ minWidth: 0 }}>
          <div className="lbl" style={{ fontSize: 9.5 }}>
            {[m.categoryLabel, marketsTxt, boostTxt].filter(Boolean).join(" · ")}
            {/* M5 on phone (2026-11-18): "closes in Xh" always starts its own line, so a wrapped eyebrow never ends on a dangling "·" */}
            {closesTxt && <span style={{ display: "block" }}>{closesTxt}</span>}
          </div>
          {titleEl}
          {volEl}
        </span>
      </div>
    ) : (
      <div className="more-left">
        {cover && (
          <span className="more-art" aria-hidden>
            <img src={cover} alt="" draggable={false} onError={(e) => (e.currentTarget.style.display = "none")} />
          </span>
        )}
        <span className="more-wash" aria-hidden />
        <div className="more-txt">
          <div className="more-eye">
            <span className="cat">{m.categoryLabel}</span>
            <span>
              · {marketsTxt}
              {boostTxt ? " ·" : ""}
            </span>
            {boostTxt && (
              <span className="more-boost">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                  <path d="M4.875 0.75L1.5 5.25H4.125L3.75 8.25L7.125 3.75H4.5L4.875 0.75Z" fill="#CFFF4A" />
                </svg>
                {boostTxt}
              </span>
            )}
            {closesTxt && <span>· {closesTxt}</span>}
          </div>
          {titleEl}
          {volEl}
        </div>
      </div>
    );

    const right = multi ? (
      <div>
        {shown.map((c) =>
          isMobile ? (
            // Mobile: the outcome name gets its own line so it is never cut (no ellipsis rule).
            <div key={c.id} style={{ padding: "7px 0" }}>
              <div className="d" style={{ fontSize: 12.5, fontWeight: 700, color: "#DBE2EA" }}>
                {c.displayLabel || c.optionLabel}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center", marginTop: 6 }}>
                <Bar p={c.markPrice} />
                <span className="row" style={{ gap: 5 }}>
                  <button type="button" className="up yn" style={{ minWidth: 58, padding: "4px 8px", fontSize: 11 }} onClick={go(m, { option: c.id, side: "yes" })}>
                    {t("common.yes")} <b>{cents(c.markPrice)}</b>
                  </button>
                  <button type="button" className="dn yn" style={{ minWidth: 58, padding: "4px 8px", fontSize: 11 }} onClick={go(m, { option: c.id, side: "no" })}>
                    {t("common.no")} <b>{cents(1 - c.markPrice)}</b>
                  </button>
                </span>
              </div>
            </div>
          ) : (
            // Fixed label column so every event's bars start on the same x; long names wrap, never cut.
            <div key={c.id} className="orow" style={{ display: "grid", gridTemplateColumns: "136px minmax(0,1fr) auto", gap: 14, alignItems: "center", padding: "6px 0" }}>
              <span className="d" style={{ fontSize: 13, fontWeight: 700, color: "#DBE2EA", lineHeight: 1.25 }}>
                {c.displayLabel || c.optionLabel}
              </span>
              <Bar p={c.markPrice} />
              <span className="row" style={{ gap: 6 }}>
                <button type="button" className="up yn" onClick={go(m, { option: c.id, side: "yes" })}>
                  {t("common.yes")} <b>{cents(c.markPrice)}</b>
                </button>
                <button type="button" className="dn yn" onClick={go(m, { option: c.id, side: "no" })}>
                  {t("common.no")} <b>{cents(1 - c.markPrice)}</b>
                </button>
              </span>
            </div>
          ),
        )}
        {rest > 0 && (
          <button type="button" className="lnk" style={{ fontSize: 13, marginTop: 6 }} onClick={go(m)}>
            {ht("more.more_outcomes", { count: rest })}
          </button>
        )}
        {exclusive && (
          <div className="kv" style={{ fontSize: 11.5, marginTop: 8 }}>
            {ht("more.exclusive")}
          </div>
        )}
      </div>
    ) : (
      <div className="row" style={{ gap: isMobile ? "10px 14px" : 22, justifyContent: "space-between", flexWrap: isMobile ? "wrap" : undefined }}>
        <span className="row" style={{ gap: 10, alignItems: "baseline" }}>
          <span className="m" style={{ fontSize: isMobile ? 30 : 36, fontWeight: 700, color: "#fff", lineHeight: 1, letterSpacing: "-.03em" }}>
            {Math.round(yesP * 100)}%
          </span>
          <span className="kv" style={{ fontSize: isMobile ? 11.5 : 12, whiteSpace: "nowrap" }}>
            {ht("more.chance_of_yes")}
          </span>
        </span>
        <span className="row" style={{ gap: 8 }}>
          <button type="button" className="up" style={{ width: isMobile ? 84 : 110, justifyContent: "center" }} onClick={go(m, { side: "yes" })}>
            {t("common.yes")} <b>{cents(yesP)}</b>
          </button>
          <button type="button" className="dn" style={{ width: isMobile ? 84 : 110, justifyContent: "center" }} onClick={go(m, { side: "no" })}>
            {t("common.no")} <b>{cents(1 - yesP)}</b>
          </button>
        </span>
      </div>
    );

    if (isMobile) {
      return (
        <div key={m.id} className={k < events.length - 1 ? "hr" : undefined} style={{ padding: "18px 0" }}>
          {left}
          <div style={{ marginTop: 12 }}>{right}</div>
        </div>
      );
    }
    return (
      <div key={m.id} className={`morerow${k < events.length - 1 ? " hr" : ""}`}>
        {left}
        <div className="more-right">{right}</div>
      </div>
    );
  };

  return (
    <section className="sec" style={{ paddingBottom: isMobile ? 56 : 72 }}>
      <SectionHead eyebrow={ht("more.eyebrow", { count: events.length })} eyebrowColor={MU} question={<>{rich(ht("more.question"))}</>} isMobile={isMobile} />
      <div className={isMobile ? undefined : "more-rows"}>{events.map(row)}</div>
    </section>
  );
};

export default HomeMoreSection;
