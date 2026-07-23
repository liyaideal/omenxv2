import { Order } from "@/stores/useOrdersStore";
import { Position } from "@/stores/usePositionsStore";

// Convert an Order to a Position when the order is filled.
// Yes and No are independent positions: Buy → long on the traded option, Sell → short.
export function orderToPosition(order: Order): Position {
  const priceValue = order.price.replace(/[$,]/g, '');
  const amountValue = order.amount.replace(/,/g, '');

  const totalValue = order.total.replace(/[$,]/g, '');
  const leverage = 10; // Default leverage
  const margin = (parseFloat(totalValue) / leverage).toFixed(2);

  const entryPrice = parseFloat(priceValue);
  const markPriceAdjustment = order.type === 'buy'
    ? 1 + (Math.random() * 0.02 - 0.005)
    : 1 + (Math.random() * 0.02 - 0.015);
  const markPrice = (entryPrice * markPriceAdjustment).toFixed(4);

  const priceDiff = parseFloat(markPrice) - entryPrice;
  const size = parseFloat(amountValue);
  const pnl = order.type === 'buy' ? priceDiff * size : -priceDiff * size;
  const pnlPercent = ((pnl / parseFloat(totalValue)) * 100);

  const positionType: "long" | "short" = order.type === 'buy' ? 'long' : 'short';

  return {
    type: positionType,
    event: order.event,
    option: order.option,
    entryPrice: order.price,
    markPrice: `$${markPrice}`,
    size: order.amount,
    margin: `$${margin}`,
    pnl: `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)}`,
    pnlPercent: `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`,
    leverage: `${leverage}x`,
    tp: '',
    sl: '',
    tpMode: '%',
    slMode: '%',
  };
}
