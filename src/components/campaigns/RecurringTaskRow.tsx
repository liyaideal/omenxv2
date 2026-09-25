import { useState } from "react";
import { CircleSlash, Loader2, Repeat } from "lucide-react";
import { Link } from "react-router-dom";
import type { CampaignGrant, CampaignTaskDef, GrantStatus } from "@/hooks/useCampaigns";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ClaimButton, TaskRowShell } from "./TaskRowShell";

/**
 * RecurringTaskRow — the `type: "recurring"` renderer (design: t3-recurring v2.2,
 * approved 2026-09-25). Same TaskRowShell chrome; the row shows the CURRENT
 * period only (bar + `$32 / $50 today`), a third line with the last 14 days
 * (7 on mobile) and the streak, and a two-line reward slot. History lives in
 * a hover card (desktop) / drawer (mobile) — month calendar + three KPIs.
 *
 * Everything visible is derived from one grant list by `deriveRecurring()`:
 * period grants `<key>@<YYYY-MM-DD | IYYY-Www>` and streak bonuses `<key>#s<n>`.
 * The server credits USDC periods / bonuses on reach; voucher periods go
 * claimable and stay claimable across periods (never expire).
 */

const DAY = 86_400_000;
const fmtUsd = (n: number) => `$${n.toLocaleString("en-US")}`;

/* ---------------- period helpers (UTC, mirror the SQL) ---------------- */
const utcDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const isoWeekStart = (d: Date) => {
  const day = utcDay(d);
  const dow = (day.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(day.getTime() - dow * DAY);
};
const isoWeekKey = (d: Date) => {
  const t = utcDay(d);
  const dow = (t.getUTCDay() + 6) % 7;
  const thursday = new Date(t.getTime() + (3 - dow) * DAY);
  const y = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const w1 = isoWeekStart(jan4);
  const week = Math.floor((isoWeekStart(t).getTime() - w1.getTime()) / (7 * DAY)) + 1;
  return `${y}-W${String(week).padStart(2, "0")}`;
};
/** `IYYY-Www` → Monday 00:00 UTC of that ISO week. */
const isoWeekStartFromKey = (key: string) => {
  const [y, w] = key.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  return new Date(isoWeekStart(jan4).getTime() + (w - 1) * 7 * DAY);
};
export const periodKeyOf = (period: "daily" | "weekly", d: Date) =>
  period === "weekly" ? isoWeekKey(d) : utcDay(d).toISOString().slice(0, 10);
const periodStartOf = (period: "daily" | "weekly", d: Date) => (period === "weekly" ? isoWeekStart(d) : utcDay(d));
const periodPrev = (period: "daily" | "weekly", start: Date) =>
  new Date(start.getTime() - (period === "weekly" ? 7 : 1) * DAY);

export type PeriodCell = {
  key: string;
  start: Date;
  state: "pre" | "miss" | "done" | "bonus" | "today" | "today-done" | "future";
};

export interface RecurringDerived {
  period: "daily" | "weekly";
  todayKey: string;
  todayValue: number;
  todayStatus: GrantStatus;
  todayDone: boolean; // credited (USDC) or claimable/claimed (voucher)
  doneCount: number; // periods done (all time)
  streak: number; // trailing consecutive done periods
  earned: number; // credited/claimed $ (periods + bonuses)
  completed: boolean;
  claimableKeys: string[]; // voucher periods / bonuses waiting for Claim
  claimableSum: number;
  unit: "usdc" | "voucher";
  strip: PeriodCell[]; // last 14 periods, oldest → today
  monthCells: PeriodCell[]; // every period from join (or the first grant) to today (daily only)
  notEligible: boolean;
}

const isDone = (s?: GrantStatus) => s === "claimed" || s === "claimable";

export const deriveRecurring = (
  task: CampaignTaskDef,
  grants: CampaignGrant[],
  joinedAt?: string | null,
  now: Date = new Date(),
): RecurringDerived => {
  const period = task.period === "weekly" ? "weekly" : "daily";
  const prefix = `${task.task_key}@`;
  const periods = new Map<string, CampaignGrant>();
  const bonuses: CampaignGrant[] = [];
  grants.forEach((g) => {
    if (g.taskKey.startsWith(prefix)) periods.set(g.taskKey.slice(prefix.length), g);
    else if (g.taskKey.startsWith(`${task.task_key}#s`)) bonuses.push(g);
  });
  const unit: "usdc" | "voucher" = (task.reward?.usdc ?? 0) > 0 ? "usdc" : "voucher";
  const amt = (r?: { usdc?: number; voucher?: number }) => ((r?.usdc ?? 0) > 0 ? r!.usdc! : (r?.voucher ?? 0));

  const todayKey = periodKeyOf(period, now);
  const todayGrant = periods.get(todayKey);
  const raw = todayGrant?.progress as { value?: number; current?: number } | undefined;
  const todayValue = typeof raw?.value === "number" ? raw.value : typeof raw?.current === "number" ? raw.current : 0;
  const todayStatus: GrantStatus = todayGrant?.status ?? "not_started";
  const todayDone = isDone(todayStatus);

  const doneCount = [...periods.values()].filter((g) => isDone(g.status)).length;
  const completed = !!task.max_periods && doneCount >= task.max_periods;

  // streak: walk back from today (if done) or from the previous period
  let streak = 0;
  let cursor = periodStartOf(period, now);
  if (!todayDone) cursor = periodPrev(period, cursor);
  for (let i = 0; i < 400; i++) {
    const g = periods.get(periodKeyOf(period, cursor));
    if (!g || !isDone(g.status)) break;
    streak++;
    cursor = periodPrev(period, cursor);
  }

  // The task may have been added to the campaign long after the user joined: history
  // starts at the task's first period record (or join, whichever is later), never earlier —
  // days before that are "pre" (blank), not "missed".
  const earliestKey = [...periods.keys()].sort()[0];
  const earliestStart = earliestKey
    ? period === "weekly"
      ? isoWeekStartFromKey(earliestKey)
      : new Date(`${earliestKey}T00:00:00Z`)
    : null;
  const joinStartRaw = joinedAt ? periodStartOf(period, new Date(joinedAt)) : null;
  const joinStart =
    earliestStart && joinStartRaw
      ? new Date(Math.max(earliestStart.getTime(), joinStartRaw.getTime()))
      : earliestStart ?? joinStartRaw;
  const every = task.streak_bonus?.every ?? 0;

  // cells from `from` to today, with a running streak so bonus days are marked
  const cellsFrom = (from: Date): PeriodCell[] => {
    const out: PeriodCell[] = [];
    let run = 0;
    const todayStart = periodStartOf(period, now);
    for (let c = from; c.getTime() <= todayStart.getTime(); c = new Date(c.getTime() + (period === "weekly" ? 7 : 1) * DAY)) {
      const key = periodKeyOf(period, c);
      const g = periods.get(key);
      const done = !!g && isDone(g.status);
      const pre = joinStart ? c.getTime() < joinStart.getTime() : !g && out.every((x) => x.state === "pre");
      const isToday = key === todayKey;
      let state: PeriodCell["state"];
      if (pre) state = "pre";
      else if (done) {
        run++;
        const bonus = every > 0 && run % every === 0;
        state = isToday ? "today-done" : bonus ? "bonus" : "done";
        if (isToday && bonus) state = "bonus";
      } else {
        run = 0;
        state = isToday ? "today" : "miss";
      }
      out.push({ key, start: c, state });
    }
    return out;
  };
  const todayStart = periodStartOf(period, now);
  const strip = cellsFrom(new Date(todayStart.getTime() - 13 * (period === "weekly" ? 7 : 1) * DAY));
  // month calendar: from the first record (≥ join) to today, capped at ~2 months so the card fits
  const cap = new Date(todayStart.getTime() - 62 * DAY);
  const monthFrom = joinStart ? new Date(Math.max(joinStart.getTime(), cap.getTime())) : todayStart;
  const monthCells = period === "daily" ? cellsFrom(monthFrom) : [];

  const claimable = [...periods.values(), ...bonuses].filter((g) => g.status === "claimable");
  const claimableSum = claimable.reduce(
    (a, g) => a + amt(g.taskKey.includes("#s") ? task.streak_bonus?.reward : task.reward),
    0,
  );
  const earned = [...periods.values(), ...bonuses]
    .filter((g) => g.status === "claimed")
    .reduce((a, g) => a + amt(g.taskKey.includes("#s") ? task.streak_bonus?.reward : task.reward), 0);

  return {
    period,
    todayKey,
    todayValue,
    todayStatus,
    todayDone,
    doneCount,
    streak,
    earned,
    completed,
    claimableKeys: claimable.map((g) => g.taskKey),
    claimableSum,
    unit,
    strip,
    monthCells,
    notEligible: [...periods.values()].some((g) => g.status === "not_eligible"),
  };
};

/* ---------------- pieces ---------------- */
const CELL_BG: Record<PeriodCell["state"], string> = {
  pre: "transparent",
  miss: "#2B2F38",
  done: "#33D6FF",
  bonus: "#FF8A3D",
  today: "transparent",
  "today-done": "#33D6FF",
  future: "transparent",
};
const cellStyle = (state: PeriodCell["state"], size: number) => ({
  width: size,
  height: size,
  borderRadius: 999,
  background: CELL_BG[state],
  border:
    state === "today" ? "1.5px solid #33D6FF" : state === "pre" || state === "future" ? "1px dashed #2B2F38" : undefined,
});

const Strip = ({ d, mobile, max }: { d: RecurringDerived; mobile: boolean; max?: number }) => {
  const cells = mobile ? d.strip.slice(-7) : d.strip;
  const noun = d.period === "weekly" ? "week" : "day";
  const cap = d.completed
    ? `${d.doneCount} / ${max ?? d.doneCount} ${noun}s done`
    : d.streak >= 2
      ? `🔥 ${d.streak}-${noun} streak`
      : `Last ${cells.length} ${noun}s`;
  return (
    <div className={`mt-2 flex items-center gap-2 ${mobile ? "justify-between" : ""}`} data-recurring-strip>
      <div className="flex gap-1">
        {cells.map((c) => (
          <span key={c.key} data-period={c.state} style={cellStyle(c.state, 14)} />
        ))}
      </div>
      <span
        className="whitespace-nowrap font-display text-[11px]"
        style={{ color: !d.completed && d.streak >= 2 ? "#FF8A3D" : "#6B7280", fontWeight: !d.completed && d.streak >= 2 ? 600 : 400 }}
      >
        {cap}
      </span>
    </div>
  );
};

const Kpi = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div className="flex-1 rounded-[10px] border border-[#1D2026] bg-[#0F1114] px-[10px] py-2">
    <div className="text-[10px] uppercase tracking-[0.08em] text-[#6B7280]">{label}</div>
    <div className="font-display text-[16px] font-bold" style={{ color: color ?? "#fff" }}>
      {value}
    </div>
  </div>
);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Month calendar (daily tasks) — one grid per month from join to today. Weekly tasks list weeks. */
export const RecurringHistory = ({ task, d }: { task: CampaignTaskDef; d: RecurringDerived }) => {
  const noun = d.period === "weekly" ? "weeks" : "days";
  const months = new Map<string, PeriodCell[]>();
  d.monthCells.forEach((c) => {
    const k = `${c.start.getUTCFullYear()}-${c.start.getUTCMonth()}`;
    months.set(k, [...(months.get(k) ?? []), c]);
  });
  return (
    <div>
      <div className="mb-3 text-[12px] text-[#9AA1AC]">
        {task.name} · {fmtUsd(task.target ?? 0)} {d.period === "weekly" ? "a week" : "a day"}
      </div>
      <div className="mb-3 flex gap-2">
        <Kpi label={`${noun} done`} value={task.max_periods ? `${d.doneCount} / ${task.max_periods}` : `${d.doneCount}`} />
        <Kpi label="Streak" value={d.streak >= 2 ? `🔥 ${d.streak}` : `${d.streak}`} color={d.streak >= 2 ? "#FF8A3D" : undefined} />
        <Kpi label="Earned" value={`$${d.earned}`} color={d.unit === "usdc" ? "#33D6FF" : "#CFFF4A"} />
      </div>
      {d.period === "daily" ? (
        [...months.entries()].map(([k, cells]) => {
          const first = cells[0].start;
          const lead = (first.getUTCDay() + 6) % 7; // Monday-first offset of the first cell
          return (
            <div key={k} className="mt-2">
              <div className="mb-1.5 font-display text-[12px] font-semibold text-[#9AA1AC]">
                {MONTHS[first.getUTCMonth()]} {first.getUTCFullYear()}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => (
                  <div key={i} className="text-center text-[10px] text-[#6B7280]">
                    {w}
                  </div>
                ))}
                {Array.from({ length: lead }, (_, i) => (
                  <div key={`b${i}`} />
                ))}
                {cells.map((c) => (
                  <div
                    key={c.key}
                    data-period={c.state}
                    className="mx-auto grid h-9 w-9 place-items-center rounded-full font-display text-[11px]"
                    style={{
                      background: CELL_BG[c.state],
                      border: c.state === "today" ? "1.5px solid #33D6FF" : c.state === "pre" ? "1px dashed #2B2F38" : undefined,
                      color:
                        c.state === "done" || c.state === "bonus" || c.state === "today-done"
                          ? "#0A0B0D"
                          : c.state === "today"
                            ? "#33D6FF"
                            : "#6B7280",
                      fontWeight: c.state === "done" || c.state === "bonus" || c.state === "today-done" ? 700 : 400,
                    }}
                  >
                    {c.state === "pre" ? "" : c.start.getUTCDate()}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="mt-2 flex gap-1">
          {d.strip.map((c) => (
            <span key={c.key} data-period={c.state} style={cellStyle(c.state, 14)} />
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-3 text-[10.5px] text-[#6B7280]">
        {[
          ["#33D6FF", "done"],
          ["#2B2F38", "missed"],
          ["#FF8A3D", "streak bonus"],
        ].map(([c, l]) => (
          <span key={l} className="inline-flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />
            {l}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-2 w-2 rounded-full" style={{ border: "1.5px solid #33D6FF" }} />
          today
        </span>
      </div>
    </div>
  );
};

const TaskActionButton = ({ label, href }: { label: string; href: string }) => (
  <Link
    to={href}
    className="inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-[10px] border border-[#2B2F38] bg-transparent px-5 font-display text-[12.5px] font-semibold text-[#F2F3F5] transition-colors hover:border-[#3A3F47] md:min-h-[40px] md:px-4"
  >
    {label}
  </Link>
);

export const RecurringTaskRow = ({
  task,
  grants,
  joinedAt,
  onClaim,
  claimingKey,
  frozen,
  signedOut,
  defaultDrawerOpen = false,
  now,
}: {
  task: CampaignTaskDef;
  grants: CampaignGrant[];
  joinedAt?: string | null;
  onClaim: (grantKey: string) => void | Promise<void>;
  claimingKey?: string | null;
  frozen?: boolean;
  signedOut?: boolean;
  /** Style-guide fixture only. */
  defaultDrawerOpen?: boolean;
  /** Style-guide fixture only — frozen clock. */
  now?: Date;
}) => {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(defaultDrawerOpen);
  const d = deriveRecurring(task, grants, joinedAt, now);
  const noun = d.period === "weekly" ? "weeks" : "days";
  const when = d.period === "weekly" ? "this week" : "today";
  const reward = (task.reward?.usdc ?? 0) > 0 ? task.reward!.usdc! : (task.reward?.voucher ?? 0);
  const cta = { label: "Trade", href: task.scope?.categories?.[0] ? `/events?sector=${task.scope.categories[0]}` : "/events", ...(task.cta ?? {}) } as { label: string; href: string };

  /* reward slot */
  const l1 = "whitespace-nowrap font-display text-[13.5px] font-bold leading-4";
  let line1: JSX.Element;
  if (frozen || d.completed) {
    line1 = <div className={`${l1} text-[#9AA1AC]`}>${d.earned} {d.unit === "usdc" ? "credited" : "claimed"}</div>;
  } else if (d.claimableKeys.length) {
    line1 = <div className={`${l1} text-[#CFFF4A]`}>${d.claimableSum} ready</div>;
  } else if (d.todayDone) {
    line1 = <div className={`${l1} text-[#9AA1AC]`}>${reward} credited</div>;
  } else {
    line1 = <div className={`${l1} text-[#9AA1AC]`}>${reward} {when}</div>;
  }
  const line2Text = `${d.doneCount}${task.max_periods ? ` / ${task.max_periods}` : ""} ${noun}`;
  const line2 = isMobile ? (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className="mt-0.5 font-display text-[11.5px] text-[#6B7280]"
      data-recurring-drawer-trigger
    >
      {line2Text} ›
    </button>
  ) : (
    <div className="mt-0.5 font-display text-[11.5px] text-[#6B7280]">{line2Text}</div>
  );

  /* action */
  let action: JSX.Element;
  if (signedOut && !frozen) {
    action = <span className="whitespace-nowrap text-[12.5px] text-[#6B7280]">Sign in to start</span>;
  } else if (d.notEligible) {
    action = <span className="text-right text-[12.5px] font-semibold text-[#9AA1AC]">Not eligible</span>;
  } else if (frozen) {
    action = <span className="text-right text-[12.5px] font-semibold text-[#9AA1AC]">Ended</span>;
  } else if (d.completed) {
    action = <span className="text-right text-[12.5px] font-semibold text-[#9AA1AC]">Completed</span>;
  } else if (d.claimableKeys.length) {
    const claimAll = async () => {
      try {
        for (const k of d.claimableKeys) await onClaim(k);
      } catch {
        /* page toasted; stop */
      }
    };
    action = (
      <ClaimButton onClick={claimAll} disabled={!!claimingKey}>
        {claimingKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {d.claimableKeys.length > 1 ? `Claim all $${d.claimableSum}` : `Claim $${d.claimableSum}`}
      </ClaimButton>
    );
  } else if (d.todayDone) {
    action = <span className="text-right text-[12.5px] font-semibold text-[#9AA1AC]">Done {when}</span>;
  } else {
    action = <TaskActionButton label={cta.label} href={cta.href} />;
  }

  const strip = signedOut || d.notEligible ? null : <Strip d={d} mobile={isMobile} max={task.max_periods} />;
  const extra =
    strip && !isMobile ? (
      <HoverCard openDelay={150}>
        <HoverCardTrigger asChild>
          <div className="w-fit cursor-default">{strip}</div>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-[320px] border-[#2B2F38] bg-[#1B1E24] p-[14px] text-[#F2F3F5]">
          <div className="mb-0.5 font-display text-[13px] font-bold">{d.period === "weekly" ? "Weekly progress" : "Daily progress"}</div>
          <RecurringHistory task={task} d={d} />
        </HoverCardContent>
      </HoverCard>
    ) : (
      strip
    );

  return (
    <>
      <TaskRowShell
        icon={d.notEligible ? CircleSlash : Repeat}
        title={task.name}
        muted={d.notEligible}
        dashed={d.notEligible}
        subtitle={d.notEligible ? "Covered by your friend's invite — this one goes to them." : task.subtitle}
        progress={
          d.notEligible || d.completed
            ? undefined
            : {
                value: d.todayValue,
                target: task.target ?? 1,
                fillColor: d.todayDone ? "#CFFF4A" : undefined,
                pct: d.todayDone ? 100 : undefined,
                suffix: when,
              }
        }
        extra={extra}
        reward={
          d.notEligible ? undefined : (
            <div className={isMobile ? "" : "w-[92px] shrink-0 text-right"}>
              {line1}
              {line2}
            </div>
          )
        }
        action={<div className={`flex items-center justify-end ${isMobile ? "" : "w-[132px] shrink-0"}`}>{action}</div>}
      />
      {isMobile && (
        <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={d.period === "weekly" ? "Weekly progress" : "Daily progress"}>
          <div className="pb-5">
            <RecurringHistory task={task} d={d} />
          </div>
        </MobileDrawer>
      )}
    </>
  );
};
