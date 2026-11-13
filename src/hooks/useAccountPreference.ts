import { useEffect, useState } from "react";
import type { AccountKind } from "@/components/wallet/AccountPicker";

const STORAGE_PREFIX = "omenx:";
const SAME_TAB_EVENT = "omenx:account-preference";

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
    // Same-tab sync: other mounted users of this key (e.g. the header's Deposit
    // dialog) must see a pick made elsewhere without a reload. `storage` only
    // fires across tabs.
    window.dispatchEvent(new CustomEvent(SAME_TAB_EVENT, { detail: { key: storageKey, value: next } }));
  };

  // Cross-tab sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      setAccountState(e.newValue === "spot" || e.newValue === "futures" ? e.newValue : null);
    };
    const onSameTab = (e: Event) => {
      const d = (e as CustomEvent<{ key: string; value: AccountKind | null }>).detail;
      if (d?.key === storageKey) setAccountState(d.value);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(SAME_TAB_EVENT, onSameTab);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SAME_TAB_EVENT, onSameTab);
    };
  }, [storageKey]);

  return { account, setAccount };
};

export const ACCOUNT_LABEL: Record<AccountKind, string> = {
  spot: "Standard Account",
  futures: "Boost Account",
};
