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
 * Chip ladder for a max boost. Always ≤ 4 numeric chips (Custom lives beside
 * them). Candidate pool C = [2,3,5,10,20,50] filtered to ≤ max:
 *   |C| ≤ 3 → [1, ...C]
 *   |C| > 3 → [1, 2, m, L] where L = max(C) and m = element of C closest to
 *             sqrt(2·max) (ties resolve to the smaller element).
 *
 * Acceptance fixtures:
 *   max=2  → [1,2]
 *   max=3  → [1,2,3]
 *   max=5  → [1,2,3,5]
 *   max=10 → [1,2,5,10]
 *   max=20 → [1,2,5,20]
 *   max=50 → [1,2,10,50]
 *   max<2  → [1]
 */
const BOOST_CANDIDATES = [2, 3, 5, 10, 20, 50];

export const boostTiers = (max: number): number[] => {
  if (!isFinite(max) || max < 2) return [1];
  const c = BOOST_CANDIDATES.filter((n) => n <= max);
  if (c.length === 0) return [1];
  if (c.length <= 3) return [1, ...c];
  const target = Math.sqrt(2 * max);
  const L = c[c.length - 1];
  let m = c[0];
  let best = Infinity;
  for (const n of c) {
    const d = Math.abs(n - target);
    if (d < best) {
      best = d;
      m = n;
    }
  }
  return Array.from(new Set([1, 2, m, L])).sort((a, b) => a - b);
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

  const maxBoost = useMemo(() => {
    const vals = Object.values(map).filter((c) => c.enabled).map((c) => c.maxBoost);
    return vals.length ? Math.max(...vals) : 1;
  }, [map]);

  return { getConfig, isLoading, maxBoost };
};

export default useCategoryBoostConfigs;
