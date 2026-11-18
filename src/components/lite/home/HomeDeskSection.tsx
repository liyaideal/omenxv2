// ============================================================
// HOME · §3b EDITOR'S DESK (首页 All 改版 · E1–E4, 2026-11-09; Spotlight panel 2026-11-18)
// 稿源: Figma omenx_lite 1537:8418 (desktop, 画布 1440, 段宽 1232, 1:1) /
//       1537:9849 (mobile, 画布 390, 段宽 358, 1:1).
// One panel (.desk: 1px #1F2330 border, 28px radius, top-lit gradient):
//   hero band  — eyebrow "✦ Editor's Desk · N picks" (lime) + "What's worth
//                watching?"; behind it a lime glow, a faint column grid and the
//                lynx-in-the-archive banner fading in from the right (decorative).
//   hairline, then the picks.
// Content rules are unchanged (E1–E4): ≤ 3 picks, each with a reason; section not
// rendered when nothing is configured (E2); numeral + "Category · time" eyebrow,
// title (≤ 2 lines), reason in quotes (≤ 3 lines), order buttons bottom-aligned at
// 36px (E3); buttons follow the event type (E4).
// Desktop: three equal columns, 40px gaps with a 1px divider between picks.
// Mobile: the picks stacked inside the panel, a hairline between them.
// ============================================================
import { useNavigate } from "react-router-dom";
import { pickHref, type EditorPick } from "@/components/lite/picks/editorialPicks";
import { topCategoryForKey } from "@/lib/taxonomy";
import { DownButton, LM, OddsButton, SectionHead, UpButton, hhmm, ht, rich, uiLocale } from "./homeAllShell";
import { t, useT } from "@/i18n";
import deskBanner from "@/assets/home/desk-banner.webp";

const catLabel = (p: EditorPick) => topCategoryForKey(p.category)?.label ?? (p.category ? p.category[0].toUpperCase() + p.category.slice(1) : t("events.screen.simple.featured_markets.featured_market_card.market"));
const whenLabel = (d: Date | null, nowMs?: number): string => {
  if (!d) return "";
  const now = nowMs != null ? new Date(nowMs) : new Date();
  const sod = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = (sod(d) - sod(now)) / 86_400_000;
  if (diff === 0) return ht("desk.settles_at", { time: hhmm(d) });
  if (diff === 1) return ht("desk.tomorrow_at", { time: hhmm(d) });
  return ht("desk.settles_at", { time: d.toLocaleDateString(uiLocale(), { month: "short", day: "numeric" }) });
};
const isRound = (p: EditorPick) => /^(up|down)$/i.test(p.yesLabel) || /^(up|down)$/i.test(p.noLabel);

const Buttons = ({ p, go }: { p: EditorPick; go: (href: string) => void }) => {
  if (isRound(p)) {
    return (
      <>
        <UpButton price={p.yesPrice} onClick={() => go(pickHref(p, p.yesOptionId, "yes"))} />
        <DownButton price={p.noPrice} onClick={() => go(pickHref(p, p.noOptionId, "no"))} />
      </>
    );
  }
  if (p.optionCount > 2) {
    return (
      <>
        {/* G3: each outcome pill buys YES on that outcome (side=no would open "No on B" on the multi trade page) */}
        <OddsButton label={p.yesLabel} price={p.yesPrice} onClick={() => go(pickHref(p, p.yesOptionId, "yes"))} />
        <OddsButton label={p.noLabel} price={p.noPrice} onClick={() => go(pickHref(p, p.noOptionId, "yes"))} />
        <button type="button" className="lnk" style={{ fontSize: 13 }} onClick={() => go(pickHref(p))}>
          {ht("desk.more", { count: p.optionCount - 2 })}
        </button>
      </>
    );
  }
  if (/^yes$/i.test(p.yesLabel)) {
    return (
      <>
        <UpButton label={t("common.yes")} price={p.yesPrice} onClick={() => go(pickHref(p, p.yesOptionId, "yes"))} />
        <DownButton label={t("common.no")} price={p.noPrice} onClick={() => go(pickHref(p, p.noOptionId, "no"))} />
      </>
    );
  }
  // Match: a two-option event's away side is its "no" side; a three-way match is multi-outcome on the
  // trade page, so the away team is YES on the away option (side=no would open "No on away").
  const awaySide = (p.totalOptions ?? 2) > 2 ? "yes" : "no";
  return (
    <>
      <OddsButton label={p.yesLabel} price={p.yesPrice} onClick={() => go(pickHref(p, p.yesOptionId, "yes"))} />
      <OddsButton label={p.noLabel} price={p.noPrice} onClick={() => go(pickHref(p, p.noOptionId, awaySide))} />
    </>
  );
};

export const HomeDeskSection = ({ picks, isMobile, nowOverride }: { picks: EditorPick[]; isMobile: boolean; nowOverride?: number }) => {
  const navigate = useNavigate();
  useT(); // re-render on language change / catalog arrival
  if (picks.length === 0) return null;
  const go = (href: string) => navigate(href);
  const eyebrow = ht("desk.eyebrow", { count: picks.length });
  const question = <>{rich(ht("desk.question"))}</>;

  if (isMobile) {
    return (
      <section className="sec sec-desk">
        <div className="desk">
          <div className="desk-band">
            <span className="desk-glow" aria-hidden />
            <img className="desk-art" src={deskBanner} alt="" aria-hidden draggable={false} onError={(e) => (e.currentTarget.style.display = "none")} />
            <div style={{ position: "relative" }}>
              <SectionHead eyebrow={eyebrow} eyebrowColor={LM} question={question} isMobile />
            </div>
          </div>
          <div className="desk-list">
            {picks.map((p, k) => (
              <div key={p.id} className="desk-item">
                <div className="row" style={{ gap: 10, alignItems: "baseline" }}>
                  <span className="pnum" style={{ fontSize: 22 }}>
                    {String(k + 1).padStart(2, "0")}
                  </span>
                  <span className="lbl" style={{ fontSize: 9.5 }}>
                    {catLabel(p)}
                    {p.endDate ? ` · ${whenLabel(p.endDate, nowOverride)}` : ""}
                  </span>
                </div>
                <div className="ptitle" style={{ fontSize: 17, marginTop: 8 }}>
                  {p.name}
                </div>
                <p className="pwhy" style={{ marginTop: 8, fontSize: 12.5 }}>
                  “{p.note}”
                </p>
                <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <Buttons p={p} go={go} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="sec sec-desk">
      <div className="desk">
        <div className="desk-band">
          <span className="desk-glow" aria-hidden />
          <span className="desk-grid" aria-hidden />
          <span className="desk-art" aria-hidden>
            <img src={deskBanner} alt="" draggable={false} onError={(e) => (e.currentTarget.style.display = "none")} />
          </span>
          <div style={{ position: "relative" }}>
            <SectionHead eyebrow={eyebrow} eyebrowColor={LM} question={question} />
          </div>
        </div>
        <div className="desk-picks">
          {picks.map((p, k) => (
            <div key={p.id} className="pcol">
              <div className="row" style={{ gap: 14, alignItems: "center" }}>
                <span className="pnum">{String(k + 1).padStart(2, "0")}</span>
                <span className="lbl">
                  {catLabel(p)}
                  {p.endDate ? ` · ${whenLabel(p.endDate, nowOverride)}` : ""}
                </span>
              </div>
              <div className="ptitle" style={{ marginTop: 14 }}>
                {p.name}
              </div>
              <p className="pwhy">“{p.note}”</p>
              <div className="row" style={{ gap: 8, marginTop: "auto", paddingTop: 24, flexWrap: "wrap" }}>
                <Buttons p={p} go={go} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeDeskSection;
