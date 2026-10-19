// ============================================================
// Live crypto prints for the home tape — read from the Quick Play stream
// (public.arcade_rounds + the deterministic path), the same number the
// quick rounds, the entry banner and the cabinet show. One poll per symbol
// every 15 s, a 1 Hz tick in between. Falls back to undefined (the caller
// keeps its round-open-based figure) while the stream has no open round.
// ============================================================
import { useEffect, useState } from "react";
import { ARCADE_STEP_MS, arcadeNextOf, arcadePath, arcadePriceAt, type ArcadeRoundRow } from "@/lib/arcade/arcadePath";
import { fetchArcadeTable, tfSeconds } from "@/lib/arcade/arcadeTables";

const SYMBOLS = ["BTC", "ETH", "SOL"];

export const useArcadeLivePrices = (symbols: string[] = SYMBOLS): Record<string, number | undefined> => {
  const [prices, setPrices] = useState<Record<string, number | undefined>>({});
  useEffect(() => {
    let alive = true;
    const rounds: Record<string, { r: ArcadeRoundRow; path: number[]; next: ArcadeRoundRow | null } | undefined> = {};
    const adopt = (sym: string, r: ArcadeRoundRow, next: ArcadeRoundRow | null) => {
      rounds[sym] = { r, path: arcadePath(r.seed, r.open_price, r.steps, r.sigma), next };
    };
    const load = async () => {
      await Promise.all(
        symbols.map(async (sym) => {
          try {
            const s = await fetchArcadeTable(sym, "30s", 1);
            if (!alive) return;
            if (s.current && (!rounds[sym] || rounds[sym]!.r.id !== s.current.id)) adopt(sym, s.current, s.next);
            else if (rounds[sym]) rounds[sym]!.next = s.next;
          } catch (e) {
            /* keep the last stream */
          }
        }),
      );
    };
    void load();
    const poll = setInterval(load, 15000);
    const tick = setInterval(() => {
      const now = Date.now();
      const out: Record<string, number | undefined> = {};
      for (const sym of symbols) {
        const cur = rounds[sym];
        if (!cur) continue;
        const start = new Date(cur.r.start_at).getTime();
        const dur = tfSeconds(cur.r.tf);
        if (now >= start + dur * 1000) {
          const n = cur.next && cur.next.start_at === cur.r.end_at ? cur.next : arcadeNextOf(cur.r);
          adopt(sym, n, null);
        }
        const c = rounds[sym]!;
        out[sym] = arcadePriceAt(c.path, new Date(c.r.start_at).getTime(), now);
      }
      setPrices(out);
    }, 1000);
    void ARCADE_STEP_MS;
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(",")]);
  return prices;
};
