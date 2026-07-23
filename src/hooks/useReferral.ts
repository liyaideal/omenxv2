import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  is_active: boolean;
  uses_count: number;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  level: number;
  status: 'pending' | 'qualified' | 'rewarded';
  qualified_at: string | null;
  rewarded_at: string | null;
  points_awarded: number | null;
  created_at: string;
}

// Generate a random referral code (6 characters)
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useReferral = () => {
  const queryClient = useQueryClient();

  // Fetch user's referral code
  const { data: referralCode, isLoading: isLoadingCode } = useQuery({
    queryKey: ['referral-code'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Try to get existing code
      let { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      // If no code exists, create one
      if (!data) {
        const newCode = generateReferralCode();
        const { data: newData, error: createError } = await supabase
          .from('referral_codes')
          .insert({
            user_id: user.id,
            code: newCode,
            is_active: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        data = newData;
      }

      return data as ReferralCode;
    },
  });

  // Fetch user's referrals (people they've invited)
  const { data: referrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Referral[];
    },
  });

  // Get referral link - uses published domain for consistency
  const getReferralLink = () => {
    if (!referralCode) return '';
    // Use the published domain for all referral links
    return `https://omenx.lovable.app?ref=${referralCode.code}`;
  };

  // Copy referral link
  const copyReferralLink = async () => {
    const link = getReferralLink();
    if (!link) {
      toast.error('Referral code not available');
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      toast.success('Referral link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // Share on X (Twitter) with engaging copy
  const shareOnX = () => {
    const link = getReferralLink();
    const tweetText = `🎯 What if you could trade predictions with leverage? Now you can. OmenX Beta is LIVE - claim test funds & earn points. Join now 👇
${link}`;
    const encodedText = encodeURIComponent(tweetText);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
  };

  // Apply referral code (for new users)
  const applyReferralMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find the referral code using secure RPC function
      const { data: codeResults, error: codeError } = await supabase
        .rpc('lookup_referral_code', { _code: code.toUpperCase() });

      const codeData = codeResults?.[0];
      if (codeError || !codeData) {
        throw new Error('Invalid referral code');
      }

      // Map the RPC result to expected shape
      const referrerUserId = codeData.referrer_id;

      if (referrerUserId === user.id) {
        throw new Error('Cannot use your own referral code');
      }

      // Check if user already has a referrer
      const { data: existing } = await supabase
        .from('referrals')
        .select('id')
        .eq('referee_id', user.id)
        .maybeSingle();

      if (existing) {
        throw new Error('You have already used a referral code');
      }

      // Create referral relationship
      const { error: refError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerUserId,
          referee_id: user.id,
          referral_code: code.toUpperCase(),
          level: 1,
          status: 'pending',
        });

      if (refError) throw refError;

      // Increment uses count via secure RPC
      await supabase.rpc('increment_referral_uses', { _code: code.toUpperCase() });

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Referral code applied!');
      queryClient.invalidateQueries({ queryKey: ['my-referrals'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Stats
  const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;
  const qualifiedReferrals = referrals?.filter(r => r.status === 'qualified' || r.status === 'rewarded').length || 0;
  const totalPointsEarned = referrals?.reduce((sum, r) => sum + (r.points_awarded || 0), 0) || 0;

  return {
    referralCode: referralCode?.code || '',
    referralLink: getReferralLink(),
    referrals,
    isLoading: isLoadingCode || isLoadingReferrals,
    copyReferralLink,
    shareOnX,
    applyReferralCode: applyReferralMutation.mutate,
    isApplying: applyReferralMutation.isPending,
    stats: {
      pending: pendingReferrals,
      qualified: qualifiedReferrals,
      totalReferrals: referrals?.length || 0,
      totalPointsEarned,
    },
  };
};
