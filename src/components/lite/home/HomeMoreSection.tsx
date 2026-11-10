// ============================================================
// HOME · §4 MORE MARKETS (首页 All 改版 · L4 / B1 · M1–M5, 2026-11-09)
// Eyebrow "More markets · N open" + "Will it happen?" (same 48px as the
// other sections); no list entry, no explainer (M1). Long-dated events are
// few, so they lay down one per row: cover 120×72 + "Category · N markets ·
// Boost n×" + title (≤ 2 lines) + "Vol $x · settles date" on the left, a
// 520px outcome area on the right (M2). Multi-outcome → one cyan / lime
// Yes-No share bar per market + Yes n¢ / No n¢ 66px buttons, max 4 shown,
// the rest "+N more outcomes →"; mutually exclusive sets carry one line
// under the bars (M3). Binary → no bar: big "34%" + "chance of Yes" + Yes /
// No 110px buttons (B1, M4). Near settlement the eyebrow says "closes in Xh"
// (M5). Mobile (M-More): cover + title stacked, bars full width.
// ============================================================
import { useNavigate } from "react-router-dom";
import type { EventRow } from "@/hooks/useMarketListData";
import { CATEGORY_IMAGE } from "@/components/lite/LiteEventCard";
import { CY, LM, MU, SectionHead, cents, ht, rich, tradeLink, uiLocale } from "./homeAllShell";
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
    const closesSoon = msLeft != null && msLeft < 48 * 3_600_000;
    const meta = [
      m.categoryLabel,
      multi ? ht("more.markets", { count: m.children.length }) : ht("more.yes_no"),
      boost && boost >= 2 ? t("events.screen.simple.event_card.boost_multiplier", { multiplier: boost }) : null,
      closesSoon ? ht("more.closes_in_hours", { h: Math.max(1, Math.round(msLeft! / 3_600_000)) }) : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const yes = yesOf(m);
    const yesP = yes ? yes.markPrice : 0.5;
    const cover = m.imageUrl ?? CATEGORY_IMAGE[(m.category || "").toLowerCase()];
    const shown = multi ? m.children.slice(0, 4) : [];
    const rest = multi ? m.children.length - shown.length : 0;
    const sumYes = multi ? m.children.reduce((a, c) => a + c.markPrice, 0) : 0;
    const exclusive = multi && Math.abs(sumYes - 1) < 0.12;

    const left = (
      <div className="row" style={{ gap: isMobile ? 12 : 16, alignItems: "flex-start" }}>
        {cover ? (
          <img src={cover} alt="" style={{ width: isMobile ? 96 : 120, height: isMobile ? 58 : 72, borderRadius: isMobile ? 8 : 10, objectFit: "cover", flex: "none" }} />
        ) : (
          <span style={{ width: isMobile ? 96 : 120, height: isMobile ? 58 : 72, borderRadius: 10, background: "#1B2130", flex: "none" }} />
        )}
        <span style={{ minWidth: 0 }}>
          <div className="lbl" style={{ fontSize: isMobile ? 9.5 : 10 }}>
            {meta}
          </div>
          <div
            className="d"
            // M2: desktop clamps at 2 lines (the column is wide); phone never cuts the title — it wraps.
            style={isMobile ? { fontWeight: 700, fontSize: 16, color: "#fff", marginTop: 5, lineHeight: 1.25 } : { fontWeight: 700, fontSize: 20, color: "#fff", marginTop: 6, lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {m.eventName}
          </div>
          <div className="kv" style={{ marginTop: isMobile ? 4 : 6, fontSize: isMobile ? 11.5 : 12.5 }}>
            {rich(ht("more.vol_settles", { date: settleTxt(m.expiry) }), { vol: <b>{volTxt(m.totalVolume)}</b> })}
          </div>
        </span>
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
                  <button type="button" className="up yn" style={{ width: 58, padding: "4px 0", fontSize: 11 }} onClick={go(m, { option: c.id, side: "yes" })}>
                    {t("common.yes")} <b>{cents(c.markPrice)}</b>
                  </button>
                  <button type="button" className="dn yn" style={{ width: 58, padding: "4px 0", fontSize: 11 }} onClick={go(m, { option: c.id, side: "no" })}>
                    {t("common.no")} <b>{cents(1 - c.markPrice)}</b>
                  </button>
                </span>
              </div>
            </div>
          ) : (
            // Fixed label column so every event's bars start on the same x; long names wrap, never cut.
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "136px minmax(0,1fr) auto", gap: 14, alignItems: "center", padding: "6px 0" }}>
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
      <div className="row" style={{ gap: isMobile ? 14 : 22, justifyContent: isMobile ? "space-between" : "flex-end" }}>
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
        {right}
      </div>
    );
  };

  return (
    <section className="sec" style={{ paddingBottom: isMobile ? 56 : 72 }}>
      <SectionHead eyebrow={ht("more.eyebrow", { count: events.length })} eyebrowColor={MU} question={<>{rich(ht("more.question"))}</>} isMobile={isMobile} />
      <div style={{ marginTop: isMobile ? 0 : 8 }}>{events.map(row)}</div>
    </section>
  );
};

export default HomeMoreSection;
