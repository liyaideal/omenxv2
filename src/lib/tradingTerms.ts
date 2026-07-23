/**
 * Trading Terminology Constants
 * 交易专业术语统一定义
 * 
 * 使用规范：所有页面应使用这里定义的术语，确保一致性
 */

export const TRADING_TERMS = {
  // 数量相关
  QTY: "Qty",                        // Quantity - 合约数量
  QTY_FULL: "Quantity",              // 完整形式
  
  // 价格相关
  ENTRY_PRICE: "Entry Price",        // 开仓价格
  MARK_PRICE: "Mark Price",          // 标记价格
  LIQ_PRICE: "Liq. Price",           // 清算价格
  PRICE: "Price",                    // 价格
  
  // 价值相关
  NOTIONAL_VALUE: "Notional Val.",   // 名义价值
  VALUE: "Value",                    // 价值
  
  // 保证金相关
  MARGIN: "Margin",                  // 保证金
  MARGIN_REQ: "Margin Req.",         // 保证金需求
  
  // 杠杆相关
  LEVERAGE: "LVG",                   // 杠杆 (简写)
  LEVERAGE_FULL: "Leverage",         // 杠杆 (完整)
  
  // 方向相关 (展示层统一 Yes/No；底层 side 字段保留 long/short、buy/sell 不变)
  SIDE: "Side",                      // 方向
  LONG: "Yes",                       // long 仓位 → 展示 Yes
  SHORT: "No",                       // short 仓位 → 展示 No
  BUY: "Yes",                        // buy 订单 → 展示 Yes
  SELL: "No",                        // sell 订单 → 展示 No
  
  // 盈亏相关
  PNL: "P&L",                        // Profit & Loss
  UNREALIZED_PNL: "Unrealized P&L",  // 未实现盈亏
  REALIZED_PNL: "Realized P&L",      // 已实现盈亏
  
  // 止盈止损
  TP: "TP",                          // Take Profit
  SL: "SL",                          // Stop Loss
  TPSL: "TP/SL",                     // 止盈止损
  TAKE_PROFIT: "Take Profit",        // 止盈 (完整)
  STOP_LOSS: "Stop Loss",            // 止损 (完整)
  
  // 订单相关
  ORDER_TYPE: "Order Type",          // 订单类型
  MARKET: "Market",                  // 市价单
  LIMIT: "Limit",                    // 限价单
  STATUS: "Status",                  // 状态
  TIME: "Time",                      // 时间
  
  // 合约相关
  CONTRACT: "Contract",              // 合约
  CONTRACTS: "Contracts",            // 合约 (复数)
  
  // 费用相关
  FEE: "Fee",                        // 手续费
  FEE_EST: "Fee (Est.)",             // 预估手续费
  
  // 总计
  TOTAL: "Total",                    // 总计
  
  // 操作相关
  ACTION: "Action",                  // 表头：操作
  VIEW: "View",                      // 按钮：查看
  CLOSE: "Close",                    // 平仓
  
  // 可用余额
  AVAILABLE: "Available",            // 可用
  AMOUNT: "Amount",                  // 金额
  
  // 统计相关
  OPEN_POSITIONS: "Open Positions",  // 持仓数量
  TOTAL_MARGIN: "Total Margin",      // 总保证金
  PROFITABLE: "Profitable",          // 盈利
  WIN_RATE: "Win Rate",              // 胜率
  
  // Settlements
  SETTLED_AT: "Settled At",          // 结算时间
  EXIT_PRICE: "Exit Price",          // 平仓价格
  RESULT: "Result",                  // 结果
} as const;

// 表头定义 - Positions表格
export const POSITION_TABLE_HEADERS = {
  CONTRACT: TRADING_TERMS.CONTRACT,
  SIDE: TRADING_TERMS.SIDE,
  QTY: TRADING_TERMS.QTY,
  ENTRY_PRICE: TRADING_TERMS.ENTRY_PRICE,
  MARK_PRICE: TRADING_TERMS.MARK_PRICE,
  MARGIN: TRADING_TERMS.MARGIN,
  PNL: TRADING_TERMS.PNL,
  TPSL: TRADING_TERMS.TPSL,
  ACTION: TRADING_TERMS.ACTION,
} as const;

// 表头定义 - Orders表格
export const ORDER_TABLE_HEADERS = {
  CONTRACT: TRADING_TERMS.CONTRACTS,
  SIDE: TRADING_TERMS.SIDE,
  TYPE: TRADING_TERMS.ORDER_TYPE,
  PRICE: TRADING_TERMS.PRICE,
  QTY: TRADING_TERMS.QTY,
  VALUE: TRADING_TERMS.VALUE,
  STATUS: TRADING_TERMS.STATUS,
  TIME: TRADING_TERMS.TIME,
  ACTION: TRADING_TERMS.ACTION,
} as const;

// 表头定义 - Settlements表格
export const SETTLEMENT_TABLE_HEADERS = {
  CONTRACT: TRADING_TERMS.CONTRACT,
  SIDE: TRADING_TERMS.SIDE,
  QTY: TRADING_TERMS.QTY,
  ENTRY_PRICE: TRADING_TERMS.ENTRY_PRICE,
  EXIT_PRICE: TRADING_TERMS.EXIT_PRICE,
  PNL: TRADING_TERMS.PNL,
  SETTLED_AT: TRADING_TERMS.SETTLED_AT,
  RESULT: TRADING_TERMS.RESULT,
  ACTION: TRADING_TERMS.ACTION,
} as const;

/**
 * Direction label helpers — UI 全站统一用 Yes/No 展示。
 * 底层字段保持 'long'|'short'、'buy'|'sell'，仅在渲染层映射。
 */
export const sideLabel = (s: "long" | "short" | string): "Yes" | "No" =>
  s === "long" ? "Yes" : "No";

export const orderSideLabel = (s: "buy" | "sell" | string): "Yes" | "No" =>
  s === "buy" ? "Yes" : "No";
