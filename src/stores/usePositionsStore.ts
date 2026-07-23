import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Position {
  type: "long" | "short";
  event: string;
  option: string;
  entryPrice: string;
  markPrice: string;
  size: string;
  margin: string;
  pnl: string;
  pnlPercent: string;
  leverage: string;
  tp: string;
  sl: string;
  tpMode: "%" | "$";
  slMode: "%" | "$";
}

interface PositionsStore {
  positions: Position[];
  addPosition: (position: Position) => void;
  closePosition: (index: number) => void;
  partialClosePosition: (index: number, closeQty: number) => void;
  updatePositionTpSl: (index: number, tp: string, sl: string, tpMode: "%" | "$", slMode: "%" | "$") => void;
  setPositions: (positions: Position[]) => void;
  clearPositions: () => void;
}

const initialPositions: Position[] = [
  {
    type: "long",
    event: "Elon Musk # tweets December 12 - December 19, 2025?",
    option: "200-219",
    entryPrice: "$0.3200",
    markPrice: "$0.3456",
    size: "2,500",
    margin: "$80.00",
    pnl: "+$64.00",
    pnlPercent: "+8.0%",
    leverage: "10x",
    tp: "",
    sl: "",
    tpMode: "%",
    slMode: "%",
  },
  {
    type: "long",
    event: "Fed interest rate decision December 2025?",
    option: "25bp Cut",
    entryPrice: "$0.4500",
    markPrice: "$0.5120",
    size: "3,000",
    margin: "$135.00",
    pnl: "+$186.00",
    pnlPercent: "+13.8%",
    leverage: "10x",
    tp: "25",
    sl: "10",
    tpMode: "%",
    slMode: "%",
  },
  {
    type: "long",
    event: "Tesla Q4 2025 deliveries?",
    option: "450k-500k",
    entryPrice: "$0.2800",
    markPrice: "$0.2650",
    size: "2,000",
    margin: "$56.00",
    pnl: "-$30.00",
    pnlPercent: "-5.4%",
    leverage: "10x",
    tp: "",
    sl: "",
    tpMode: "%",
    slMode: "%",
  },
  {
    type: "long",
    event: "S&P 500 year-end 2025?",
    option: "5,800-6,000",
    entryPrice: "$0.3100",
    markPrice: "$0.3350",
    size: "1,800",
    margin: "$55.80",
    pnl: "+$45.00",
    pnlPercent: "+8.1%",
    leverage: "10x",
    tp: "15",
    sl: "8",
    tpMode: "%",
    slMode: "%",
  },
];

export const usePositionsStore = create<PositionsStore>()(
  persist(
    (set) => ({
      positions: initialPositions,
      addPosition: (position) => set((state) => ({ positions: [position, ...state.positions] })),
      closePosition: (index) => set((state) => ({ 
        positions: state.positions.filter((_, i) => i !== index) 
      })),
      partialClosePosition: (index, closeQty) => set((state) => {
        const pos = state.positions[index];
        if (!pos) return {};
        const parseNum = (s: string) => parseFloat(String(s).replace(/[$,]/g, "")) || 0;
        const currentSize = parseNum(pos.size);
        const qty = Math.min(Math.max(1, Math.floor(closeQty)), Math.floor(currentSize));
        // Full close
        if (qty >= currentSize) {
          return { positions: state.positions.filter((_, i) => i !== index) };
        }
        const ratio = qty / currentSize;
        const currentMargin = parseNum(pos.margin);
        const newSize = currentSize - qty;
        const newMargin = currentMargin * (1 - ratio);
        return {
          positions: state.positions.map((p, i) =>
            i === index
              ? {
                  ...p,
                  size: newSize.toLocaleString(),
                  margin: `$${newMargin.toFixed(2)}`,
                }
              : p
          ),
        };
      }),
      updatePositionTpSl: (index, tp, sl, tpMode, slMode) => set((state) => ({
        positions: state.positions.map((pos, i) => 
          i === index ? { ...pos, tp, sl, tpMode, slMode } : pos
        )
      })),
      setPositions: (positions) => set({ positions }),
      clearPositions: () => set({ positions: [] }),
    }),
    {
      name: 'positions-storage-v3', // Force clear old data with "No" positions
    }
  )
);

// Clear old storage keys on module load
if (typeof window !== 'undefined') {
  localStorage.removeItem('positions-storage');
  localStorage.removeItem('positions-storage-v2');
}
