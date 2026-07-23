import { useCallback, useEffect, useState } from "react";
import { useUserProfile } from "./useUserProfile";

const STORAGE_PREFIX = "omenx_rewards_welcome_seen_";
const EVENT_NAME = "omenx:rewards-welcome-seen";

const getKey = (userId: string) => `${STORAGE_PREFIX}${userId}`;

/**
 * Tracks whether the current user has already seen the Rewards Welcome modal.
 * Persisted per-user in localStorage so the modal only shows once per account,
 * across sessions and reloads. Once seen (closed, dismissed, or CTA tapped),
 * the FloatingRewardsButton becomes the permanent entry point.
 */
export const useRewardsWelcomeSeen = () => {
  const { user } = useUserProfile();
  const userId = user?.id;

  const [hasSeen, setHasSeen] = useState<boolean>(() => {
    if (!userId || typeof window === "undefined") return false;
    try {
      return localStorage.getItem(getKey(userId)) === "1";
    } catch {
      return false;
    }
  });

  // Re-read when the user changes (login/logout switches accounts)
  useEffect(() => {
    if (!userId) {
      setHasSeen(false);
      return;
    }
    try {
      setHasSeen(localStorage.getItem(getKey(userId)) === "1");
    } catch {
      setHasSeen(false);
    }
  }, [userId]);

  // Cross-component & cross-tab sync
  useEffect(() => {
    if (!userId) return;
    const key = getKey(userId);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) {
        setHasSeen(e.newValue === "1");
      }
    };
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ userId: string }>).detail;
      if (detail?.userId === userId) {
        setHasSeen(true);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(EVENT_NAME, handleCustom as EventListener);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(EVENT_NAME, handleCustom as EventListener);
    };
  }, [userId]);

  const markSeen = useCallback(() => {
    if (!userId) return;
    try {
      localStorage.setItem(getKey(userId), "1");
    } catch {
      // ignore quota / privacy mode errors
    }
    setHasSeen(true);
    // Notify other components in the same tab
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { userId } })
    );
  }, [userId]);

  return { hasSeen, markSeen };
};
