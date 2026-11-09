// ============================================================
// HOME HERO (首页 All 改版 · H2 / H3, 2026-11-09)
// Desktop: a 1440×260 full-width band — the designer's lynx-keyboard
// illustration is the whole backdrop (2× PNG, right-aligned, full height;
// Figma omenx_lite 140-69056), a left-light / right-dark gradient over it;
// LIVE MARKETS pill, two-line 56px H1 (second line lime), 15px subline.
// Mobile (Figma 203-91049): centred two-line 26px title, one subline, then
// the 358×89 illustration strip; no pill.
// Copy = the 10-26 SEO candidate (heading_v2 / sub_v2); the mobile subline
// drops the question half (Liya 2026-11-09 15:25).
// ============================================================
import { t } from "@/i18n";

const LIME = "#CFFF4A";

/** "Prediction markets,<highlight>with leverage.</highlight>" → two lines. */
const Heading = ({ size }: { size: number }) => {
  const raw = t("events.screen.simple.home.home_hero.heading_v2");
  const m = /^(.*?)<highlight>(.*?)<\/highlight>(.*)$/s.exec(raw);
  const a = m ? m[1] : raw;
  const b = m ? m[2] : "";
  const c = m ? m[3] : "";
  return (
    <h1
      className="font-display"
      style={{ margin: 0, fontSize: size, fontWeight: 700, color: "#fff", lineHeight: size >= 40 ? 1.0 : 1.0, letterSpacing: "-.03em" }}
    >
      {a}
      {b && (
        <>
          <br />
          <span style={{ color: LIME }}>{b}</span>
        </>
      )}
      {c}
    </h1>
  );
};

export const HomeHero = ({ isMobile }: { isMobile: boolean }) => {
  if (isMobile) {
    return (
      // Designer phone frame 203:91049: no divider under the band — the chip row follows directly.
      <div style={{ background: "#0B0D11" }}>
        <div style={{ padding: "16px 16px 0", textAlign: "center" }}>
          <Heading size={26} />
          <div style={{ marginTop: 8, fontSize: 14, color: "#98A1AD", lineHeight: 1.4 }}>
            {t("events.screen.simple.home.home_hero.sub_v2_mobile")}
          </div>
          <img
            // Designer frame 203:91054 exported whole (panel + illustration, 3×) — it sits right under the sub line.
            src="/assets/mobile/hero-band@3x.png"
            alt=""
            aria-hidden
            style={{ display: "block", width: "100%", height: "auto", marginTop: 4 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: 260,
        borderBottom: "1px solid rgba(148,163,184,.08)",
        background: "#0B0D11 url(/assets/desktop/hero-band@2x.png) right center / auto 100% no-repeat",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, rgba(11,13,17,.55) 0%, rgba(11,13,17,.25) 45%, rgba(11,13,17,0) 65%, rgba(11,13,17,.35) 100%)" }}
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 lg:px-6" style={{ paddingTop: 40 }}>
        <span
          className="font-display inline-flex items-center"
          style={{
            gap: 6,
            background: LIME,
            color: "#0B0D11",
            borderRadius: 999,
            padding: "4px 11px",
            height: 21,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            lineHeight: "13px",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0B0D11" }} />
          {t("events.screen.simple.home.home_hero.live_markets").replace(/^●\s*/, "")}
        </span>
        <div style={{ marginTop: 16 }}>
          <Heading size={56} />
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 15, color: "#DBE2EA", maxWidth: 520, lineHeight: 1.4 }}>
          {t("events.screen.simple.home.home_hero.sub_v2")}
        </p>
      </div>
    </div>
  );
};

export default HomeHero;
