import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CampaignStatus = "draft" | "live" | "ended";
export type GrantStatus = "not_started" | "in_progress" | "claimable" | "claimed" | "not_eligible";

/** `ticket` is a count inside the campaign (2026-11-12): nothing is credited to a balance, the grant itself is the ticket. */
export type TaskReward = { voucher?: number; usdc?: number; ticket?: number };

/** One rung of a tiered task: reach `target` on the shared metric → `reward`. */
export interface CampaignTaskTier {
  target: number;
  reward: TaskReward;
}

/**
 * `type` picks the row renderer + the server-side progress branch.
 * - `threshold` (default, legacy rows carry no `type`): one target, one reward.
 * - `tiered`: `tiers[]` on one shared metric; each tier is its own grant
 *   keyed `<task_key>#t<n>` (n from 1). USDC tiers are credited by the
 *   trigger the moment they are reached; voucher tiers become claimable.
 * - `repeatable` (2026-11-12): one reward every time the metric grows by `target`, never "done";
 *   each reward is its own grant keyed `<task_key>#r<n>` (n from 1). `max_times` caps the count.
 */
export type CampaignTaskType = "threshold" | "tiered" | "recurring" | "repeatable";

/**
 * How progress is measured (server recomputes each from source tables):
 * - usd_volume: filled notional in scope · count: any fill in scope
 * - referrals_qualified: friends who traded $100 (one reward path — counted friends
 *   skip the per-friend voucher) · active_days: distinct UTC days with a fill ≥ min_notional
 * - hold_positions: positions ≥ hold.min_notional held ≥ hold.min_hours (auto-closed count)
 * - winning_trades (2026-11-12): positions that ended in profit after the winning commission — settled or
 *   cashed out early — with at least `min_stake` of the user's own money; Quick Play wins count too
 *   unless the task is limited to categories; each market counts once unless `once_per_market: false`
 */
export type CampaignTaskMetric =
  | "count"
  | "usd_volume"
  | "referrals_qualified"
  | "active_days"
  | "hold_positions"
  | "winning_trades";

export interface CampaignTaskDef {
  task_key: string;
  type?: CampaignTaskType;
  name: string;
  subtitle?: string;
  target?: number;
  metric?: CampaignTaskMetric;
  reward?: TaskReward;
  /** Tiered only — ascending targets, 2..8 rungs. */
  tiers?: CampaignTaskTier[];
  /** Recurring only. */
  period?: "daily" | "weekly";
  max_periods?: number;
  streak_bonus?: { every: number; reward: TaskReward };
  /** active_days: minimum fill notional per day (default $10). */
  min_notional?: number;
  /** hold_positions parameters. */
  hold?: { min_hours?: number; min_notional?: number };
  /** winning_trades: minimum own money (margin, not the boosted size) per position. */
  min_stake?: number;
  /** winning_trades: count each market once (default true). */
  once_per_market?: boolean;
  /** repeatable: cap on how many times the reward is given (default: no cap). */
  max_times?: number;
  /** Which markets count toward this task (server-side driver reads the same field). */
  scope?: { categories?: string[]; any_market?: boolean; products?: ("markets" | "quick_play")[] };
  /** Action button shown while the task is not yet claimable. */
  cta?: { label?: string; href?: string };
}

export const isTieredTask = (t: CampaignTaskDef): boolean =>
  t.type === "tiered" && Array.isArray(t.tiers) && t.tiers.length > 0;
export const isRecurringTask = (t: CampaignTaskDef): boolean => t.type === "recurring";
export const isRepeatableTask = (t: CampaignTaskDef): boolean => t.type === "repeatable";
/** Grant-key prefix of a repeatable task's rewards (`<task_key>#r<n>`). */
export const repeatGrantPrefix = (taskKey: string) => `${taskKey}#r`;
/** How many times a repeatable task has paid out, and the reward total in its unit. */
export const deriveRepeatable = (task: CampaignTaskDef, grants: { taskKey: string; status: GrantStatus }[]) => {
  const prefix = repeatGrantPrefix(task.task_key);
  const rows = grants.filter((g) => g.taskKey.startsWith(prefix));
  const unit: "ticket" | "usdc" | "voucher" =
    (task.reward?.ticket ?? 0) > 0 ? "ticket" : (task.reward?.usdc ?? 0) > 0 ? "usdc" : "voucher";
  // Tickets and USDC are settled by the server straight to `claimed`; only vouchers wait as `claimable`.
  // Counting `claimed` only keeps this in step with get_campaign_leaderboard().
  const times = rows.filter((g) => g.status === "claimed" || (unit === "voucher" && g.status === "claimable")).length;
  const per = task.reward?.[unit] ?? 0;
  const maxed = !!task.max_times && times >= task.max_times;
  return { times, unit, per, earned: times * per, maxed, notEligible: rows.some((g) => g.status === "not_eligible") };
};

/** Progress unit per metric — `$` prefixes, count words are appended. */
export const metricUnit = (m?: CampaignTaskMetric): "$" | "friends" | "days" | "positions" | "wins" =>
  m === "referrals_qualified"
    ? "friends"
    : m === "active_days"
      ? "days"
      : m === "hold_positions"
        ? "positions"
        : m === "winning_trades"
          ? "wins"
          : "$";
/** Count metrics with small targets render as segmented steps. */
export const isCountMetric = (m?: CampaignTaskMetric) =>
  m === "referrals_qualified" || m === "active_days" || m === "hold_positions" || m === "winning_trades";

/** Grant key for period p of a recurring task (`YYYY-MM-DD` / `IYYY-Www`). */
export const periodGrantKey = (taskKey: string, periodKey: string) => `${taskKey}@${periodKey}`;
export const streakGrantKey = (taskKey: string, n: number) => `${taskKey}#s${n}`;

/** Grant key for tier n (1-based) of a tiered task. */
export const tierGrantKey = (taskKey: string, n: number) => `${taskKey}#t${n}`;

export interface CampaignBranding {
  display_name?: string;
  avatar_url?: string | null;
  blurb?: string | null;
  key_visual_url?: string | null;
  accent?: string | null;
  /** Replaces the campaign name on this entry's page and cards (e.g. a Spanish entry of the same campaign). */
  title?: string | null;
}

/** Entry leaderboard (rules.leaderboard): ranks the campaign's participants by one task. */
export interface CampaignLeaderboardDef {
  task_key: string;
  /** Rows shown (default 10). */
  top?: number;
  /** Block title; defaults to the catalog string. */
  title?: string;
  /** Optional text next to a rank, e.g. `{ rank: 1, label: "Wins $1,000 USDC" }`. */
  prizes?: { rank: number; label: string }[];
}

/** Entry eligibility (rules.eligibility). */
export interface CampaignEligibilityDef {
  /** Only accounts created through this entry's link take part. */
  new_users_only?: boolean;
  /** Accounts that take part regardless (the KOL's own account, demo accounts). */
  allow_user_ids?: string[];
}

export interface CampaignRuleDetails {
  heading?: string;
  paragraphs: string[];
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
  /** Long-form campaign rules, authored in rules.details. */
  details?: CampaignRuleDetails;
  leaderboard?: CampaignLeaderboardDef;
  eligibility?: CampaignEligibilityDef;
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
  const rawDetails = asRecord(rules.details);
  const paragraphs = Array.isArray(rawDetails.paragraphs)
    ? (rawDetails.paragraphs as unknown[]).filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    : [];
  const details: CampaignRuleDetails | undefined = paragraphs.length
    ? { heading: typeof rawDetails.heading === "string" ? rawDetails.heading : undefined, paragraphs }
    : undefined;
  const rawBoard = asRecord(rules.leaderboard);
  const leaderboard: CampaignLeaderboardDef | undefined =
    typeof rawBoard.task_key === "string" && tasks.some((t) => t.task_key === rawBoard.task_key)
      ? (rawBoard as unknown as CampaignLeaderboardDef)
      : undefined;
  const rawElig = asRecord(rules.eligibility);
  const eligibility: CampaignEligibilityDef | undefined = Object.keys(rawElig).length
    ? (rawElig as CampaignEligibilityDef)
    : undefined;
  return {
    id: row.id,
    campaignId: row.campaign_id,
    kind: row.kind,
    channelId: row.channel_id ?? null,
    linkCode: row.link_code ?? null,
    tasks,
    reward: asRecord(row.reward) as { voucher?: number; usdc?: number },
    branding: asRecord(row.branding) as CampaignBranding,
    details,
    leaderboard,
    eligibility,
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

const PENDING_ENTRY_KEY = "omenx_pending_campaign_entry";

/** `?entry=CODE` on the URL, or the code stashed for a visitor who isn't signed in yet. */
export const usePendingEntryCode = (): string | null => {
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get("entry");
  return useMemo(() => {
    if (fromUrl) return fromUrl;
    try {
      return localStorage.getItem(PENDING_ENTRY_KEY);
    } catch {
      return null;
    }
  }, [fromUrl]);
};

const PHASE_RANK: Record<CampaignPhase, number> = {
  live: 0,
  "always-on": 1,
  upcoming: 2,
  ended: 3,
};

/** LIVE (soonest ending first) → ALWAYS ON → upcoming (soonest starting first) → ended. */
export const sortCampaignViews = (views: CampaignView[]): CampaignView[] =>
  [...views].sort((a, b) => {
    const rank = PHASE_RANK[a.phase] - PHASE_RANK[b.phase];
    if (rank !== 0) return rank;
    if (a.phase === "live") {
      return (
        new Date(a.campaign.endsAt ?? 0).getTime() - new Date(b.campaign.endsAt ?? 0).getTime()
      );
    }
    if (a.phase === "upcoming") {
      return new Date(a.campaign.startsAt).getTime() - new Date(b.campaign.startsAt).getTime();
    }
    return new Date(b.campaign.startsAt).getTime() - new Date(a.campaign.startsAt).getTime();
  });

export interface CampaignView {
  campaign: Campaign;
  entry: CampaignEntry | null;
  participation: CampaignParticipation | null;
  phase: CampaignPhase;
  /** Name shown for this entry: its own title when set, otherwise the campaign name. */
  title: string;
  /** Tasks that can be finished — repeatable tasks never are, so they are left out of both counts. */
  tasksTotal: number;
  tasksDone: number;
  /** Tickets earned in this entry (0 when no task pays tickets). */
  ticketsEarned: number;
  /** At least one task pays tickets. */
  hasTickets: boolean;
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
  // A tiered task counts as ONE task: "up to" sums every rung, "done" means
  // every rung is claimed, "claimable" means at least one rung is claimable.
  // Recurring: grants keyed <key>@<period> (+ <key>#s<n> streak bonuses); "done" only when
  // max_periods is reached; "up to" = reward × max_periods + every bonus that fits.
  const periodGrants = (t: CampaignTaskDef) => entryGrants.filter((g) => g.taskKey.startsWith(`${t.task_key}@`));
  const streakGrants = (t: CampaignTaskDef) => entryGrants.filter((g) => g.taskKey.startsWith(`${t.task_key}#s`));
  const taskDone = (t: CampaignTaskDef) =>
    isTieredTask(t)
      ? t.tiers!.every((_, i) => statusFor(tierGrantKey(t.task_key, i + 1)) === "claimed")
      : isRecurringTask(t)
        ? !!t.max_periods && periodGrants(t).filter((g) => g.status === "claimed").length >= t.max_periods
        : statusFor(t.task_key) === "claimed";
  const taskClaimable = (t: CampaignTaskDef) =>
    isTieredTask(t)
      ? t.tiers!.some((_, i) => statusFor(tierGrantKey(t.task_key, i + 1)) === "claimable")
      : isRecurringTask(t)
        ? [...periodGrants(t), ...streakGrants(t)].some((g) => g.status === "claimable")
        : isRepeatableTask(t)
          ? entryGrants.some((g) => g.taskKey.startsWith(repeatGrantPrefix(t.task_key)) && g.status === "claimable")
          : statusFor(t.task_key) === "claimable";
  let ticketsEarned = 0;
  const hasTickets = tasks.some((t) => (t.reward?.ticket ?? 0) > 0);
  const completable = tasks.filter((t) => !isRepeatableTask(t));
  tasks.forEach((t) => {
    if (isRepeatableTask(t)) {
      // no "up to": the reward repeats; only what has been paid is known
      const r = deriveRepeatable(t, entryGrants);
      if (r.unit === "ticket") ticketsEarned += r.earned;
      else if (r.unit === "usdc") usdcClaimed += r.earned;
      else voucherClaimed += entryGrants.filter((g) => g.taskKey.startsWith(repeatGrantPrefix(t.task_key)) && g.status === "claimed").length * r.per;
      return;
    }
    if (isRecurringTask(t)) {
      const max = t.max_periods ?? 0;
      const bonusCount = t.streak_bonus?.every ? Math.floor(max / t.streak_bonus.every) : 0;
      voucherUpTo += (t.reward?.voucher ?? 0) * max + (t.streak_bonus?.reward?.voucher ?? 0) * bonusCount;
      usdcUpTo += (t.reward?.usdc ?? 0) * max + (t.streak_bonus?.reward?.usdc ?? 0) * bonusCount;
      [...periodGrants(t), ...streakGrants(t)].forEach((g) => {
        if (g.status !== "claimed") return;
        const r = g.taskKey.includes("#s") ? t.streak_bonus?.reward : t.reward;
        voucherClaimed += r?.voucher ?? 0;
        usdcClaimed += r?.usdc ?? 0;
      });
      return;
    }
    if (isTieredTask(t)) {
      t.tiers!.forEach((tier, i) => {
        voucherUpTo += tier.reward?.voucher ?? 0;
        usdcUpTo += tier.reward?.usdc ?? 0;
        if (statusFor(tierGrantKey(t.task_key, i + 1)) === "claimed") {
          voucherClaimed += tier.reward?.voucher ?? 0;
          usdcClaimed += tier.reward?.usdc ?? 0;
        }
      });
      return;
    }
    voucherUpTo += t.reward?.voucher ?? 0;
    usdcUpTo += t.reward?.usdc ?? 0;
    if (statusFor(t.task_key) === "claimed") {
      voucherClaimed += t.reward?.voucher ?? 0;
      usdcClaimed += t.reward?.usdc ?? 0;
      ticketsEarned += t.reward?.ticket ?? 0;
    }
  });

  const endsAt = campaign.endsAt ? new Date(campaign.endsAt).getTime() : null;
  const phase = phaseOf(campaign);
  // An ended campaign has no countdown — a frozen "0 days left" reads like a bug.
  const daysLeft =
    endsAt && phase !== "ended" ? Math.max(0, Math.ceil((endsAt - Date.now()) / 86_400_000)) : null;

  return {
    campaign,
    entry,
    participation,
    phase,
    title: entry?.branding.title || campaign.name,
    tasksTotal: completable.length,
    tasksDone: completable.filter(taskDone).length,
    ticketsEarned,
    hasTickets,
    claimableCount: tasks.filter(taskClaimable).length,
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

/**
 * Mirrors `campaign_entry_eligible()` in SQL: an entry limited to new users only counts accounts
 * created no earlier than 24h before they were bound to the entry by its link (or allow-listed ones).
 */
export const isEntryEligible = (
  entry: CampaignEntry | null,
  participation: CampaignParticipation | null,
  userId?: string | null,
  userCreatedAt?: string | null,
): boolean => {
  if (!entry?.eligibility?.new_users_only) return true;
  if (!userId) return true; // signed-out visitors are not told they are ineligible
  if (entry.eligibility.allow_user_ids?.includes(userId)) return true;
  if (!participation || participation.source !== "link" || !userCreatedAt) return false;
  return new Date(userCreatedAt).getTime() >= new Date(participation.joinedAt).getTime() - 24 * 3_600_000;
};

export interface CampaignLeaderboardRow {
  rank: number;
  username: string;
  value: number;
  isMe: boolean;
}

/** Top rows of an entry's leaderboard plus the caller's own row (security-definer RPC). */
export const useCampaignLeaderboard = (entry: CampaignEntry | null) => {
  const { user } = useAuth();
  const top = entry?.leaderboard?.top ?? 10;
  return useQuery({
    enabled: !!entry?.leaderboard,
    queryKey: ["campaign-leaderboard", entry?.id, top, user?.id],
    queryFn: async (): Promise<CampaignLeaderboardRow[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("get_campaign_leaderboard", { _entry_id: entry!.id, _limit: top });
      if (error) throw error;
      return ((data ?? []) as { rank: number; username: string; value: number; is_me: boolean }[]).map((r) => ({
        rank: Number(r.rank),
        username: r.username,
        value: Number(r.value),
        isMe: !!r.is_me,
      }));
    },
  });
};
