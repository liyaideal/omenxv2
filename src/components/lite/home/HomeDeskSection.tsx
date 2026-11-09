// ============================================================
// HOME · §3b EDITOR'S DESK (首页 All 改版 · E1 · E1–E4, 2026-11-09)
// Its own section between Stocks and More; eyebrow "✦ Editor's Desk · N
// picks" (lime) + "What's worth watching?"; no byline / updated-at (E1).
// Data = ops featured markets (≤ 3, each with a reason); the section is not
// rendered when nothing is configured (E2). Three equal-height columns, no
// dividers — 56px gutters and the 01 / 02 / 03 numerals separate them;
// each column = numeral + "Category · time" eyebrow, title (≤ 2 lines),
// the reason in quotes (≤ 3 lines), order buttons bottom-aligned at 36px
// (E3). Buttons follow the event type (E4): round → Up / Down; match →
// two names + prices; multi-outcome → two pills + "+N more".
// Mobile (M-Editors): the three picks stacked.
// ============================================================
import { useNavigate } from "react-router-dom";
import { pickHref, type EditorPick } from "@/components/lite/picks/editorialPicks";
import { topCategoryForKey } from "@/lib/taxonomy";
import { DownButton, LM, OddsButton, SectionHead, UpButton, hhmm } from "./homeAllShell";

const catLabel = (p: EditorPick) => topCategoryForKey(p.category)?.label ?? (p.category ? p.category[0].toUpperCase() + p.category.slice(1) : "Market");
const whenLabel = (d: Date | null, nowMs?: number): string => {
  if (!d) return "";
  const now = nowMs != null ? new Date(nowMs) : new Date();
  const sod = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = (sod(d) - sod(now)) / 86_400_000;
  if (diff === 0) return `settles ${hhmm(d)}`;
  if (diff === 1) return `Tomorrow ${hhmm(d)}`;
  return `settles ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
};
const isRound = (p: EditorPick) => /^(up|down)$/i.test(p.yesLabel) || /^(up|down)$/i.test(p.noLabel);

const Buttons = ({ p, go }: { p: EditorPick; go: (href: string) => void }) => {
  if (isRound(p)) {
    return (
      <>
        <UpButton price={p.yesPrice} onClick={() => go(pickHref(p, p.yesOptionId))} />
        <DownButton price={p.noPrice} onClick={() => go(pickHref(p, p.noOptionId))} />
      </>
    );
  }
  if (p.optionCount > 2) {
    return (
      <>
        <OddsButton label={p.yesLabel} price={p.yesPrice} onClick={() => go(pickHref(p, p.yesOptionId))} />
        <OddsButton label={p.noLabel} price={p.noPrice} onClick={() => go(pickHref(p, p.noOptionId))} />
        <button type="button" className="lnk" style={{ fontSize: 13 }} onClick={() => go(pickHref(p))}>
          +{p.optionCount - 2} more
        </button>
      </>
    );
  }
  if (/^yes$/i.test(p.yesLabel)) {
    return (
      <>
        <UpButton label="Yes" price={p.yesPrice} onClick={() => go(pickHref(p, p.yesOptionId))} />
        <DownButton label="No" price={p.noPrice} onClick={() => go(pickHref(p, p.noOptionId))} />
      </>
    );
  }
  return (
    <>
      <OddsButton label={p.yesLabel} price={p.yesPrice} onClick={() => go(pickHref(p, p.yesOptionId))} />
      <OddsButton label={p.noLabel} price={p.noPrice} onClick={() => go(pickHref(p, p.noOptionId))} />
    </>
  );
};

export const HomeDeskSection = ({ picks, isMobile, nowOverride }: { picks: EditorPick[]; isMobile: boolean; nowOverride?: number }) => {
  const navigate = useNavigate();
  if (picks.length === 0) return null;
  const go = (href: string) => navigate(href);
  const eyebrow = `✦ Editor's Desk · ${picks.length} pick${picks.length === 1 ? "" : "s"}`;
  const question = (
    <>
      What's worth <i>watching</i>?
    </>
  );

  if (isMobile) {
    return (
      <section className="sec">
        <SectionHead eyebrow={eyebrow} eyebrowColor={LM} question={question} isMobile />
        <div style={{ marginTop: 18 }}>
          {picks.map((p, k) => (
            <div key={p.id} style={{ padding: "16px 0", borderTop: "1px solid rgba(148,163,184,.12)" }}>
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
      </section>
    );
  }

  return (
    <section className="sec">
      <SectionHead eyebrow={eyebrow} eyebrowColor={LM} question={question} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", columnGap: 56, marginTop: 30, alignItems: "stretch" }}>
        {picks.map((p, k) => (
          <div key={p.id} className="pcol">
            <div className="row" style={{ gap: 12, alignItems: "baseline" }}>
              <span className="pnum">{String(k + 1).padStart(2, "0")}</span>
              <span className="lbl">
                {catLabel(p)}
                {p.endDate ? ` · ${whenLabel(p.endDate, nowOverride)}` : ""}
              </span>
            </div>
            <div className="ptitle" style={{ marginTop: 12 }}>
              {p.name}
            </div>
            <p className="pwhy">“{p.note}”</p>
            <div className="row" style={{ gap: 8, marginTop: "auto", paddingTop: 16, flexWrap: "wrap" }}>
              <Buttons p={p} go={go} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomeDeskSection;
