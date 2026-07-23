import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePoints } from "./usePoints";
import { useUserProfile } from "./useUserProfile";

interface TreasureDrop {
  id: string;
  user_id: string;
  tier: string;
  target_points: number;
  points_dropped: number;
  dropped_at: string;
}

interface ClaimResult {
  success: boolean;
  pointsDropped: number;
  targetPoints: number;
  tier: string;
  newBalance: number;
}

export const useTreasureDrop = () => {
  const queryClient = useQueryClient();
  const { user } = useUserProfile();
  const { lifetimeEarned, isLoading: isLoadingPoints } = usePoints();
  const [shouldShowTreasure, setShouldShowTreasure] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Check if user has already claimed treasure
  const { data: existingDrop, isLoading: isLoadingDrop } = useQuery({
    queryKey: ['treasure-drop', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Use raw fetch since types might not be updated yet for new table
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/treasure_drops?user_id=eq.${user.id}&select=*`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );
      
      const result = await response.json();
      console.log('Treasure drop check result:', result);

      if (!response.ok) {
        console.error('Treasure drop query error:', result);
        return null;
      }
      
      return (result && result.length > 0) ? result[0] as TreasureDrop : null;
    },
    enabled: !!user,
  });

  // Determine eligibility
  const isEligible = lifetimeEarned >= 100 && !existingDrop && !!user;
  const hasClaimed = !!existingDrop;

  console.log('Treasure eligibility check:', {
    lifetimeEarned,
    existingDrop,
    user: !!user,
    isEligible,
    hasTriggered,
    isLoadingPoints,
    isLoadingDrop
  });

  // Trigger treasure appearance with random delay (1-5 seconds)
  useEffect(() => {
    if (isEligible && !hasTriggered && !isLoadingPoints && !isLoadingDrop) {
      const delay = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000; // 1-5 seconds
      console.log(`Treasure will appear in ${delay}ms`);
      
      const timer = setTimeout(() => {
        console.log('Treasure appearing now!');
        setShouldShowTreasure(true);
        setHasTriggered(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isEligible, hasTriggered, isLoadingPoints, isLoadingDrop]);

  // Claim treasure mutation
  const claimMutation = useMutation({
    mutationFn: async (): Promise<ClaimResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-treasure`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim treasure');
      }

      return result;
    },
    onSuccess: () => {
      setShouldShowTreasure(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['treasure-drop'] });
      queryClient.invalidateQueries({ queryKey: ['points-account'] });
      queryClient.invalidateQueries({ queryKey: ['points-history'] });
    },
  });

  const hideTreasure = useCallback(() => {
    setShouldShowTreasure(false);
  }, []);

  return {
    shouldShowTreasure,
    isEligible,
    hasClaimed,
    existingDrop,
    claimTreasure: claimMutation.mutateAsync,
    isClaiming: claimMutation.isPending,
    claimError: claimMutation.error,
    hideTreasure,
    isLoading: isLoadingPoints || isLoadingDrop,
  };
};
