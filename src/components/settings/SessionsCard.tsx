import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";
import { SettingsCapsule, SettingsCard, SettingsNote, SettingsRow } from "./SettingsCard";

/**
 * Settings › Sessions (new, CPO 2026-09-22 rules 16–18, mock v5 §1 / 4.12–4.14).
 * Rows come from `list_my_sessions()` (SECURITY DEFINER over auth.sessions,
 * scoped to auth.uid()): device = user-agent parsed, location = the IP the
 * session was last seen from (the blueprint has no geo-IP service — the live
 * platform resolves it to a city), time = last active. Current session gets
 * the `THIS DEVICE` capsule. Only one session → button hidden + footnote.
 * `Sign out other devices` = `supabase.auth.signOut({ scope: "others" })`.
 */

export interface SessionRow {
  id: string;
  created_at: string;
  last_active_at: string;
  user_agent: string | null;
  ip: string | null;
  is_current: boolean;
}

export const SESSIONS_QUERY_KEY = ["my-sessions"];

const fetchSessions = async (): Promise<SessionRow[]> => {
  const { data, error } = await supabase.rpc("list_my_sessions");
  if (error) throw error;
  return (data ?? []) as SessionRow[];
};

/** "Chrome · macOS" from a user agent; null when nothing is recognisable. */
export const describeUserAgent = (ua: string | null | undefined): { label: string; mobile: boolean } | null => {
  if (!ua) return null;
  const s = ua;
  let browser: string | null = null;
  if (/Edg\//.test(s)) browser = "Edge";
  else if (/OPR\//.test(s)) browser = "Opera";
  else if (/Chrome\//.test(s) && !/Chromium/.test(s)) browser = "Chrome";
  else if (/Firefox\//.test(s)) browser = "Firefox";
  else if (/Safari\//.test(s) && !/Chrome/.test(s)) browser = "Safari";
  let os: string | null = null;
  let mobile = false;
  if (/iPhone/.test(s)) {
    os = "iPhone";
    mobile = true;
  } else if (/iPad/.test(s)) {
    os = "iPad";
    mobile = true;
  } else if (/Android/.test(s)) {
    os = "Android";
    mobile = true;
  } else if (/Mac OS X|Macintosh/.test(s)) os = "macOS";
  else if (/Windows/.test(s)) os = "Windows";
  else if (/CrOS/.test(s)) os = "ChromeOS";
  else if (/Linux/.test(s)) os = "Linux";
  if (!browser && !os) return null;
  return { label: [browser, os].filter(Boolean).join(" · "), mobile };
};

const relativeTime = (iso: string, now = Date.now()): string => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60000);
  if (min < 2) return "now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export type SessionsPreviewState = "many" | "single" | "loading" | "error" | "unknown";

const PREVIEW_ROWS: Record<Exclude<SessionsPreviewState, "loading" | "error">, SessionRow[]> = {
  many: [
    { id: "1", created_at: "2026-09-20T02:00:00Z", last_active_at: new Date().toISOString(), user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36", ip: "203.0.113.24", is_current: true },
    { id: "2", created_at: "2026-09-19T02:00:00Z", last_active_at: new Date(Date.now() - 2 * 3600e3).toISOString(), user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", ip: "203.0.113.24", is_current: false },
    { id: "3", created_at: "2026-09-18T02:00:00Z", last_active_at: "2026-09-18T09:12:00Z", user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36", ip: "198.51.100.7", is_current: false },
  ],
  single: [
    { id: "1", created_at: "2026-09-20T02:00:00Z", last_active_at: new Date().toISOString(), user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36", ip: "203.0.113.24", is_current: true },
  ],
  unknown: [
    { id: "1", created_at: "2026-09-20T02:00:00Z", last_active_at: new Date().toISOString(), user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36", ip: "203.0.113.24", is_current: true },
    { id: "2", created_at: "2026-09-15T02:00:00Z", last_active_at: "2026-09-15T09:12:00Z", user_agent: null, ip: null, is_current: false },
  ],
};

export const SessionsCard = ({
  previewState,
}: {
  /** Style-guide only: freeze the card in a state with display fixtures. Never set in product. */
  previewState?: SessionsPreviewState;
} = {}) => {
  const isMobile = useIsMobile();
  const preview = !!previewState;
  const { user } = useUserProfile();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: fetchSessions,
    enabled: !preview && !!user,
    staleTime: 30_000,
  });
  const [signingOut, setSigningOut] = useState(false);

  const loading = preview ? previewState === "loading" : query.isLoading;
  const error = preview ? previewState === "error" : !!query.error;
  const rows: SessionRow[] = preview
    ? previewState === "loading" || previewState === "error"
      ? []
      : PREVIEW_ROWS[previewState]
    : query.data ?? [];

  const signOutOthers = async () => {
    if (preview) {
      toast.message("Preview: would sign out other devices");
      return;
    }
    setSigningOut(true);
    const { error: err } = await supabase.auth.signOut({ scope: "others" });
    setSigningOut(false);
    if (err) {
      toast.error("Couldn't sign out other devices. Try again.");
      return;
    }
    toast.success("Signed out other devices");
    queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
  };

  const count = rows.length;
  const value = loading || error ? undefined : `${count} ${count === 1 ? "device" : "devices"}`;

  return (
    <SettingsCard label="Sessions" value={value} compact={isMobile}>
      {loading ? (
        <div className="space-y-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn("py-4", i < 2 && "border-b border-[#1D2026]")}>
              <Skeleton className="h-3 w-[52%]" />
              <Skeleton className="h-2.5 w-[30%] mt-2.5" />
            </div>
          ))}
        </div>
      ) : error ? (
        <SettingsRow
          icon={AlertCircle}
          title="Couldn't load sessions"
          sub="Check your connection and try again."
          right={
            <Button variant="outline" size="sm" className="h-8" onClick={() => (preview ? undefined : query.refetch())}>
              Retry
            </Button>
          }
          last={rows.length === 0}
        />
      ) : null}

      {!loading &&
        rows.map((row, i) => {
          const ua = describeUserAgent(row.user_agent);
          const last = i === rows.length - 1;
          return (
            <SettingsRow
              key={row.id}
              icon={ua?.mobile ? Smartphone : Monitor}
              title={
                <>
                  {ua?.label ?? "Unknown device"}
                  {row.is_current && <SettingsCapsule tone="primary">This device</SettingsCapsule>}
                </>
              }
              sub={`${row.ip || "Unknown location"} · ${relativeTime(row.last_active_at)}`}
              subMono
              last={last}
            />
          );
        })}

      {!loading && !error && count === 1 && <SettingsNote>You're only signed in here.</SettingsNote>}

      {!loading && !error && count > 1 && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full mt-4"
          disabled={signingOut}
          onClick={signOutOthers}
        >
          Sign out other devices
        </Button>
      )}
    </SettingsCard>
  );
};
