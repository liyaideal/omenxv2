// ============================================================
// Editor's picks — data layer.
//
// Ops curate picks directly on the event row, no schema migration:
//   events.metadata.editorial = {
//     pick: true,
//     rank: 1..n,            -- render order, ascending
//     note: "reason text",   -- MANDATORY; an empty note skips the pick
//     updated_at: ISO        -- drives the module's "Updated {rel}" meta
//   }
//
// Example (ops):
//   UPDATE public.events
//   SET metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
//     'editorial', jsonb_build_object(
//       'pick', true, 'rank', 1,
//       'note', 'Why this market matters, in ops voice.',
//       'updated_at', to_char(now(),'YYYY-MM-DD"T"HH24:MI:SS"Z"')))
//   WHERE id = 'us-president-2028';
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Max picks rendered, desktop and mobile alike. */
export const MAX_PICKS = 3;

export interface EditorPick {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  rank: number;
  note: string;
  updatedAt: Date | null;
  volume: number;
  isSpot: boolean;
  yesLabel: string;
  noLabel: string;
  yesPrice: number;
  noPrice: number;
  yesOptionId: string | null;
  noOptionId: string | null;
}

interface RawEditorial {
  pick?: boolean;
  rank?: number;
  note?: string;
  updated_at?: string;
}

interface RawRow {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  volume: string | number | null;
  product_lines: string[] | null;
  side_labels: unknown;
  metadata: unknown;
  event_options?: { id: string; label: string; price: number | string }[];
}

const parseSides = (raw: unknown): { yes: string; no: string } | null => {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { yes?: unknown; no?: unknown };
  if (typeof o.yes !== "string" || typeof o.no !== "string") return null;
  return { yes: o.yes, no: o.no };
};

/** "just now" / "12m ago" / "3h ago" / "2d ago". */
export const relativeSince = (d: Date | null): string => {
  if (!d) return "just now";
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60_000));
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const pickHref = (p: EditorPick, optionId?: string | null): string => {
  const base = p.isSpot ? "/spot" : "/trade";
  const q = `event=${encodeURIComponent(p.id)}`;
  return optionId
    ? `${base}?${q}&option=${encodeURIComponent(optionId)}`
    : `${base}?${q}`;
};

export const formatPickVolume = (n: number): string => {
  if (n >= 1_000_000) return `Vol $${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Vol $${(n / 1_000).toFixed(1)}K`;
  return `Vol $${Math.round(n)}`;
};

/** Map a raw event row to a pick. Returns null when the pick is invalid. */
export const toEditorPick = (row: RawRow): EditorPick | null => {
  const editorial = ((row.metadata as { editorial?: RawEditorial } | null)
    ?.editorial || {}) as RawEditorial;
  if (editorial.pick !== true) return null;

  const note = (editorial.note || "").trim();
  if (!note) {
    // The reason is mandatory by design — a pick without one is skipped.
    console.warn(
      `[editor's picks] "${row.id}" is flagged pick=true but has no reason — skipped.`,
    );
    return null;
  }

  const opts = (row.event_options || []).map((o) => ({
    id: o.id,
    label: o.label,
    price: Number(o.price),
  }));
  const sides = parseSides(row.side_labels);
  const alias = (sides?.yes || "").trim().toLowerCase();
  const norm = (s: string) => s.trim().toLowerCase();
  const yes =
    (alias && opts.find((o) => norm(o.label) === alias)) ||
    opts.find((o) => ["yes", "up"].includes(norm(o.label))) ||
    opts[0] ||
    null;
  const no = opts.find((o) => o.id !== yes?.id) || null;
  const yesPrice = yes ? yes.price : 0.5;

  return {
    id: row.id,
    name: row.name,
    category: (row.category || "").toLowerCase(),
    imageUrl: row.image_url,
    rank: Number(editorial.rank ?? 99),
    note,
    updatedAt: editorial.updated_at ? new Date(editorial.updated_at) : null,
    volume: Number(row.volume ?? 0),
    isSpot: (row.product_lines || []).includes("spot"),
    yesLabel: sides?.yes || yes?.label || "Yes",
    noLabel: sides?.no || no?.label || "No",
    yesPrice,
    noPrice: no ? no.price : Math.max(0, Math.min(1, 1 - yesPrice)),
    yesOptionId: yes?.id ?? null,
    noOptionId: no?.id ?? null,
  };
};

/** Ops-curated picks, ranked, capped at MAX_PICKS. */
export const useEditorPicks = () => {
  const [rows, setRows] = useState<EditorPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select(
          "id, name, category, image_url, volume, product_lines, side_labels, metadata, event_options(id, label, price)",
        )
        .eq("is_resolved", false)
        .filter("metadata->editorial->>pick", "eq", "true");
      if (!alive) return;
      const list = ((data || []) as unknown as RawRow[])
        .map(toEditorPick)
        .filter((p): p is EditorPick => p !== null)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, MAX_PICKS);
      setRows(list);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const updatedAt = useMemo(() => {
    const stamps = rows
      .map((r) => r.updatedAt?.getTime())
      .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
    return stamps.length ? new Date(Math.max(...stamps)) : null;
  }, [rows]);

  return { picks: rows, updatedAt, loading };
};