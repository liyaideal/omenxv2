import { useMemo, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useSupabaseOrders, SupabaseOrder } from "./useSupabaseOrders";
import { useOrdersStore, Order } from "@/stores/useOrdersStore";
import { useEventDisplayLookup } from "./useEventDisplayLookup";

// Unified order type for UI
export interface UnifiedOrder {
  id?: string;
  type: "buy" | "sell";
  orderType: "Limit" | "Market";
  event: string;
  option: string;
  /** Display label after applying sideLabels (e.g. team name). Falls back to option. */
  displayOption?: string;
  probability?: string;
  price: string;
  amount: string;
  filledAmount?: string;
  remainingAmount?: string;
  total: string;
  time: string;
  status: "Pending" | "Partial Filled" | "Filled" | "Cancelled";
  productLine?: string | null;
}


// Convert Supabase order to unified format
const convertSupabaseOrder = (order: SupabaseOrder): UnifiedOrder => {
  const createdAt = new Date(order.created_at);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let timeAgo: string;
  if (diffMins < 1) {
    timeAgo = "Just now";
  } else if (diffMins < 60) {
    timeAgo = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  return {
    id: order.id,
    type: order.side as "buy" | "sell",
    orderType: order.order_type as "Limit" | "Market",
    event: order.event_name,
    option: order.option_label,
    price: `$${order.price.toFixed(4)}`,
    amount: order.quantity.toLocaleString(),
    total: `$${order.amount.toFixed(2)}`,
    time: timeAgo,
    status: order.status as "Pending" | "Partial Filled" | "Filled" | "Cancelled",
    productLine: order.product_line ?? "futures",
  };
};


// Convert local order to unified format
const convertLocalOrder = (order: Order): UnifiedOrder => ({
  type: order.type,
  orderType: order.orderType,
  event: order.event,
  option: order.option,
  probability: order.probability,
  price: order.price,
  amount: order.amount,
  filledAmount: order.filledAmount,
  remainingAmount: order.remainingAmount,
  total: order.total,
  time: order.time,
  status: order.status,
});

export const useOrders = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  // Supabase orders for logged-in users
  const {
    orders: supabaseOrders,
    isLoading,
    refetch: refetchSupabaseOrders,
    cancelOrder: cancelSupabaseOrder,
    fillOrder: fillSupabaseOrder,
    isCancelling,
    isFilling,
  } = useSupabaseOrders();

  // Local orders for guests
  const { orders: localOrders, cancelOrder: cancelLocalOrder, fillOrder: fillLocalOrder } = useOrdersStore();

  const resolveDisplayOption = useEventDisplayLookup();

  // Get unified orders based on auth state
  const orders = useMemo((): UnifiedOrder[] => {
    const base = isLoggedIn
      ? supabaseOrders.map(convertSupabaseOrder)
      : localOrders
          .filter((o) => o.status === "Pending" || o.status === "Partial Filled")
          .map(convertLocalOrder);
    return base.map((o) => ({
      ...o,
      displayOption: resolveDisplayOption(o.event, o.option),
    }));
  }, [isLoggedIn, supabaseOrders, localOrders, resolveDisplayOption]);

  // Refetch orders
  const refetch = useCallback(() => {
    if (isLoggedIn) {
      refetchSupabaseOrders();
    }
  }, [isLoggedIn, refetchSupabaseOrders]);

  // Cancel order
  const cancelOrder = useCallback(
    async (orderIdOrIndex: string | number) => {
      if (isLoggedIn && typeof orderIdOrIndex === "string") {
        await cancelSupabaseOrder(orderIdOrIndex);
      } else if (typeof orderIdOrIndex === "number") {
        cancelLocalOrder(orderIdOrIndex);
      }
    },
    [isLoggedIn, cancelSupabaseOrder, cancelLocalOrder]
  );

  // Fill order
  const fillOrder = useCallback(
    async (orderIdOrIndex: string | number) => {
      if (isLoggedIn && typeof orderIdOrIndex === "string") {
        await fillSupabaseOrder(orderIdOrIndex);
      } else if (typeof orderIdOrIndex === "number") {
        fillLocalOrder(orderIdOrIndex);
      }
    },
    [isLoggedIn, fillSupabaseOrder, fillLocalOrder]
  );

  return {
    orders,
    isLoading,
    refetch,
    cancelOrder,
    fillOrder,
    isCancelling,
    isFilling,
  };
};
