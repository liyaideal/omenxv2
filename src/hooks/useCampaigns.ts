import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CampaignStatus = "draft" | "live" | "ended";
export type GrantStatus = "not_started" | "in_progress" | "claimable" | "claimed" | "not_eligible";

export interface CampaignTaskDef {
  task_key: string;
  name: string;
  subtitle?: string;
  target?: number;
  metric?: "count" | "usd_volume";
  reward?: { voucher?: number; usdc?: number };
}

export interface CampaignBranding {
  display_name?: string;
  avatar_url?: string | null;
  blurb?: string | null;
  key_visual_url?: string | null;
  accent?: string | null;
}

export interface CampaignEntry {
  id: string;
  campaignId: string;
  kind: "public" | "special";
  channelId: string | null;
  linkCode: string | null;
  tasks: CampaignTaskDef[];
  reward: { voucher?: number; usdc?: number };
  branding: CampaignBranding;
  seedBase: number;
  cap: number | null;
}

export interface Campaign {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  status: CampaignStatus;
  entries: CampaignEntry[];
}

export interface CampaignGrant {
  id: string;
  entryId: string;
  taskKey: string;
  progress: Record<string, unknown>;
  status: GrantStatus;
}

export interface CampaignParticipation {
  id: string;
  campaignId: string;
  entryId: string;
  joinedAt: string;
  lockedAt: string | null;
  source: string | null;
}

export const DEFAULT_ACCENT = "#33D6FF";

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const mapEntry = (row: any): CampaignEntry => {
  const rules = asRecord(row.rules);
  const tasks = Array.isArray(rules.tasks) ? (rules.tasks as CampaignTaskDef[]) : [];
  return {
    id: row.id,
    campaignId: row.campaign_id,
    kind: row.kind,
    channelId: row.channel_id ?? null,
    linkCode: row.link_code ?? null,
    tasks,
    reward: asRecord(row.reward) as { voucher?: number; usdc?: number },
    branding: asRecord(row.branding) as CampaignBranding,
    seedBase: Number(row.seed_base ?? 0),
    cap: row.cap === null || row.cap === undefined ? null : Number(row.cap),
  };
};

/** Campaign catalogue + entries (public read). */
export const useCampaignCatalogue = () => {
  const query = useQuery({
    queryKey: ["campaigns"],
    queryFn: async (): Promise<Campaign[]> => {
      const [{ data: campaigns, error: cErr }, { data: entries, error: eErr }] = await Promise.all([
        supabase.from("campaigns").select("*").in("status", ["live", "ended"]).order("starts_at", { ascending: false }),
        supabase.from("campaign_entries").select("*"),
      ]);
      if (cErr) throw cErr;
      if (eErr) throw eErr;
      const mapped = (entries ?? []).map(mapEntry);
      return (campaigns ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        startsAt: c.starts_at,
        endsAt: c.ends_at,
        status: c.status as CampaignStatus,
        entries: mapped.filter((e) => e.campaignId === c.id),
      }));
    },
  });
  return query;
};

/** Joined counts per entry (seed_base + real participations), via security-definer RPC. */
export const useCampaignJoined = () =>
  useQuery({
    queryKey: ["campaign-joined"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.rpc("get_campaign_entry_joined");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        map[r.entry_id] = Number(r.joined ?? 0);
      });
      return map;
    },
  });

export const useCampaignParticipations = () => {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["campaign-participations", user?.id],
    queryFn: async (): Promise<CampaignParticipation[]> => {
      const { data, error } = await supabase.from("campaign_participations").select("*");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        campaignId: r.campaign_id,
        entryId: r.entry_id,
        joinedAt: r.joined_at,
        lockedAt: r.locked_at,
        source: r.source,
      }));
    },
  });
};

export const useCampaignGrants = () => {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["campaign-grants", user?.id],
    queryFn: async (): Promise<CampaignGrant[]> => {
      const { data, error } = await supabase.from("campaign_grants").select("*");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        entryId: r.entry_id,
        taskKey: r.task_key,
        progress: asRecord(r.progress),
        status: r.status as GrantStatus,
      }));
    },
  });
};

export type CampaignPhase = "live" | "upcoming" | "always-on" | "ended";

export interface CampaignView {
  campaign: Campaign;
  entry: CampaignEntry | null;
  participation: CampaignParticipation | null;
  phase: CampaignPhase;
  tasksTotal: number;
  tasksDone: number;
  claimableCount: number;
  rewardVoucherUpTo: number;
  rewardUsdcUpTo: number;
  voucherClaimed: number;
  usdcClaimed: number;
  joined: number;
  daysLeft: number | null;
  accent: string;
  grants: CampaignGrant[];
}

export const phaseOf = (c: Campaign): CampaignPhase => {
  const now = Date.now();
  if (c.status === "ended" || (c.endsAt && new Date(c.endsAt).getTime() < now)) return "ended";
  if (new Date(c.startsAt).getTime() > now) return "upcoming";
  if (!c.endsAt) return "always-on";
  return "live";
};

export const buildCampaignView = (
  campaign: Campaign,
  participations: CampaignParticipation[],
  grants: CampaignGrant[],
  joinedMap: Record<string, number>,
  pendingLinkCode?: string | null,
): CampaignView => {
  const participation = participations.find((p) => p.campaignId === campaign.id) ?? null;
  const entry =
    campaign.entries.find((e) => e.id === participation?.entryId) ??
    (pendingLinkCode
      ? campaign.entries.find(
          (e) => e.linkCode && e.linkCode.toUpperCase() === pendingLinkCode.toUpperCase(),
        )
      : undefined) ??
    campaign.entries.find((e) => e.kind === "public") ??
    campaign.entries[0] ??
    null;
  const entryGrants = entry ? grants.filter((g) => g.entryId === entry.id) : [];
  const tasks = entry?.tasks ?? [];
  const statusFor = (key: string): GrantStatus =>
    entryGrants.find((g) => g.taskKey === key)?.status ?? "not_started";

  let voucherUpTo = 0;
  let usdcUpTo = 0;
  let voucherClaimed = 0;
  let usdcClaimed = 0;
  tasks.forEach((t) => {
    voucherUpTo += t.reward?.voucher ?? 0;
    usdcUpTo += t.reward?.usdc ?? 0;
    if (statusFor(t.task_key) === "claimed") {
      voucherClaimed += t.reward?.voucher ?? 0;
      usdcClaimed += t.reward?.usdc ?? 0;
    }
  });

  const endsAt = campaign.endsAt ? new Date(campaign.endsAt).getTime() : null;
  const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 86_400_000)) : null;

  return {
    campaign,
    entry,
    participation,
    phase: phaseOf(campaign),
    tasksTotal: tasks.length,
    tasksDone: tasks.filter((t) => statusFor(t.task_key) === "claimed").length,
    claimableCount: tasks.filter((t) => statusFor(t.task_key) === "claimable").length,
    rewardVoucherUpTo: voucherUpTo,
    rewardUsdcUpTo: usdcUpTo,
    voucherClaimed,
    usdcClaimed,
    joined: entry ? (joinedMap[entry.id] ?? entry.seedBase) : 0,
    daysLeft,
    accent: entry?.branding.accent || DEFAULT_ACCENT,
    grants: entryGrants,
  };
};

/** Everything the Rewards page needs, already joined up. */
export const useCampaignViews = () => {
  const catalogue = useCampaignCatalogue();
  const joined = useCampaignJoined();
  const participations = useCampaignParticipations();
  const grants = useCampaignGrants();
  const queryClient = useQueryClient();
  const pendingLinkCode = usePendingEntryCode();

  const views = useMemo(
    () =>
      sortCampaignViews(
        (catalogue.data ?? []).map((c) =>
          buildCampaignView(
            c,
            participations.data ?? [],
            grants.data ?? [],
            joined.data ?? {},
            pendingLinkCode,
          ),
        ),
      ),
    [catalogue.data, participations.data, grants.data, joined.data, pendingLinkCode],
  );

  return {
    views,
    isLoading: catalogue.isLoading,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-grants"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-participations"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-joined"] });
    },
  };
};

export const formatDateRange = (startsAt: string, endsAt: string | null) => {
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const start = fmt(new Date(startsAt));
  return endsAt ? `${start} – ${fmt(new Date(endsAt))}` : `${start} – no end date`;
};