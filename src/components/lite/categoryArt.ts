// ============================================================
// Shared category → micro-label / card art mapping for Lite surfaces.
// Literal maps only, so asset scanners see real paths.
// ============================================================
export const CATEGORY_MICROLABEL: Record<string, string> = {
  stocks: "Stocks",
  crypto: "Crypto",
  tech: "Tech",
  macro: "Macro",
  politics: "Macro",
  finance: "Stocks",
  sports: "Sports",
  entertainment: "Entertainment",
  social: "Social",
};

export const CATEGORY_CARD_IMAGE: Record<string, string> = {
  stocks: "/card-bg/finance.jpg",
  finance: "/card-bg/finance.jpg",
  macro: "/card-bg/finance.jpg",
  politics: "/card-bg/politics.jpg",
  crypto: "/card-bg/crypto.jpg",
  tech: "/card-bg/tech.jpg",
  sports: "/card-bg/sports.jpg",
  entertainment: "/card-bg/entertainment.jpg",
  social: "/card-bg/social.jpg",
};

export const microlabelFor = (category: string | null | undefined): string =>
  CATEGORY_MICROLABEL[(category || "").toLowerCase()] ?? "Market";

export const cardImageFor = (
  category: string | null | undefined,
  imageUrl?: string | null,
): string | null =>
  imageUrl ?? CATEGORY_CARD_IMAGE[(category || "").toLowerCase()] ?? null;