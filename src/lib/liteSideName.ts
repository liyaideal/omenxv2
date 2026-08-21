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
