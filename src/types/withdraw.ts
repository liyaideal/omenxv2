// Withdrawal types based on PRD specifications

export type WithdrawStatus = 
  | 'IDLE'           // Initial state
  | 'REQUESTED'      // Request submitted, funds frozen
  | 'APPROVED'       // Risk check passed
  | 'REJECTED'       // Risk check failed, funds unfrozen
  | 'SENT'           // Transaction sent to chain
  | 'CONFIRMED'      // Transaction confirmed, funds deducted
  | 'FAILED';        // Transaction failed, funds unfrozen

export interface WithdrawRecord {
  id: string;
  txHash?: string;
  amount: number;
  fee: number;
  netAmount: number;
  token: string;
  toAddress: string;
  status: WithdrawStatus;
  createdAt: string;
  approvedAt?: string;
  sentAt?: string;
  confirmedAt?: string;
  failedAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
  failReason?: string;
}

export interface WithdrawLimits {
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
}

export interface WithdrawFormData {
  token: string;
  amount: string;
  toAddress: string;
  network?: string;
  /** Source account for the debit ('spot' | 'futures'). Defaults to 'futures' when omitted. */
  account?: 'spot' | 'futures';
}

// Fee configuration per token
export const WITHDRAW_FEES: Record<string, number> = {
  USDT: 1,
  USDC: 1,
  BTC: 0.0001,
  ETH: 0.001,
  BNB: 0.001,
  SOL: 0.01,
  AVAX: 0.01,
  MATIC: 1,
  LINK: 0.1,
  ARB: 0.5,
  OP: 0.5,
};

// Minimum withdrawal amounts per token
export const WITHDRAW_MINIMUMS: Record<string, number> = {
  USDT: 20,
  USDC: 20,
  BTC: 0.001,
  ETH: 0.01,
  BNB: 0.05,
  SOL: 0.5,
  AVAX: 0.5,
  MATIC: 10,
  LINK: 1,
  ARB: 5,
  OP: 5,
};

export const getWithdrawFee = (token: string): number => {
  return WITHDRAW_FEES[token] ?? 0;
};

export const getWithdrawMinimum = (token: string): number => {
  return WITHDRAW_MINIMUMS[token] ?? 0;
};
