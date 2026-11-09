import { Fragment, useState } from "react";
// ============================================================
// HOME · ALL view — shared shell for the five sections (首页 All 改版 D2-S3).
// Mock = spec (canvas 2026-11-09): section head = eyebrow + question, no
// third line (G1); Up/Yes cyan · Down/No lime · live/clock orange (G2);
// every price button / row / stage opens the event's trade page (G3).
// ============================================================
import type { CSSProperties, ReactNode } from "react";
import { getI18nLanguage, t } from "@/i18n";
import "./home-all.css";

/** i18n key prefix of the five home sections (Lovable 2026-11-09, events namespace). */
export const HK = "events.screen.simple.home_all";
/** Translate a home-section key (`ht("sports.up_next")`). */
export const ht = (k: string, vars?: Record<string, string | number>) => t(`${HK}.${k}`, vars);
/** Viewer language for dates / weekdays (same as the Sports view: weekday follows the user's language, 24h clock). */
export const uiLocale = () => getI18nLanguage();

/**
 * Catalog text with markup → nodes. `*x*` = the italic half of a section
 * question; `{{name}}` = a value the component renders itself (bold number,
 * coloured word). Plain `{{vars}}` are interpolated by t() before this runs.
 */
export const rich = (raw: string, nodes: Record<string, ReactNode> = {}): ReactNode[] =>
  raw
    .split(/(\*[^*]+\*|\{\{\w+\}\})/)
    .filter(Boolean)
    .map((part, i) => {
      if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <i key={i}>{part.slice(1, -1)}</i>;
      const m = /^\{\{(\w+)\}\}$/.exec(part);
      return <Fragment key={i}>{m && m[1] in nodes ? nodes[m[1]] : part}</Fragment>;
    });

export const CY = "#33D6FF";
export const LM = "#CFFF4A";
export const OR = "#FF8A3D";
export const MU = "#98A1AD";
export const RED = "#F87171";
export const GREEN = "#4ADE80";

/** Section head: eyebrow (category · shape · count/state) + 48px question. */
export const SectionHead = ({
  eyebrow,
  eyebrowColor,
  question,
  right,
  isMobile,
}: {
  eyebrow: ReactNode;
  eyebrowColor: string;
  question: ReactNode;
  right?: ReactNode;
  isMobile?: boolean;
}) => (
  <div className="head">
    <div>
      <span className="eye" style={{ color: eyebrowColor }}>
        {eyebrow}
      </span>
      <h2 className="Q">{question}</h2>
    </div>
    {!isMobile && right ? right : <span />}
  </div>
);

/** `{price}` is a share price 0–1 → "34¢". */
export const cents = (p: number): string => `${Math.round(p * 100)}¢`;

export const UpButton = ({
  price,
  onClick,
  style,
  label,
}: {
  price: number;
  onClick?: (e: React.MouseEvent) => void;
  style?: CSSProperties;
  label?: string;
}) => (
  <button type="button" className="up" style={style} onClick={onClick}>
    {label ?? t("events.screen.simple.home.home_crypto_card.up")} <b>{cents(price)}</b>
  </button>
);

export const DownButton = ({
  price,
  onClick,
  style,
  label,
}: {
  price: number;
  onClick?: (e: React.MouseEvent) => void;
  style?: CSSProperties;
  label?: string;
}) => (
  <button type="button" className="dn" style={style} onClick={onClick}>
    {label ?? t("events.screen.simple.home.home_crypto_card.down")} <b>{cents(price)}</b>
  </button>
);

/** Team / outcome button: label left, price right (带价按钮通用规范). */
export const OddsButton = ({
  label,
  price,
  onClick,
  style,
}: {
  label: string;
  price: number;
  onClick?: (e: React.MouseEvent) => void;
  style?: CSSProperties;
}) => (
  <button
    type="button"
    className="odds"
    style={{ justifyContent: "space-between", ...style }}
    onClick={onClick}
  >
    <span className="tc-el">{label}</span> <b>{cents(price)}</b>
  </button>
);

/* ------------------------------------------------------------------ */
/* Team badge (S1): every crest sits in the same circle. A real crest   */
/* (transparent PNG) is drawn `contain` at 74%; a feed placeholder tile */
/* (flat colour square) is replaced by a badge in that colour + code;   */
/* no image at all → grey badge + code. Pairs overlap by -5px.          */
/* ------------------------------------------------------------------ */
export const TeamBadge = ({
  code,
  logoUrl,
  tileColor,
  size = 26,
  className,
}: {
  code: string;
  logoUrl?: string | null;
  /** Flat colour detected on a placeholder tile (feed) — badge fill. */
  tileColor?: string | null;
  size?: number;
  className?: string;
}) => {
  const short = (code || "?").slice(0, 4).toUpperCase();
  const fontSize = size >= 44 ? 12 : size >= 30 ? 9.5 : 8.5;
  // A crest that fails to load falls back to the grey badge + code (same as no image).
  const [failed, setFailed] = useState(false);
  if (logoUrl && !tileColor && !failed) {
    return (
      <span className={`tc-lg ${className ?? ""}`} style={{ width: size, height: size }}>
        <img src={logoUrl} alt="" onError={() => setFailed(true)} />
      </span>
    );
  }
  return (
    <span
      className={`tc-lg ${className ?? ""}`}
      style={{ width: size, height: size, background: tileColor || "#1B2130" }}
    >
      <i style={{ fontSize }}>{short}</i>
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Sport icon (Sports 规则稿 v2 · league label = sport glyph + league)   */
/* ------------------------------------------------------------------ */
const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const GLYPH: Record<string, ReactNode> = {
  SOCCER: (
    <svg viewBox="0 0 16 16" {...S}>
      <circle cx="8" cy="8" r="6.3" />
      <path d="M8 4.6l3 2.2-1.1 3.5H6.1L5 6.8z" />
      <path d="M8 4.6V1.7M11 6.8l2.7-.9M9.9 10.3l1.7 2.4M6.1 10.3l-1.7 2.4M5 6.8l-2.7-.9" />
    </svg>
  ),
  BASKETBALL: (
    <svg viewBox="0 0 16 16" {...S}>
      <circle cx="8" cy="8" r="6.3" />
      <path d="M1.7 8h12.6M8 1.7v12.6M3.5 3.5c2.5 2.5 2.5 6.5 0 9M12.5 3.5c-2.5 2.5-2.5 6.5 0 9" />
    </svg>
  ),
  HOCKEY: (
    <svg viewBox="0 0 16 16" {...S}>
      <path d="M3 2.5l5.5 8.2c.5.8 1.3 1.3 2.2 1.3H13" />
      <ellipse cx="5.5" cy="12.8" rx="3" ry="1.3" />
    </svg>
  ),
  FOOTBALL: (
    <svg viewBox="0 0 16 16" {...S}>
      <path d="M2.2 13.8C1.4 9 5 2.7 13.8 2.2c.8 4.8-2.8 11.1-11.6 11.6z" />
      <path d="M5.5 10.5l5-5M6.6 7.3l1 1M8.1 5.8l1 1M9.6 4.3l1 1" />
    </svg>
  ),
  UFC: (
    <svg viewBox="0 0 16 16" {...S}>
      <path d="M4 7V5.2a1.6 1.6 0 013.2 0V7M7.2 6.2V4.6a1.6 1.6 0 013.2 0V7M10.4 6.6V5.4a1.5 1.5 0 013 0V9c0 2.8-2 4.8-4.8 4.8H7.8C5.6 13.8 4 12.2 4 10V7" />
    </svg>
  ),
  ESPORTS: (
    <svg viewBox="0 0 16 16" {...S}>
      <path d="M5 4.5h6a3.5 3.5 0 013.4 4.3l-.6 2.6a1.6 1.6 0 01-2.8.6L9.8 10.5H6.2L5 12a1.6 1.6 0 01-2.8-.6l-.6-2.6A3.5 3.5 0 015 4.5z" />
      <path d="M5.5 7v2M4.5 8h2M10.5 7.5h.01M12 8.8h.01" />
    </svg>
  ),
  TENNIS: (
    <svg viewBox="0 0 16 16" {...S}>
      <circle cx="8" cy="8" r="6.3" />
      <path d="M3.2 3.6c3 1.2 4.6 3.4 4.8 6.6M12.8 12.4c-3-1.2-4.6-3.4-4.8-6.6" />
    </svg>
  ),
  BASEBALL: (
    <svg viewBox="0 0 16 16" {...S}>
      <circle cx="8" cy="8" r="6.3" />
      <path d="M4 2.6c1.6 1.6 2.4 3.4 2.4 5.4S5.6 11.8 4 13.4M12 2.6c-1.6 1.6-2.4 3.4-2.4 5.4s.8 3.8 2.4 5.4" />
    </svg>
  ),
};
export const SportIcon = ({ sport }: { sport: string | null | undefined }) => (
  <span className="sic">{GLYPH[(sport || "SOCCER").toUpperCase()] ?? GLYPH.SOCCER}</span>
);

/** `$1,234,567` → `$1.2M`; `$12,340` → `$12.3k` (Sports volumes, mock literal). */
export const shortVol = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
};

/** Viewer-local HH:mm (全站时间口径 R1: no timezone suffix). */
export const hhmm = (d: Date | number | null | undefined): string => {
  if (d == null) return "--:--";
  const dt = typeof d === "number" ? new Date(d) : d;
  return dt.toLocaleTimeString(uiLocale(), { hour: "2-digit", minute: "2-digit", hour12: false });
};

/** "4h 12m" / "38m" / "00:42" style remaining-time text used by the eyebrows. */
export const leftText = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h >= 1) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m >= 1) return `${m}m`;
  return `${s}s`;
};

/**
 * G3 (CPO 2026-11-09): a price button opens the trade page with that side
 * already picked. `option` = the option id (a team, an outcome); `side` =
 * yes / no (Up = yes, Down = no). The trade pages read both.
 */
export const tradeLink = (
  eventId: string,
  pick?: { option?: string | null; side?: "yes" | "no"; spot?: boolean },
): string => {
  const q = new URLSearchParams({ event: eventId });
  if (pick?.option) q.set("option", pick.option);
  if (pick?.side) q.set("side", pick.side);
  return `${pick?.spot ? "/spot" : "/trade"}?${q.toString()}`;
};

/** Round clock: "02:44"; an hour or more → "1:31:12" (4h / 1D rounds — never "91:12"). */
export const mmss = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
