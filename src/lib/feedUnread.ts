import { useEffect, useState, useCallback } from "react";

/**
 * Lightweight unread tracking for tier-1 feed cards.
 *
 * Each card passes a stable key. If `localStorage[seen:${key}]` is missing,
 * the card is considered unread (red dot shown). Calling `markRead()`
 * persists the seen flag.
 *
 * Cards can encode "freshness buckets" into the key (e.g. include rounded
 * PnL %, or today's date) so that material state changes naturally re-arm
 * the unread state.
 */
export const useUnreadFlag = (key: string | null | undefined) => {
  const storageKey = key ? `seen:${key}` : null;
  const [unread, setUnread] = useState<boolean>(() => {
    if (!storageKey || typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(storageKey) === null;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") {
      setUnread(false);
      return;
    }
    try {
      setUnread(window.localStorage.getItem(storageKey) === null);
    } catch {
      setUnread(false);
    }
  }, [storageKey]);

  const markRead = useCallback(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, String(Date.now()));
    } catch {
      /* ignore */
    }
    setUnread(false);
  }, [storageKey]);

  return { unread, markRead };
};
