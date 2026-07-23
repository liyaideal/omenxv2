import { useState, useCallback } from 'react';

export interface MockWalletState {
  connected: boolean;
  address: string;
  chainId: string;
  balances: Record<string, Record<string, number>>;
  connecting: boolean;
}

/** Mock token balances per chain */
const MOCK_BALANCES: Record<string, Record<string, number>> = {
  ethereum: { USDC: 2450.80, USDT: 1200.00, ETH: 1.284, DAI: 500.00 },
  arbitrum: { USDC: 850.00, USDT: 320.50, ETH: 0.45, ARB: 1200.00 },
  bnb:      { USDC: 1100.00, USDT: 600.00, BNB: 3.21, BUSD: 400.00 },
  polygon:  { USDC: 720.00, USDT: 180.00, MATIC: 4500.00 },
};

const MOCK_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18';

export const useMockWallet = () => {
  const [wallet, setWallet] = useState<MockWalletState>({
    connected: false,
    address: '',
    chainId: 'ethereum',
    balances: {},
    connecting: false,
  });

  const connect = useCallback(() => {
    setWallet(prev => ({ ...prev, connecting: true }));
    // Simulate wallet popup delay
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setWallet({
          connected: true,
          address: MOCK_ADDRESS,
          chainId: 'ethereum',
          balances: MOCK_BALANCES,
          connecting: false,
        });
        resolve();
      }, 1500);
    });
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      connected: false,
      address: '',
      chainId: 'ethereum',
      balances: {},
      connecting: false,
    });
  }, []);

  const getBalance = useCallback((chain: string, token: string): number => {
    return wallet.balances[chain]?.[token] ?? 0;
  }, [wallet.balances]);

  return { wallet, connect, disconnect, getBalance };
};
