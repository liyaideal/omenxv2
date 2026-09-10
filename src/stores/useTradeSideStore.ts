import { create } from "zustand";

export type TradeSide = "buy" | "sell";
/** CT-1: panel intent tab. Buy = open/add, Sell = reduce-only close. */
export type TradeIntent = "buy" | "sell";

interface TradeSideState {
  /**
   * Per-event trade side selection. Keyed by `${eventId}:${optionId}` so that
   * switching event/option doesn't leak the previous perspective.
   * Mobile /trade (Charts) and /trade/order share this so the K-line, order
   * book, recent trades and TradeForm always agree on the active side.
   */
  sideByKey: Record<string, TradeSide>;
  getSide: (key: string) => TradeSide;
  setSide: (key: string, side: TradeSide) => void;
  /** CT-1: Buy · Sell intent tab, same key space as `sideByKey`. */
  intentByKey: Record<string, TradeIntent>;
  getIntent: (key: string) => TradeIntent;
  setIntent: (key: string, intent: TradeIntent) => void;
}

export const useTradeSideStore = create<TradeSideState>((set, get) => ({
  sideByKey: {},
  getSide: (key) => get().sideByKey[key] ?? "buy",
  setSide: (key, side) =>
    set((state) => {
      if (state.sideByKey[key] === side) return state;
      return { sideByKey: { ...state.sideByKey, [key]: side } };
    }),
  intentByKey: {},
  getIntent: (key) => get().intentByKey[key] ?? "buy",
  setIntent: (key, intent) =>
    set((state) => {
      if (state.intentByKey[key] === intent) return state;
      return { intentByKey: { ...state.intentByKey, [key]: intent } };
    }),
}));

/** Build the canonical key used in the store. */
export const tradeSideKey = (eventId: string, optionId: string) =>
  `${eventId}:${optionId}`;
