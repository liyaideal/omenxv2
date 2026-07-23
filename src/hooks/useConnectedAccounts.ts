import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "./useUserProfile";

// Toggle this to false when backend is ready
const DEMO_MODE = true;

export interface ConnectedAccount {
  id: string;
  platform: string;
  walletAddress: string;
  displayAddress: string;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
  positionsDetected: number;
  airdropsReceived: number;
  scanStatus: "scanning" | "complete";
}

const QUERY_KEY = ["connected-accounts"];

const formatAddress = (addr: string) =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`;

// User-scoped localStorage key
const getDemoStorageKey = (userId: string) => `demo_connected_accounts:${userId}`;

const readDemoAccounts = (userId: string): ConnectedAccount[] => {
  try {
    const saved = localStorage.getItem(getDemoStorageKey(userId));
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const writeDemoAccounts = (userId: string, accounts: ConnectedAccount[]) => {
  localStorage.setItem(getDemoStorageKey(userId), JSON.stringify(accounts));
};

export const useConnectedAccounts = () => {
  const queryClient = useQueryClient();
  const { user } = useUserProfile();
  const userId = user?.id ?? "guest";

  // User-scoped demo query key
  const DEMO_QUERY_KEY = ["demo-connected-accounts", userId];

  // ── Demo state (shared via react-query cache, persisted to localStorage) ──
  const { data: demoAccounts = [] } = useQuery<ConnectedAccount[]>({
    queryKey: DEMO_QUERY_KEY,
    queryFn: () => readDemoAccounts(userId),
    staleTime: Infinity,
    enabled: DEMO_MODE,
  });

  const [isDemoVerifying, setIsDemoVerifying] = useState(false);
  const [isDemoDisconnecting, setIsDemoDisconnecting] = useState(false);

  // Update demo accounts in both cache and localStorage
  const updateDemoAccounts = useCallback((updater: (prev: ConnectedAccount[]) => ConnectedAccount[]) => {
    const prev = queryClient.getQueryData<ConnectedAccount[]>(DEMO_QUERY_KEY) ?? [];
    const next = updater(prev);
    writeDemoAccounts(userId, next);
    queryClient.setQueryData(DEMO_QUERY_KEY, next);
  }, [queryClient, userId, DEMO_QUERY_KEY]);

  const demoVerifyAndConnect = useCallback(
    async (payload: {
      walletAddress: string;
      signature: string;
      message: { platform: string; account: string; timestamp: string; nonce: string };
      platform: string;
    }) => {
      setIsDemoVerifying(true);
      // Simulate backend delay
      await new Promise((r) => setTimeout(r, 1500));
      const newAccount: ConnectedAccount = {
        id: crypto.randomUUID(),
        platform: payload.platform,
        walletAddress: payload.walletAddress,
        displayAddress: formatAddress(payload.walletAddress),
        status: "active",
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        positionsDetected: 0,
        airdropsReceived: 0,
        scanStatus: "scanning",
      };
      updateDemoAccounts((prev) => [newAccount, ...prev]);
      setIsDemoVerifying(false);

      // Simulate scanning completing after 3 seconds
      setTimeout(() => {
        updateDemoAccounts((prev) =>
          prev.map((a) =>
            a.id === newAccount.id
              ? { ...a, scanStatus: "complete" as const, positionsDetected: 3, airdropsReceived: 2 }
              : a
          )
        );
      }, 3000);

      return newAccount;
    },
    [updateDemoAccounts]
  );

  const demoDisconnect = useCallback(async (accountId: string) => {
    setIsDemoDisconnecting(true);
    await new Promise((r) => setTimeout(r, 500));
    updateDemoAccounts((prev) => prev.filter((a) => a.id !== accountId));
    setIsDemoDisconnecting(false);
  }, [updateDemoAccounts]);

  // ── Real Supabase queries (used when DEMO_MODE = false) ──
  const { data: realAccounts = [], isLoading: realLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching connected accounts:", error);
        return [];
      }

      return (data as any[]).map((row): ConnectedAccount => ({
        id: row.id,
        platform: row.platform,
        walletAddress: row.wallet_address,
        displayAddress: row.display_address,
        status: row.status,
        verifiedAt: row.verified_at,
        createdAt: row.created_at,
        positionsDetected: 0,
        airdropsReceived: 0,
        scanStatus: "complete",
      }));
    },
    enabled: !!user && !DEMO_MODE,
  });

  const verifyAndConnectMutation = useMutation({
    mutationFn: async (payload: {
      walletAddress: string;
      signature: string;
      message: { platform: string; account: string; timestamp: string; nonce: string };
      platform: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "verify-wallet-signature",
        { body: payload }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("connected_accounts")
        .update({ status: "disconnected", disconnected_at: new Date().toISOString() } as any)
        .eq("id", accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const accounts = DEMO_MODE ? demoAccounts : realAccounts;

  return {
    accounts,
    isLoading: DEMO_MODE ? false : realLoading,
    activeAccounts: accounts.filter((a) => a.status === "active"),
    verifyAndConnect: DEMO_MODE
      ? demoVerifyAndConnect
      : verifyAndConnectMutation.mutateAsync,
    isVerifying: DEMO_MODE ? isDemoVerifying : verifyAndConnectMutation.isPending,
    disconnect: DEMO_MODE ? demoDisconnect : disconnectMutation.mutateAsync,
    isDisconnecting: DEMO_MODE
      ? isDemoDisconnecting
      : disconnectMutation.isPending,
    isDemoMode: DEMO_MODE,
  };
};
