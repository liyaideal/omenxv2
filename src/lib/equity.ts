/**
 * Total Equity 口径（Dual-Account · 2b Trial Bonus 下线后单一 source）
 *
 * Total Equity = spot_balance + balance (futures available)
 *
 * Trial Bonus 已于 2026-07-21 全站下线（从未真正上线；发放源已死；
 * 与 Position Voucher / voucher_earnings 零依赖）。任何 UI 读该口径
 * 必须走此 helper，禁止再各处拼装。不含未实现盈亏。
 */
export const computeTotalEquity = (parts: {
  spotBalance?: number | null;
  balance?: number | null;
}): number => {
  return (parts.spotBalance ?? 0) + (parts.balance ?? 0);
};

export const formatEquityUsd = (value: number, digits = 2): string =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
