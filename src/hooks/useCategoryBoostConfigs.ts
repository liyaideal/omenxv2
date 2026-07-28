// ============================================================
// Boost limits per event category — reads `category_boost_configs`.
// Missing / unknown category → { enabled: false, maxBoost: 1 } so the
// Boost module simply does not render. Never defaults to 10x.
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BoostConfig {
  enabled: boolean;
  maxBoost: number;
}

export const BOOST_DISABLED: BoostConfig = { enabled: false, maxBoost: 1 };

/**
 * Chip ladder for a max boost: [1, 2, 5, max] deduped, ≤ max.
 * Pads with the floor midpoint between 2 and max when fewer than 4 tiers
 * (max=5 → 1/2/3/5). max < 2 → [1].
 */
export const boostTiers = (max: number): number[] => {
  if (!isFinite(max) || max < 2) return [1];
  const set = new Set<number>([1, 2, 5, max].filter((n) => n >= 1 && n <= max));
  if (set.size < 4) {
    const mid = Math.floor((2 + max) / 2);
    if (mid >= 2 && mid <= max) set.add(mid);
  }
  return Array.from(set).sort((a, b) => a - b);
};

export const useCategoryBoostConfigs = () => {
  const [map, setMap] = useState<Record<string, BoostConfig>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("category_boost_configs")
        .select("category, enabled, max_leverage");
      if (!alive) return;
      const next: Record<string, BoostConfig> = {};
      (data || []).forEach((r) => {
        next[String(r.category).toLowerCase()] = {
          enabled: !!r.enabled && Number(r.max_leverage) >= 2,
          maxBoost: Math.max(1, Number(r.max_leverage) || 1),
        };
      });
      setMap(next);
      setIsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const getConfig = useCallback(
    (category: string | null | undefined): BoostConfig =>
      (category && map[category.trim().toLowerCase()]) || BOOST_DISABLED,
    [map],
  );

  return { getConfig, isLoading };
};

export default useCategoryBoostConfigs;
