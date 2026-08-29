// ============================================================
// HOME HERO (HP-1) — badge + headline + sub, lynx illustration bleeding
// off the right edge. Illustration hides under 390px so it never
// crowds the type.
// ============================================================
import { useEffect, useState } from "react";

const LIME = "#CFFF4A";

export const HomeHero = ({ isMobile }: { isMobile: boolean }) => {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const measure = () => setNarrow(window.innerWidth < 390);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 160% at 30% 0%, #12141d 0%, #0a0c12 55%, #0a0a10 100%)",
      }}
    >
      {!narrow && (
        <img
          src={isMobile ? "/assets/mobile/hero-lynx.png" : "/assets/desktop/hero-lynx.png"}
          alt=""
          aria-hidden
          className="pointer-events-none absolute select-none"
          style={
            isMobile
              ? { right: -18, bottom: -20, width: 240, opacity: 0.95 }
              : { right: -30, bottom: -34, width: 930 }
          }
        />
      )}
      <div
        className="relative mx-auto w-full max-w-7xl"
        style={
          isMobile
            ? { padding: "14px 16px 16px" }
            : { padding: "20px 24px 24px" }
        }
      >
        <span
          className="font-display inline-flex items-center"
          style={{
            background: LIME,
            color: "#0B0D11",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          ● Live markets
        </span>
        <h1
          className="font-display font-bold text-foreground"
          style={{
            fontSize: isMobile ? 28 : 44,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            marginTop: isMobile ? 14 : 18,
            maxWidth: isMobile ? 280 : undefined,
          }}
        >
          What do you think <span style={{ color: LIME }}>happens next</span>?
        </h1>
        <p
          style={{
            marginTop: 10,
            fontSize: isMobile ? 13 : 14,
            color: "#98A1AD",
            maxWidth: isMobile ? 260 : undefined,
          }}
        >
          Pick a topic. Tap Yes or No. That's it.
        </p>
      </div>
    </div>
  );
};

export default HomeHero;
