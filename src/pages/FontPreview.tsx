import { useEffect } from "react";

const FONTS = [
  { id: 1, name: "Archivo (brand, expanded)", family: "'Archivo', sans-serif", stretch: "125%" },
  { id: 2, name: "Inter", family: "'Inter', sans-serif", stretch: "normal" },
  { id: 3, name: "Manrope", family: "'Manrope', sans-serif", stretch: "normal" },
  { id: 4, name: "Space Grotesk", family: "'Space Grotesk', sans-serif", stretch: "normal" },
  { id: 5, name: "Sora", family: "'Sora', sans-serif", stretch: "normal" },
  { id: 6, name: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', sans-serif", stretch: "normal" },
  { id: 7, name: "Onest", family: "'Onest', sans-serif", stretch: "normal" },
  { id: 8, name: "Figtree", family: "'Figtree', sans-serif", stretch: "normal" },
  { id: 9, name: "IBM Plex Sans", family: "'IBM Plex Sans', sans-serif", stretch: "normal" },
];

export default function FontPreview() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Inter:wght@400;700;800&family=Manrope:wght@400;700;800&family=Space+Grotesk:wght@400;700&family=Sora:wght@400;700;800&family=Plus+Jakarta+Sans:wght@400;700;800&family=Onest:wght@400;700;800&family=Figtree:wght@400;700;800&family=IBM+Plex+Sans:wght@400;700&display=swap";
    document.head.appendChild(l);
    return () => { document.head.removeChild(l); };
  }, []);

  return (
    <div style={{ background: "#0A0B0D", minHeight: "100vh", padding: "48px 40px", color: "#fff" }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9AA1AC", marginBottom: 8 }}>
        OmenX — Font options for the big numbers
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#6B7280", marginBottom: 36 }}>
        Same number, 9 fonts. All load consistently for every user. Tell me the number you want.
      </div>
      {FONTS.map((f) => (
        <div key={f.id} style={{ marginBottom: 34, borderBottom: "1px solid #1D2026", paddingBottom: 26 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#7FE4FF", marginBottom: 8, fontWeight: 600 }}>
            {f.id} · {f.name}
          </div>
          <div style={{ fontFamily: f.family, fontStretch: f.stretch, fontWeight: 800, fontSize: 64, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            $12,847.00
          </div>
          <div style={{ display: "flex", gap: 40, marginTop: 14 }}>
            <span style={{ fontFamily: f.family, fontStretch: f.stretch, fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>$3,210.00</span>
            <span style={{ fontFamily: f.family, fontStretch: f.stretch, fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>$9,637.00</span>
          </div>
        </div>
      ))}
    </div>
  );
}
