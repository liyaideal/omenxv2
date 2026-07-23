import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import sillyname from "sillyname";

// Available avatar seeds for DiceBear adventurer-neutral style
export const AVATAR_SEEDS = [
  "felix", "aneka", "sophia", "liam", "mia", "oliver", "emma", "noah",
  "ava", "elijah", "isabella", "james", "luna", "benjamin", "chloe",
  "lucas", "penelope", "henry", "layla", "alexander", "riley", "jackson",
  "zoey", "sebastian", "nora", "aiden", "lily", "owen", "ella", "william",
  "grace", "ethan", "aurora", "jacob", "scarlett", "michael", "camila",
  "harper", "mason", "evelyn", "logan", "abigail", "lucas", "emily", "jack",
  "madison", "levi", "elizabeth", "mateo", "sofia", "daniel", "avery", "leo",
  "mila", "asher", "aria", "carter", "charlotte", "wyatt", "amelia", "julian",
  "harper", "grayson", "ella", "ezra", "chloe", "luke", "layla", "henry",
  "madison", "jayden", "victoria", "gabriel", "scarlett", "isaac", "hannah"
];

// Background colors for avatars
export const AVATAR_BACKGROUNDS = [
  "b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"
];

export const generateAvatarUrl = (seed: string, bgIndex: number = 0) => {
  const bg = AVATAR_BACKGROUNDS[bgIndex % AVATAR_BACKGROUNDS.length];
  return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seed}&backgroundColor=${bg}`;
};

export const getRandomAvatarUrl = () => {
  const randomSeed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
  const randomBg = Math.floor(Math.random() * AVATAR_BACKGROUNDS.length);
  return generateAvatarUrl(randomSeed, randomBg);
};

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  balance: number | null;
  trial_balance: number | null;
  spot_balance: number | null;
  created_at: string;
  updated_at: string;
  withdraw_2fa_mode?: string | null;
  totp_enabled?: boolean | null;
  // NOTE: totp_secret intentionally NOT exposed on the client.
  // It lives in the server-only `user_security` table and is managed via the
  // `totp-manage` edge function.
}

const PROFILE_QUERY_KEY = ["user-profile"];

// Global cache for auth user to persist across component unmounts
let cachedAuthUser: User | null = null;
let authInitialized = false;

// Fetch profile from Supabase
const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }

  return data;
};

// Update profile in Supabase
const updateProfileInDb = async ({ 
  userId, 
  updates 
}: { 
  userId: string; 
  updates: Partial<Profile> 
}): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  return data;
};

/**
 * useUserProfile - A unified hook for user profile data using React Query
 * This ensures profile data is synced across all components
 */
export const useUserProfile = () => {
  const queryClient = useQueryClient();
  // Initialize from cache to avoid flash of empty state
  const [user, setUser] = useState<User | null>(cachedAuthUser);
  const [isAuthLoading, setIsAuthLoading] = useState(!authInitialized);
  
  // Track if we've already generated a username to prevent duplicates
  const hasGeneratedUsername = useRef(false);

  // Query for profile data - declare before effects
  const {
    data: profile,
    isLoading: isProfileLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => user ? fetchProfile(user.id) : null,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for updating profile - declare before effects
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Profile>) => 
      updateProfileInDb({ userId: user!.id, updates }),
    onSuccess: (newProfile) => {
      // Update cache immediately
      queryClient.setQueryData(PROFILE_QUERY_KEY, newProfile);
    },
  });

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      // Update global cache
      cachedAuthUser = currentUser;
      authInitialized = true;
      
      setUser(currentUser);
      setIsAuthLoading(false);
      
      // Invalidate queries when auth changes
      if (currentUser) {
        // Invalidate profile and all user-related queries
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
        // Invalidate settlements and positions queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["settlements"] });
        queryClient.invalidateQueries({ queryKey: ["positions"] });
      } else {
        queryClient.setQueryData(PROFILE_QUERY_KEY, null);
        // Clear user data on logout
        queryClient.removeQueries({ queryKey: ["settlements"] });
        queryClient.removeQueries({ queryKey: ["positions"] });
      }
    });

    // Check for existing session only if not already initialized
    if (!authInitialized) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        // Update global cache
        cachedAuthUser = currentUser;
        authInitialized = true;
        
        setUser(currentUser);
        setIsAuthLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Auto-generate username for old users who don't have one
  useEffect(() => {
    const generateUsernameForOldUser = async () => {
      if (
        user && 
        profile && 
        !profile.username && 
        !hasGeneratedUsername.current &&
        !isProfileLoading
      ) {
        hasGeneratedUsername.current = true;
        
        // Generate a sillyname username
        const rawUsername = sillyname();
        const mockUsername = rawUsername.replace(/ /g, '_');
        
        try {
          const { error } = await supabase
            .from("profiles")
            .update({ username: mockUsername })
            .eq("user_id", user.id);

          if (!error) {
            // Refetch profile to get the updated username
            queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
          }
        } catch (err) {
          console.error("Failed to auto-generate username:", err);
        }
      }
    };

    generateUsernameForOldUser();
  }, [user, profile, isProfileLoading, queryClient]);

  // Helper functions for specific updates
  const updateUsername = async (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return { 
        success: false, 
        error: "Username must be 3-20 characters, alphanumeric and underscores only" 
      };
    }
    try {
      await updateMutation.mutateAsync({ username });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateAvatar = async (avatarUrl: string) => {
    try {
      await updateMutation.mutateAsync({ avatar_url: avatarUrl });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateEmail = async (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email address" };
    }
    try {
      await updateMutation.mutateAsync({ email });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateBalance = async (newBalance: number) => {
    try {
      await updateMutation.mutateAsync({ balance: newBalance });
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Deduct from Futures Available (`balance`). Trial Bonus is fully sunset
   * (2026-07-21) — this now behaves identically to `deductAvailableOnly`.
   * The `deductBalance` name is retained purely to avoid churning every
   * futures trading call site; new callers should prefer `deductAvailableOnly`.
   */
  const deductBalance = async (amount: number): Promise<boolean> => {
    const currentBalance = profile?.balance ?? 0;
    if (currentBalance < amount) return false;
    try {
      await updateMutation.mutateAsync({ balance: currentBalance - amount });
      return true;
    } catch (error) {
      console.error("Failed to deduct balance:", error);
      return false;
    }
  };

  const addBalance = async (amount: number) => {
    const currentBalance = profile?.balance ?? 0;
    const newBalance = currentBalance + amount;
    return updateBalance(newBalance);
  };

  /**
   * Deduct from Futures Available only. Post Trial-Bonus sunset (2026-07-21)
   * this is equivalent to `deductBalance`; kept as an explicit alias for
   * withdraw / no-trial-touch flows so intent stays readable at the call site.
   */
  const deductAvailableOnly = async (amount: number): Promise<boolean> => {
    const currentBalance = profile?.balance ?? 0;
    if (currentBalance < amount) return false;
    return updateBalance(currentBalance - amount);
  };

  // ---- Spot account balance (independent of contract/futures balance) ----
  const updateSpotBalance = async (newSpotBalance: number) => {
    try {
      await updateMutation.mutateAsync({ spot_balance: newSpotBalance } as Partial<Profile>);
      return true;
    } catch {
      return false;
    }
  };

  const deductSpotBalance = async (amount: number): Promise<boolean> => {
    const current = profile?.spot_balance ?? 0;
    if (current < amount) return false;
    return updateSpotBalance(current - amount);
  };

  const addSpotBalance = async (amount: number) => {
    const current = profile?.spot_balance ?? 0;
    return updateSpotBalance(current + amount);
  };

  const transferBetweenAccounts = async (
    direction: "to_spot" | "to_futures",
    amount: number,
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke("sim-transfer", {
        body: { direction, amount },
      });
      if (error) {
        // FunctionsHttpError swallows body → dig it out for the toast
        let detail: string | undefined;
        try {
          const ctx = (error as any)?.context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            detail = body?.error || body?.message;
          } else if (ctx && typeof ctx.text === "function") {
            const txt = await ctx.text();
            try {
              detail = JSON.parse(txt)?.error;
            } catch {
              detail = txt;
            }
          }
        } catch {
          /* ignore */
        }
        throw new Error(detail || error.message || "Transfer failed");
      }
      if ((data as any)?.error) {
        throw new Error((data as any).error);
      }
      await refetch();
      return { success: true as const };
    } catch (error: any) {
      return { success: false as const, error: error.message };
    }
  };

  // ---- Security / withdraw verification ----
  const updateWithdraw2faMode = async (mode: "email" | "totp" | "both") => {
    try {
      await updateMutation.mutateAsync({ withdraw_2fa_mode: mode } as Partial<Profile>);
      return { success: true as const };
    } catch (error: any) {
      return { success: false as const, error: error.message };
    }
  };

  const enableTotp = async (secret: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("totp-manage", {
        body: { action: "enable", secret },
      });
      if (error || (data as any)?.error) {
        throw new Error(error?.message || (data as any)?.error || "Failed to enable TOTP");
      }
      await refetch();
      return { success: true as const };
    } catch (error: any) {
      return { success: false as const, error: error.message };
    }
  };

  const disableTotp = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("totp-manage", {
        body: { action: "disable" },
      });
      if (error || (data as any)?.error) {
        throw new Error(error?.message || (data as any)?.error || "Failed to disable TOTP");
      }
      await refetch();
      return { success: true as const };
    } catch (error: any) {
      return { success: false as const, error: error.message };
    }
  };

  return {
    // Profile data
    profile,
    user,

    // Loading states
    isLoading: isAuthLoading || isProfileLoading,
    isUpdating: updateMutation.isPending,
    error,

    // Computed values for convenience
    balance: profile?.balance ?? 0,
    spotBalance: profile?.spot_balance ?? 0,
    username: profile?.username ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    email: profile?.email ?? null,

    // Update functions
    updateUsername,
    updateAvatar,
    updateEmail,
    updateBalance,
    deductBalance,
    deductAvailableOnly,
    addBalance,
    updateSpotBalance,
    deductSpotBalance,
    addSpotBalance,
    transferBetweenAccounts,
    updateWithdraw2faMode,
    enableTotp,
    disableTotp,
    
    // Refetch
    refetchProfile: refetch,
  };
};

// Export query key for external invalidation if needed
export { PROFILE_QUERY_KEY };
