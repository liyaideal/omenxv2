import { create } from "zustand";

export type TradeSide = "buy" | "sell";

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
}

export const useTradeSideStore = create<TradeSideState>((set, get) => ({
  sideByKey: {},
  getSide: (key) => get().sideByKey[key] ?? "buy",
  setSide: (key, side) =>
    set((state) => {
      if (state.sideByKey[key] === side) return state;
      return { sideByKey: { ...state.sideByKey, [key]: side } };
    }),
}));

/** Build the canonical key used in the store. */
export const tradeSideKey = (eventId: string, optionId: string) =>
  `${eventId}:${optionId}`;
