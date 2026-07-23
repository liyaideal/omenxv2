import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";

const SESSION_KEY_PREFIX = "omenx-airdrop-toast-shown:";

const getSessionKey = (userId: string) => `${SESSION_KEY_PREFIX}${userId}`;

const getToastedIds = (userId: string): Set<string> => {
  try {
    const raw = sessionStorage.getItem(getSessionKey(userId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const markToasted = (userId: string, ids: string[]) => {
  try {
    const existing = getToastedIds(userId);
    ids.forEach((id) => existing.add(id));
    sessionStorage.setItem(getSessionKey(userId), JSON.stringify([...existing]));
  } catch {}
};

export const AirdropNotificationToast = () => {
  const navigate = useNavigate();
  const { pendingAirdrops } = useAirdropPositions();
  const { user } = useUserProfile();
  const { activeAccounts } = useConnectedAccounts();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const userId = user?.id ?? "guest";

  // Only toast after at least one account has finished scanning
  const hasScanComplete = activeAccounts.some((a) => a.scanStatus === "complete");

  useEffect(() => {
    if (!hasScanComplete || pendingAirdrops.length === 0) return;

    const toastedIds = getToastedIds(userId);
    const newAirdrops = pendingAirdrops.filter((a) => !toastedIds.has(a.id));

    if (newAirdrops.length === 0) return;

    // Mark as toasted immediately to prevent duplicates
    markToasted(userId, newAirdrops.map((a) => a.id));

    timerRef.current = setTimeout(() => {
      newAirdrops.forEach((airdrop) => {
        const isWelcomeGift = airdrop.source === "welcome_gift";
        toast(
          isWelcomeGift ? "Welcome gift unlocked" : "New Airdrop Received!",
          {
            description: isWelcomeGift
              ? `Free $${airdrop.airdropValue} hedge position on us — activate before it expires.`
              : `You received a FREE $${airdrop.airdropValue} hedge on "${airdrop.counterEventName}". Activate before it expires!`,
            duration: 8000,
            action: {
              label: "View",
              onClick: () => navigate("/portfolio/airdrops"),
            },
          }
        );
      });
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pendingAirdrops, hasScanComplete, navigate, userId]);

  return null;
};
