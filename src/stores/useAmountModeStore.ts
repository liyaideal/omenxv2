import { create } from "zustand";
import { persist } from "zustand/middleware";

/** QO-1 · Buy-tab amount entry mode, shared by both Pro terminals, remembered per device. */
export type AmountMode = "usdc" | "units";

interface AmountModeState {
  mode: AmountMode;
  setMode: (m: AmountMode) => void;
}

export const useAmountModeStore = create<AmountModeState>()(
  persist(
    (set) => ({
      mode: "usdc",
      setMode: (mode) => set({ mode }),
    }),
    { name: "omenx-amount-mode" },
  ),
);
