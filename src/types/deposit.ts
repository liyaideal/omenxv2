// Deposit types based on PRD specifications

export type DepositStatus = 
  | 'PENDING_TX'      // Waiting for user to transfer
  | 'CONFIRMING'      // Transaction detected, waiting for block confirmations
  | 'PENDING_CLAIM'   // Amount < min threshold, needs manual claim
  | 'CONFIRMED'       // Confirmed on chain
  | 'CREDITED'        // Credited to account
  | 'REORG_DETECTED'; // Chain reorganization detected

export type SupportedToken = 'USDT' | 'USDC' | 'BTC' | 'ETH' | 'BNB' | 'SOL' | 'AVAX' | 'MATIC' | 'LINK' | 'UNI' | 'AAVE' | 'ARB' | 'OP';

export type AssetCategory = 'all' | 'stablecoins' | 'crypto';

export interface DepositRecord {
  id: string;
  txHash: string;
  amount: number;
  token: SupportedToken;
  status: DepositStatus;
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
  confirmedAt?: string;
  creditedAt?: string;
}

export interface TokenConfig {
  symbol: SupportedToken;
  name: string;
  icon: string;
  network: string;
  chainId: number;
  address: string;
  decimals: number;
  minAmount: number;
  confirmationBlocks: number;
  estimatedTime: string;
  fee: number;
  balance?: number;
  balanceUsd?: number;
}

export interface CustodyConfig {
  address: string;
  network: string;
  chainId: number;
  tokens: TokenConfig[];
}

// Supported tokens configuration
export const SUPPORTED_TOKENS: TokenConfig[] = [
  {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: '💵',
    network: 'BSC (BNB Smart Chain)',
    chainId: 56,
    address: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 18,
    minAmount: 10,
    confirmationBlocks: 15,
    estimatedTime: '< 1 minute',
    fee: 0,
    balance: 0,
    balanceUsd: 0,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '💲',
    network: 'BSC (BNB Smart Chain)',
    chainId: 56,
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    decimals: 18,
    minAmount: 10,
    confirmationBlocks: 15,
    estimatedTime: '< 1 minute',
    fee: 0,
    balance: 0,
    balanceUsd: 0,
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    network: 'Bitcoin Network',
    chainId: 0,
    address: '',
    decimals: 8,
    minAmount: 0.0001,
    confirmationBlocks: 3,
    estimatedTime: '< 30 minutes',
    fee: 0,
    balance: 0,
    balanceUsd: 0,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '⟠',
    network: 'Ethereum Mainnet',
    chainId: 1,
    address: '',
    decimals: 18,
    minAmount: 0.01,
    confirmationBlocks: 12,
    estimatedTime: '< 3 minutes',
    fee: 0,
    balance: 0,
    balanceUsd: 0,
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    icon: '🔶',
    network: 'BSC (BNB Smart Chain)',
    chainId: 56,
    address: '',
    decimals: 18,
    minAmount: 0.01,
    confirmationBlocks: 15,
    estimatedTime: '< 1 minute',
    fee: 0,
    balance: 0,
    balanceUsd: 0,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    icon: '◎',
    network: 'Solana',
    chainId: 0,
    address: '',
    decimals: 9,
    minAmount: 0.1,
    confirmationBlocks: 32,
    estimatedTime: '< 1 minute',
    fee: 0,
    balance: 0,
    balanceUsd: 0,
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    icon: '🔺',
    network: 'Avalanche C-Chain',
    chainId: 43114,
    address: '',
    decimals: 18,
    minAmount: 0.1,
    confirmationBlocks: 12,
    estimatedTime: '< 1 minute',
    fee: 0,
    balance: 0,
    balanceUsd: 0,
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    icon: '🟣',
    network: 'Polygon',
    chainId: 137,
    address: '',
    decimals: 18,
    minAmount: 1,
    confirmationBlocks: 128,
    estimatedTime: '< 5 minutes',
    fee: 0,
    balance: 0,
    balanceUsd: 0,
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    icon: '⬡',
    network: 'Ethereum Mainnet',
    chainId: 1,
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    decimals: 18,
    minAmount: 0.5,
    confirmationBlocks: 12,
    estimatedTime: '< 3 minutes',
    fee: 0,
    balance: 0,
    balanceUsd: 0,
  },
  {
    symbol: 'ARB',
    name: 'Arbitrum',
    icon: '🔵',
    network: 'Arbitrum One',
    chainId: 42161,
    address: '',
    decimals: 18,
    minAmount: 1,
    confirmationBlocks: 64,
    estimatedTime: '< 15 minutes',
    fee: 0,
    balance: 0,
    balanceUsd: 0,
  },
  {
    symbol: 'OP',
    name: 'Optimism',
    icon: '🔴',
    network: 'Optimism',
    chainId: 10,
    address: '',
    decimals: 18,
    minAmount: 1,
    confirmationBlocks: 50,
    estimatedTime: '< 20 minutes',
    fee: 0,
    balance: 0,
    balanceUsd: 0,
  },
];

// Get custody address for a specific token
export const getCustodyAddress = (token: SupportedToken): string => {
  // In production, each token may have different custody addresses
  // For MVP, using a single BSC custody address
  return '0x742d35Cc6634C0532925a3b844Bc9e7595f5B3E1';
};

// Get token config by symbol
export const getTokenConfig = (symbol: SupportedToken): TokenConfig | undefined => {
  return SUPPORTED_TOKENS.find(t => t.symbol === symbol);
};

// Filter tokens by category
export const filterTokensByCategory = (category: AssetCategory): TokenConfig[] => {
  if (category === 'all') return SUPPORTED_TOKENS;
  if (category === 'stablecoins') return SUPPORTED_TOKENS.filter(t => ['USDT', 'USDC'].includes(t.symbol));
  if (category === 'crypto') return SUPPORTED_TOKENS.filter(t => !['USDT', 'USDC'].includes(t.symbol));
  return SUPPORTED_TOKENS;
};

export const CONFIRMATION_BLOCKS = 15;
export const ESTIMATED_BLOCK_TIME_SECONDS = 3; // BSC ~3 seconds per block
