import { parseSideLabels } from "@/lib/eventUtils";

/**
 * Lite-only display mapping for the negative side of a daily up/down stock event.
 * DB side_labels may say "Not Up" for the no side; consumer-facing Lite copy
 * should show "Down" (Polymarket-style up/down). Affirmative side is unchanged.
 */
export function liteSideName(label: string | null | undefined): string {
  if (!label) return "Down";
  return label.trim().toLowerCase() === "not up" ? "Down" : label;
}

/**
 * The word a leg's side is called on Lite. Whenever the event/option carries
 * `side_labels` (fixture lines, up/down stocks, …), the side word IS the side
 * label — never "Yes"/"No". Generic multi-option events fall back to Yes/No.
 */
export function legSideLabel(
  source: { side_labels?: unknown } | null | undefined,
  side: "yes" | "no",
): string {
  const raw = source?.side_labels as { yes?: unknown; no?: unknown } | null | undefined;
  const parsed =
    raw && typeof raw === "object"
      ? typeof (raw as Record<string, unknown>)[side] === "string"
        ? String((raw as Record<string, unknown>)[side]).trim()
        : ""
      : "";
  if (parsed) return liteSideName(parsed);
  return side === "yes" ? "Yes" : "No";
}

/** `"3× Boost"` — renders nothing at 1×, because 1× is "no Boost" on Lite. */
export function boostSuffix(boost: number | null | undefined): string {
  if (!boost || boost <= 1) return "";
  // Weighted multiples (several fills at different boosts) keep ONE decimal;
  // whole multiples never render a trailing ".0".
  const shown = Math.round(boost * 10) / 10;
  return `${Number.isInteger(shown) ? shown : shown.toFixed(1)}× Boost`;
}


/**
 * The word to show for a leg the user actually bought. Yes/No legs resolve
 * through the event's side_labels aliases ("$55K–$65K", "ARS +1.5", Up/Down);
 * generic multi-option legs keep their own option label.
 */
export function optionSideWord(
  option: string | null | undefined,
  sideLabels?: { yes?: string; no?: string } | null,
): string {
  const raw = (option ?? "").trim();
  const lower = raw.toLowerCase();
  if (lower === "yes" || lower === "no") {
    return legSideLabel({ side_labels: sideLabels ?? undefined }, lower as "yes" | "no");
  }
  return liteSideName(raw);
}

export type LegSide = "yes" | "no";
export interface LegLike {
  option: string;
  type: "long" | "short";
}
export interface LegSideInfo {
  /** Which side of the market this leg backs. */
  side: LegSide;
  /** The word the side is called on Lite: alias (Up / Down / ARS +1.5 / Dodgers) or Yes / No. */
  sideWord: string;
  /** Generic multi-option legs only — the option the side is on ("Charles Leclerc"). null for binary / side-labelled legs. */
  optionName: string | null;
}

const NO_PREFIX = "No: ";
export const baseOptionLabel = (option: string) =>
  option.startsWith(NO_PREFIX) ? option.slice(NO_PREFIX.length) : option;

/**
 * THE single source of truth for "which side does this leg back, and what is it called".
 * Rules (CPO 2026-08-31):
 *  - binary Yes/No option  → side = (option is No) XOR (type is short); word = legSideLabel alias or Yes/No
 *  - side-labelled option  → side = (label is the No alias) XOR short; word = alias
 *  - generic multi option  → side = legacy "No: " prefix XOR short; word = Yes/No; optionName = option
 * `type === 'short'` ALWAYS flips the side — a short on Yes is a No leg.
 */
export function resolveLegSide(
  leg: LegLike,
  event: { side_labels?: unknown } | null | undefined,
): LegSideInfo {
  const sl = parseSideLabels(event?.side_labels);
  const base = baseOptionLabel(leg.option).trim();
  const lower = base.toLowerCase();
  const flip = leg.type === "short";

  if (lower === "yes" || lower === "no") {
    const isNo = (lower === "no") !== flip;
    return {
      side: isNo ? "no" : "yes",
      sideWord: legSideLabel(event, isNo ? "no" : "yes"),
      optionName: null,
    };
  }

  if (sl && (liteSideName(base) === liteSideName(sl.yes) || liteSideName(base) === liteSideName(sl.no))) {
    const isNo = (liteSideName(base) === liteSideName(sl.no)) !== flip;
    return {
      side: isNo ? "no" : "yes",
      sideWord: liteSideName(isNo ? sl.no : sl.yes),
      optionName: null,
    };
  }

  const isNo = leg.option.startsWith(NO_PREFIX) !== flip;
  return {
    side: isNo ? "no" : "yes",
    sideWord: isNo ? "No" : "Yes",
    optionName: liteSideName(base),
  };
}

/** Trade-page / settled grammar: "Charles Leclerc · No" for multi legs, bare word otherwise. */
export const legTitle = (info: LegSideInfo) =>
  info.optionName ? `${info.optionName} · ${info.sideWord}` : info.sideWord;
