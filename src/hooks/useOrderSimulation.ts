import { useEffect, useRef, useState } from 'react';
import { useOrdersStore, Order } from '@/stores/useOrdersStore';
import { usePositionsStore } from '@/stores/usePositionsStore';
import { orderToPosition } from '@/lib/orderUtils';
import { supabase } from '@/integrations/supabase/client';

// Track which orders are "demo" orders that shouldn't auto-fill
const DEMO_ORDER_TIMES = ['2 mins ago', '5 mins ago', '8 mins ago', '12 mins ago', '15 mins ago', '20 mins ago'];

export function useOrderSimulation() {
  const { orders, updateOrderStatus, fillOrder } = useOrdersStore();
  const { addPosition } = usePositionsStore();
  const processedOrdersRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Skip simulation for logged-in users (they use real data)
    if (isLoggedIn) return;

    // Find new orders that need simulation
    orders.forEach((order, index) => {
      const orderKey = `${order.event}-${order.option}-${order.time}-${order.price}`;
      
      // Skip demo orders (they have preset times)
      if (DEMO_ORDER_TIMES.includes(order.time)) {
        return;
      }
      
      // Skip already processed orders
      if (processedOrdersRef.current.has(orderKey)) {
        return;
      }
      
      // Skip already filled or cancelled orders
      if (order.status === 'Filled' || order.status === 'Cancelled') {
        return;
      }
      
      // Mark as being processed
      processedOrdersRef.current.add(orderKey);
      
      // Simulate order execution with random delays
      simulateOrderExecution(order, index, orderKey);
    });

    // Cleanup timeouts on unmount
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [orders]);

  const simulateOrderExecution = (order: Order, index: number, orderKey: string) => {
    // Market orders fill faster (1-3 seconds)
    // Limit orders have variable fill time (2-8 seconds) and may partial fill first
    const isMarket = order.orderType === 'Market';
    
    if (isMarket) {
      // Market orders: fill quickly
      const delay = 1000 + Math.random() * 2000; // 1-3 seconds
      
      const timeout = setTimeout(() => {
        const currentOrders = useOrdersStore.getState().orders;
        const currentIndex = currentOrders.findIndex(o => 
          o.event === order.event && 
          o.option === order.option && 
          o.time === order.time &&
          o.price === order.price
        );
        
        if (currentIndex !== -1 && currentOrders[currentIndex].status !== 'Filled') {
          const position = orderToPosition(currentOrders[currentIndex]);
          usePositionsStore.getState().addPosition(position);
          useOrdersStore.getState().fillOrder(currentIndex);
        }
        
        timeoutsRef.current.delete(orderKey);
      }, delay);
      
      timeoutsRef.current.set(orderKey, timeout);
    } else {
      // Limit orders: may go through partial fill first
      const willPartialFill = Math.random() > 0.4; // 60% chance of partial fill first
      
      if (willPartialFill) {
        // First: partial fill after 2-4 seconds
        const partialDelay = 2000 + Math.random() * 2000;
        
        const partialTimeout = setTimeout(() => {
          const currentOrders = useOrdersStore.getState().orders;
          const currentIndex = currentOrders.findIndex(o => 
            o.event === order.event && 
            o.option === order.option && 
            o.time === order.time &&
            o.price === order.price
          );
          
          if (currentIndex !== -1 && currentOrders[currentIndex].status === 'Pending') {
            useOrdersStore.getState().updateOrderStatus(currentIndex, 'Partial Filled');
          }
        }, partialDelay);
        
        timeoutsRef.current.set(`${orderKey}-partial`, partialTimeout);
        
        // Then: full fill after additional 3-6 seconds
        const fullDelay = partialDelay + 3000 + Math.random() * 3000;
        
        const fullTimeout = setTimeout(() => {
          const currentOrders = useOrdersStore.getState().orders;
          const currentIndex = currentOrders.findIndex(o => 
            o.event === order.event && 
            o.option === order.option && 
            o.time === order.time &&
            o.price === order.price
          );
          
          if (currentIndex !== -1 && currentOrders[currentIndex].status !== 'Filled') {
            const position = orderToPosition(currentOrders[currentIndex]);
            usePositionsStore.getState().addPosition(position);
            useOrdersStore.getState().fillOrder(currentIndex);
          }
          
          timeoutsRef.current.delete(orderKey);
          timeoutsRef.current.delete(`${orderKey}-partial`);
        }, fullDelay);
        
        timeoutsRef.current.set(orderKey, fullTimeout);
      } else {
        // Direct fill after 3-6 seconds
        const delay = 3000 + Math.random() * 3000;
        
        const timeout = setTimeout(() => {
          const currentOrders = useOrdersStore.getState().orders;
          const currentIndex = currentOrders.findIndex(o => 
            o.event === order.event && 
            o.option === order.option && 
            o.time === order.time &&
            o.price === order.price
          );
          
          if (currentIndex !== -1 && currentOrders[currentIndex].status !== 'Filled') {
            const position = orderToPosition(currentOrders[currentIndex]);
            usePositionsStore.getState().addPosition(position);
            useOrdersStore.getState().fillOrder(currentIndex);
          }
          
          timeoutsRef.current.delete(orderKey);
        }, delay);
        
        timeoutsRef.current.set(orderKey, timeout);
      }
    }
  };
}
