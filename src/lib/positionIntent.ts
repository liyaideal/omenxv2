import type { UnifiedPosition } from "@/hooks/usePositions";

export type CanonicalSide = "long" | "short";

export interface CanonicalOrder {
  optionLabel: string;
  side: CanonicalSide;
  price: number;
}

export type OrderIntentKind = "open" | "add" | "reduce" | "close" | "blocked-cross-zero";

export interface OrderIntent {
  kind: OrderIntentKind;
  canonical: CanonicalOrder;
  existingPosition?: UnifiedPosition;
  existingQty: number;
  requestedQty: number;
  qBefore: number;
  dqReq: number;
  qAfter: number;
  reduceQty: number;
  closeQty: number;
  increaseQty: number;
  tradedNotional: number;
  openingNotional: number;
  incrementalMargin: number;
  releasedMargin: number;
  realizedPnl: number;
}

const EPSILON = 0.000001;

export const parseMoney = (value?: string | number | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  return parseFloat(String(value).replace(/[$,]/g, "")) || 0;
};

export const isNoLabel = (label: string) => label.trim().toLowerCase() === "no";

/**
 * Identity mapping: Yes and No options are now independent positions.
 * Buy → long on the traded option, Sell → short on the traded option,
 * price is the clicked price (no `1 - x` flip).
 */
export const toCanonicalOrder = (optionLabel: string, side: "buy" | "sell", clickedPrice: number): CanonicalOrder => ({
  optionLabel,
  side: side === "buy" ? "long" : "short",
  price: +clickedPrice.toFixed(4),
});

export const getIntentLabel = (
  intent: OrderIntent,
  uiSide: "buy" | "sell",
  sideLabels?: { yes: string; no: string } | null,
) => {
  const raw = intent.canonical.optionLabel;
  // 对 binary 单 market 的 "Yes"/"No" 做别名翻译；其他 optionLabel 原样返回
  const lc = raw.trim().toLowerCase();
  const label = sideLabels && (lc === "yes" || lc === "no")
    ? (lc === "yes" ? sideLabels.yes : sideLabels.no)
    : raw;
  if (intent.kind === "reduce") return `Reduce ${label}`;
  if (intent.kind === "close") return `Close ${label}`;
  if (intent.kind === "blocked-cross-zero") return "Close existing position first";
  return uiSide === "buy" ? `Buy ${label}` : `Sell ${label}`;
};

export const classifyOrderIntent = ({
  positions,
  eventName,
  optionLabel,
  side,
  quantity,
  clickedPrice,
  leverage,
}: {
  positions: UnifiedPosition[];
  eventName: string;
  optionLabel: string;
  side: "buy" | "sell";
  quantity: number;
  clickedPrice: number;
  leverage: number;
}): OrderIntent => {
  const canonical = toCanonicalOrder(optionLabel, side, clickedPrice);
  const relevant = positions.filter(
    (position) =>
      !position.isAirdrop &&
      position.event === eventName &&
      position.option.toLowerCase() === canonical.optionLabel.toLowerCase()
  );

  const sameSide = relevant.find((position) => position.type === canonical.side);
  const oppositeSide = relevant.find((position) => position.type !== canonical.side);
  const existingPosition = oppositeSide ?? sameSide;
  const existingQty = existingPosition ? parseMoney(existingPosition.size) : 0;
  const requestedQty = Math.max(0, quantity || 0);
  const tradedNotional = clickedPrice * requestedQty;
  const qBefore = existingPosition ? (existingPosition.type === "long" ? existingQty : -existingQty) : 0;
  const dqReq = canonical.side === "long" ? requestedQty : -requestedQty;
  const qAfter = qBefore + dqReq;

  const base = {
    canonical,
    existingPosition,
    existingQty,
    requestedQty,
    qBefore,
    dqReq,
    qAfter,
    tradedNotional,
  };

  if (!existingPosition || existingQty <= EPSILON) {
    const openingNotional = canonical.price * requestedQty;
    return { ...base, kind: "open", existingQty: 0, qBefore: 0, qAfter: dqReq, reduceQty: 0, closeQty: 0, increaseQty: requestedQty, openingNotional, incrementalMargin: openingNotional / Math.max(leverage, 1), releasedMargin: 0, realizedPnl: 0 };
  }

  if (existingPosition.type === canonical.side) {
    const openingNotional = canonical.price * requestedQty;
    return { ...base, kind: "add", reduceQty: 0, closeQty: 0, increaseQty: requestedQty, openingNotional, incrementalMargin: openingNotional / Math.max(leverage, 1), releasedMargin: 0, realizedPnl: 0 };
  }

  const margin = parseMoney(existingPosition.margin);
  const entryPrice = parseMoney(existingPosition.entryPrice);
  const closeQty = Math.min(requestedQty, existingQty);
  const releasedMargin = existingQty > 0 ? (margin * closeQty) / existingQty : 0;
  const realizedPnl = existingPosition.type === "long"
    ? (canonical.price - entryPrice) * closeQty
    : (entryPrice - canonical.price) * closeQty;

  if (requestedQty > existingQty + EPSILON) {
    const increaseQty = requestedQty - existingQty;
    const openingNotional = canonical.price * increaseQty;
    return { ...base, kind: "blocked-cross-zero", reduceQty: existingQty, closeQty: existingQty, increaseQty, openingNotional, incrementalMargin: openingNotional / Math.max(leverage, 1), releasedMargin, realizedPnl };
  }

  return {
    ...base,
    kind: Math.abs(requestedQty - existingQty) <= EPSILON ? "close" : "reduce",
    reduceQty: closeQty,
    closeQty,
    increaseQty: 0,
    openingNotional: 0,
    incrementalMargin: 0,
    releasedMargin,
    realizedPnl,
  };
};