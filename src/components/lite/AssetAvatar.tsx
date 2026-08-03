// ============================================================
// Asset avatar token — ALWAYS a circle.
// Crypto  → brand fill + glyph.
// Equity  → white fill + static company logo (repo asset), with a
//           ticker monogram fallback. No runtime logo APIs.
// ============================================================
import { useState } from "react";

export type AssetAvatarSize = 34 | 30;

const CRYPTO: Record<string, { bg: string; glyph: string; ink: string }> = {
  BTC: { bg: "#F7931A", glyph: "₿", ink: "#FFFFFF" },
  ETH: { bg: "#7A86A8", glyph: "Ξ", ink: "#FFFFFF" },
  SOL: {
    bg: "linear-gradient(135deg,#9945FF,#14F195)",
    glyph: "S",
    ink: "#101216",
  },
};

/** Static logo files live in /public/company-logos. */
const EQUITY_LOGO: Record<string, string> = {
  AMD: "/company-logos/amd.svg",
  NVDA: "/company-logos/nvda.svg",
  TSLA: "/company-logos/tsla.svg",
  COIN: "/company-logos/coin.svg",
  AAPL: "/company-logos/aapl.svg",
  MSFT: "/company-logos/msft.svg",
  "0700.HK": "/company-logos/0700-hk.svg",
  "9988.HK": "/company-logos/9988-hk.svg",
  "3690.HK": "/company-logos/3690-hk.svg",
  "1810.HK": "/company-logos/1810-hk.svg",
  "1211.HK": "/company-logos/1211-hk.svg",
  "0005.HK": "/company-logos/0005-hk.svg",
};

export interface AssetAvatarProps {
  /** "BTC" | "ETH" | "SOL" for crypto, otherwise an equity ticker. */
  symbol: string;
  kind?: "crypto" | "equity";
  size?: AssetAvatarSize;
  className?: string;
}

export const AssetAvatar = ({
  symbol,
  kind,
  size = 34,
  className,
}: AssetAvatarProps) => {
  const key = (symbol || "").toUpperCase();
  const crypto = CRYPTO[key];
  const isCrypto = kind === "crypto" || (!kind && !!crypto);
  const [logoFailed, setLogoFailed] = useState(false);

  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,.08)",
    flexShrink: 0,
    overflow: "hidden",
  };

  if (isCrypto && crypto) {
    return (
      <span
        className={className}
        style={{
          ...base,
          background: crypto.bg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: crypto.ink,
          fontFamily: "Space Grotesk, sans-serif",
          fontWeight: 700,
          fontSize: size === 34 ? 16 : 14,
          lineHeight: 1,
        }}
        aria-label={key}
      >
        {crypto.glyph}
      </span>
    );
  }

  const logo = EQUITY_LOGO[key];
  const monogram = key.replace(".HK", "").slice(0, 4);

  return (
    <span
      className={className}
      style={{
        ...base,
        background: "#F2F3F5",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label={key}
    >
      {logo && !logoFailed ? (
        <img
          src={logo}
          alt=""
          onError={() => setLogoFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            padding: 6,
          }}
        />
      ) : (
        <span
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 700,
            fontSize: monogram.length > 3 ? 9 : 11,
            color: "#101216",
            lineHeight: 1,
          }}
        >
          {monogram}
        </span>
      )}
    </span>
  );
};

export default AssetAvatar;