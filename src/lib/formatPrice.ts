// ============================================================
// Table price formatting — one function for every price the quick-round
// Table page prints (question, live number, OPEN line/pill, toasts, poster).
//   ≥ $1  → "$67,412.00"
//   < $1  → subscript-zero notation, 4 significant digits: "$0.0₄1234"
//           (CMC / Dexscreener convention; 1–2 leading zeros stay plain)
// ============================================================
const SUB = "₀₁₂₃₄₅₆₇₈₉";
const subscript = (n: number) =>
  String(n)
    .split("")
    .map((c) => SUB[Number(c)])
    .join("");

export const formatPrice = (n: number | null | undefined): string => {
  if (n == null || !isFinite(n)) return "—";
  if (n >= 1) {
    return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const fixed = n.toFixed(12);
  const m = /^0\.(0*)(\d+)/.exec(fixed);
  if (!m) return `$${n}`;
  const zeros = m[1].length;
  const sig = m[2].slice(0, 4).replace(/0+$/, "") || "0";
  if (zeros >= 3) return `$0.0${subscript(zeros)}${sig}`;
  return `$${n.toFixed(zeros + 4).replace(/0+$/, "").replace(/\.$/, "")}`;
};

/** Same as formatPrice without the "$" (ladder OPEN pill). */
export const formatPriceBare = (n: number | null | undefined) => formatPrice(n).replace(/^\$/, "");

/** Sub-$1 assets read the ladder in % of open; ≥ $1 in dollars. */
export const ladderUsesPct = (open: number | null | undefined) => open != null && open < 1;
