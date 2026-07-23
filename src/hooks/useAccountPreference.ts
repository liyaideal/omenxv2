import { useEffect, useState } from "react";
import type { AccountKind } from "@/components/wallet/AccountPicker";

const STORAGE_PREFIX = "omenx:";

/**
 * Persist the user's last-chosen deposit / withdraw target account across sessions.
 * No default — returns null until the user makes a choice.
 */
export const useAccountPreference = (kind: "deposit" | "withdraw") => {
  const storageKey = `${STORAGE_PREFIX}${kind}-account`;
  const [account, setAccountState] = useState<AccountKind | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(storageKey);
    return stored === "spot" || stored === "futures" ? stored : null;
  });

  const setAccount = (next: AccountKind | null) => {
    setAccountState(next);
    if (typeof window === "undefined") return;
    if (next) window.localStorage.setItem(storageKey, next);
    else window.localStorage.removeItem(storageKey);
  };

  // Cross-tab sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      setAccountState(e.newValue === "spot" || e.newValue === "futures" ? e.newValue : null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  return { account, setAccount };
};

export const ACCOUNT_LABEL: Record<AccountKind, string> = {
  spot: "Spot Account",
  futures: "Futures Account",
};
