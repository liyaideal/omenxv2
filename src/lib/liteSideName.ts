/**
 * Lite-only display mapping for the negative side of a daily up/down stock event.
 * DB side_labels may say "Not Up" for the no side; consumer-facing Lite copy
 * should show "Down" (Polymarket-style up/down). Affirmative side is unchanged.
 */
export function liteSideName(label: string | null | undefined): string {
  if (!label) return "Down";
  return label.trim().toLowerCase() === "not up" ? "Down" : label;
}
