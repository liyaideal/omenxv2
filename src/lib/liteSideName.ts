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
  return boost && boost > 1 ? `${boost}× Boost` : "";
}
