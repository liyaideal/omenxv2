// ============================================================
// HOME HERO (HP-1 / HP-M)
// Desktop: type left, lynx illustration bleeding off the right edge.
// Mobile: illustration is a full-bleed band on top, type stacked under
// it — the phone-native reading order.
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

  const background =
    "radial-gradient(120% 160% at 30% 0%, #12141d 0%, #0a0c12 55%, #0a0a10 100%)";

  if (isMobile) {
    const bandHeight = narrow ? 118 : 152;
    return (
      <div className="relative w-full overflow-hidden" style={{ background }}>
        <div className="relative w-full" style={{ height: bandHeight }}>
          <img
            src="/assets/mobile/hero-lynx.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full select-none"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: 72,
              background: "linear-gradient(to bottom, rgba(10,10,16,0) 0%, #0a0a10 100%)",
            }}
          />
        </div>
        <div className="relative" style={{ padding: "0 16px 16px" }}>
          <span
            className="font-display inline-flex items-center"
            style={{
              background: LIME,
              color: "#0B0D11",
              borderRadius: 999,
              padding: "5px 12px",
              fontSize: 10.5,
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
              fontSize: 27,
              lineHeight: 1.14,
              letterSpacing: "-0.02em",
              marginTop: 10,
            }}
          >
            What do you think <span style={{ color: LIME }}>happens next</span>?
          </h1>
          <p style={{ marginTop: 8, fontSize: 13, color: "#98A1AD" }}>
            Pick a topic. Tap Yes or No. That's it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ background }}>
      <img
        src="/assets/desktop/hero-lynx.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{ right: -30, bottom: -34, width: 930 }}
      />
      <div
        className="relative mx-auto w-full max-w-7xl"
        style={{ padding: "20px 24px 24px" }}
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
            fontSize: 44,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            marginTop: 18,
          }}
        >
          What do you think <span style={{ color: LIME }}>happens next</span>?
        </h1>
        <p style={{ marginTop: 10, fontSize: 14, color: "#98A1AD" }}>
          Pick a topic. Tap Yes or No. That's it.
        </p>
      </div>
    </div>
  );
};

export default HomeHero;

