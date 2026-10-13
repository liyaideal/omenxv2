/**
 * Announcements (公告) — types, kind meta, date helpers.
 *
 * CPO 2026-10-13 (消息中心 v2 mock A1–A9): ops-written notices, two kinds
 * (announcement / maintenance), public pages `/announcements` + `/:id`, one
 * optional CTA, Markdown subset body (with images and tables — A6 revised),
 * withdrawn → "no longer available" state. The notification row for a
 * published notice carries the same `title` / `summary` (lib/notifications.ts
 * `system.announcement` / `system.maintenance`).
 */
import { Megaphone, Wrench, type LucideIcon } from "lucide-react";

export type AnnouncementKind = "announcement" | "maintenance";

export interface Announcement {
  id: string;
  kind: AnnouncementKind;
  title: string;
  summary: string;
  body_md: string;
  cta_label: string | null;
  cta_href: string | null;
  window_starts_at: string | null;
  window_ends_at: string | null;
  affects: string | null;
  not_affected: string | null;
  published_at: string;
}

export type AnnouncementListRow = Pick<Announcement, "id" | "kind" | "title" | "summary" | "published_at">;

export const ANNOUNCEMENT_COLUMNS =
  "id, kind, title, summary, body_md, cta_label, cta_href, window_starts_at, window_ends_at, affects, not_affected, published_at";
export const ANNOUNCEMENT_LIST_COLUMNS = "id, kind, title, summary, published_at";

/** Icon is the only tinted element (DESIGN §7 scope): info = primary, "mind the clock" = yellow. */
export const ANNOUNCEMENT_KIND: Record<AnnouncementKind, { icon: LucideIcon; tone: string; chip: string; labelKey: string }> = {
  announcement: {
    icon: Megaphone,
    tone: "text-primary",
    chip: "border-primary/35 bg-primary/[0.08] text-primary",
    labelKey: "announcements.kind.announcement",
  },
  maintenance: {
    icon: Wrench,
    tone: "text-trading-yellow",
    chip: "border-trading-yellow/35 bg-trading-yellow/[0.08] text-trading-yellow",
    labelKey: "announcements.kind.maintenance",
  },
};

export const PAGE_SIZE = 20;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const clockUtc = (d: Date) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
const dayLocal = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
const dayUtc = (d: Date) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
const valid = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

/** Published stamp: "Oct 13, 2026 · 15:02" — year always (announcements are archival). */
export const annPublished = (iso: string): string => {
  const d = valid(iso);
  if (!d) return "—";
  return `${dayLocal(d)}, ${d.getFullYear()} · ${clock(d)}`;
};

/** List date: desktop "Oct 13, 2026"; mobile drops the year inside the current year. */
export const annListDate = (iso: string, compact = false, now = new Date()): string => {
  const d = valid(iso);
  if (!d) return "—";
  if (compact && d.getFullYear() === now.getFullYear()) return dayLocal(d);
  return `${dayLocal(d)}, ${d.getFullYear()}`;
};

/** "Oct 15, 02:00–04:00 UTC" or "Oct 15, 22:00 – Oct 16, 02:00 UTC". */
export const annWindowUtc = (start: string | null, end: string | null): string => {
  const s = valid(start);
  if (!s) return "";
  const e = valid(end);
  if (!e) return `${dayUtc(s)}, ${clockUtc(s)} UTC`;
  const sameDay = s.getUTCDate() === e.getUTCDate() && s.getUTCMonth() === e.getUTCMonth();
  return sameDay
    ? `${dayUtc(s)}, ${clockUtc(s)}–${clockUtc(e)} UTC`
    : `${dayUtc(s)}, ${clockUtc(s)} – ${dayUtc(e)}, ${clockUtc(e)} UTC`;
};

/** The same window in the viewer's clock: "10:00–12:00" or "Oct 16, 06:00 – 10:00". */
export const annWindowLocal = (start: string | null, end: string | null): string => {
  const s = valid(start);
  if (!s) return "";
  const e = valid(end);
  if (!e) return `${dayLocal(s)}, ${clock(s)}`;
  const sameDay = s.getDate() === e.getDate() && s.getMonth() === e.getMonth();
  return sameDay ? `${clock(s)}–${clock(e)}` : `${dayLocal(s)}, ${clock(s)} – ${dayLocal(e)}, ${clock(e)}`;
};

/** Local clock equals UTC → the "(… your time)" suffix is noise; hide it. */
export const viewerIsUtc = () => new Date().getTimezoneOffset() === 0;
