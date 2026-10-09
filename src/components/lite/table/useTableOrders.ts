// ============================================================
// TABLE order state machine (client-side only).
//   place(side)  → if the round is settling: queue for the NEXT round
//                → else: pending chip; fills after PENDING_MS unless tapped
//   cancel(i)    → take a pending chip back
//   One side per round: the opposite side is locked while you hold / have a
//   pending or queued chip on a side.
//   Each chip carries its own Boost; the service merges fills into one leg.
// The hook knows nothing about Supabase — `fill` is injected by the page.
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { PENDING_MS, type Boost, type ChipValue, type TableSide } from "./tableMath";

export interface PendingChip {
  id: number;
  side: TableSide;
  value: ChipValue;
  boost: Boost;
  at: number;
}
export interface QueuedChip {
  id: number;
  side: TableSide;
  value: ChipValue;
  boost: Boost;
}

interface Options {
  /** Round id — queued chips flush when this changes and trading reopens. */
  roundId: string | null;
  /** True while the round is settling (remaining ≤ 0). */
  settling: boolean;
  /** Side the user already holds this round (filled position), if any. */
  heldSide: TableSide | null;
  balance: number;
  /** Execute a fill. Resolve on success; reject → chip returns to the hand. */
  fill: (side: TableSide, value: ChipValue, boost: Boost, source: "table" | "next") => Promise<void>;
  notify: (msg: string) => void;
}

export const useTableOrders = ({ roundId, settling, heldSide, balance, fill, notify }: Options) => {
  const [pending, setPending] = useState<PendingChip[]>([]);
  const [queued, setQueued] = useState<QueuedChip[]>([]);
  const seq = useRef(1);
  const fillRef = useRef(fill);
  fillRef.current = fill;

  const pendingSide = pending[0]?.side ?? null;
  const queuedSide = queued[0]?.side ?? null;
  const committed = pending.reduce((a, c) => a + c.value, 0) + queued.reduce((a, c) => a + c.value, 0);

  /** Side the user is committed to right now (held / pending / queued). */
  const activeSide: TableSide | null = settling ? queuedSide : heldSide ?? pendingSide;
  /** Which side is locked for the user right now (null = both open). */
  const lockedSide: TableSide | null = activeSide ? (activeSide === "up" ? "down" : "up") : null;

  const place = useCallback(
    (side: TableSide, value: ChipValue, boost: Boost) => {
      if (lockedSide === side) {
        const other = side === "up" ? "Down" : "Up";
        notify(settling ? `Next round is already queued on ${other}` : `You hold ${other} this round — one side per round`);
        return false;
      }
      if (committed + value > balance) {
        notify("Not enough balance");
        return false;
      }
      if (settling) {
        setQueued((q) => [...q, { id: seq.current++, side, value, boost }]);
        notify(`Settling — $${value} queued for the next round`);
        return true;
      }
      setPending((p) => [...p, { id: seq.current++, side, value, boost, at: Date.now() }]);
      return true;
    },
    [lockedSide, committed, balance, settling, notify],
  );

  const cancel = useCallback(
    (id: number) => {
      setPending((p) => {
        const hit = p.find((c) => c.id === id);
        if (hit) notify(`Cancelled · $${hit.value} is back in your hand`);
        return p.filter((c) => c.id !== id);
      });
    },
    [notify],
  );

  // Pending → fill after the cancel window.
  useEffect(() => {
    if (!pending.length) return;
    const t = setInterval(() => {
      const now = Date.now();
      const due = pending.filter((c) => now - c.at >= PENDING_MS);
      if (!due.length) return;
      setPending((p) => p.filter((c) => now - c.at < PENDING_MS));
      due.forEach((c) => {
        fillRef.current(c.side, c.value, c.boost, "table").catch((e: Error) => {
          notify(e?.message || "Order failed — chip returned");
        });
      });
    }, 100);
    return () => clearInterval(t);
  }, [pending, notify]);

  // Settling started → pending chips can no longer fill; return them.
  useEffect(() => {
    if (settling && pending.length) {
      setPending([]);
      notify("Round closed — chip returned to your hand");
    }
  }, [settling, pending.length, notify]);

  // New round open → flush the queue as fills at the open.
  const lastRound = useRef<string | null>(roundId);
  useEffect(() => {
    if (roundId === lastRound.current) return;
    lastRound.current = roundId;
    if (settling || !queued.length) return;
    const q = queued;
    setQueued([]);
    q.forEach((c) => {
      fillRef.current(c.side, c.value, c.boost, "next").catch((e: Error) => {
        notify(e?.message || "Queued chip could not fill");
      });
    });
  }, [roundId, settling, queued, notify]);

  return { pending, queued, activeSide, lockedSide, place, cancel, committed };
};
