import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Order {
  type: "buy" | "sell";
  orderType: "Limit" | "Market";
  event: string;
  option: string;
  probability?: string;
  price: string;
  amount: string;
  filledAmount?: string;
  remainingAmount?: string;
  total: string;
  time: string;
  status: "Pending" | "Partial Filled" | "Filled" | "Cancelled";
}

interface OrdersStore {
  orders: Order[];
  addOrder: (order: Order) => void;
  cancelOrder: (index: number) => void;
  fillOrder: (index: number) => void;
  updateOrderStatus: (index: number, status: Order['status']) => void;
  setOrders: (orders: Order[]) => void;
  clearOrders: () => void;
}

const initialOrders: Order[] = [
  {
    type: "buy",
    orderType: "Limit",
    event: "Elon Musk # tweets December 12 - December 19, 2025?",
    option: "200-219",
    probability: "35%",
    price: "$0.3456",
    amount: "1,500",
    total: "$518",
    time: "2 mins ago",
    status: "Pending",
  },
  {
    type: "sell",
    orderType: "Limit",
    event: "Bitcoin price on January 1, 2026?",
    option: "$95,000-$100,000",
    price: "$0.2850",
    amount: "800",
    total: "$228",
    time: "5 mins ago",
    status: "Pending",
  },
  {
    type: "buy",
    orderType: "Limit",
    event: "Elon Musk # tweets December 12 - December 19, 2025?",
    option: "220-239",
    price: "$0.2834",
    amount: "3,000",
    filledAmount: "1,800",
    remainingAmount: "1,200",
    total: "$850",
    time: "8 mins ago",
    status: "Partial Filled",
  },
  {
    type: "buy",
    orderType: "Market",
    event: "Fed interest rate decision December 2025?",
    option: "No Change",
    price: "$0.6200",
    amount: "500",
    total: "$310",
    time: "12 mins ago",
    status: "Pending",
  },
  {
    type: "sell",
    orderType: "Limit",
    event: "Tesla Q4 2025 deliveries?",
    option: "500k-550k",
    price: "$0.4100",
    amount: "1,200",
    filledAmount: "600",
    remainingAmount: "600",
    total: "$492",
    time: "15 mins ago",
    status: "Partial Filled",
  },
  {
    type: "buy",
    orderType: "Limit",
    event: "S&P 500 year-end 2025?",
    option: "6,000-6,200",
    price: "$0.1850",
    amount: "2,000",
    total: "$370",
    time: "20 mins ago",
    status: "Pending",
  },
];

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set) => ({
      orders: initialOrders,
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      cancelOrder: (index) => set((state) => ({ 
        orders: state.orders.filter((_, i) => i !== index) 
      })),
      fillOrder: (index) => set((state) => ({
        orders: state.orders.filter((_, i) => i !== index)
      })),
      updateOrderStatus: (index, status) => set((state) => ({
        orders: state.orders.map((order, i) => 
          i === index ? { ...order, status } : order
        )
      })),
      setOrders: (orders) => set({ orders }),
      clearOrders: () => set({ orders: [] }),
    }),
    {
      name: 'orders-storage', // localStorage key
    }
  )
);
