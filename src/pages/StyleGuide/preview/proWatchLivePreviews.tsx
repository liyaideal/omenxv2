/**
 * Pro 页头 · Watch live（PW-1 … PW-6，CPO 2026-11-10，规则 S5）。
 * 桌面 = 生产 ProEventHeaderLead（DesktopTrading 页头同一个组件：事件选择按钮 + Watch live）；
 * 手机 = 生产 MobileHeader + ProMobileWatchLive（MobileTradingLayout 同一组合）。
 * 帧里点钮不跳页（onPlay 空操作），生产里点了进 `/trade?event=<比赛>&play=1`（Lite 交易页开播）。
 */
import { MobileHeader } from "@/components/MobileHeader";
import { useT } from "@/i18n";
import { ProEventHeaderLead, ProMobileWatchLive } from "@/components/pro/ProWatchLive";
import { sportsClockText, type SportsClock } from "@/components/lite/sports/sportsClock";

const LIVE: SportsClock = { phase: "live", kickoffInMs: 0, liveClock: "Map 2" };
const PRE: SportsClock = { phase: "upcoming", kickoffInMs: 2 * 3_600_000 + 10 * 60_000, liveClock: null };
const MATCH = "Spirit vs MOUZ";

type Kind = "stream" | "nostream" | "pre";
const clockOf = (k: Kind) => (k === "pre" ? PRE : LIVE);

const noop = () => undefined;

// The row wrapper = DesktopTrading's header row (flex, gap 12) with its page padding.
const Desk = ({ kind }: { kind: Kind }) => (
  <div className="px-6 py-4">
    <div className="flex items-center gap-3 min-w-0">
      <ProEventHeaderLead
        name={MATCH}
        open={false}
        onToggle={noop}
        caption="Match winner"
        sportsClock={clockOf(kind)}
        countdown=""
        watchEventId={kind === "stream" ? "demo-live-cs2" : null}
        onPlay={noop}
      />
    </div>
  </div>
);

const Mob = ({ kind }: { kind: Kind }) => {
  useT(); // the clock text is read once per render — re-render when the language catalog arrives
  const clock = clockOf(kind);
  return (
    <div>
      <MobileHeader
        title={MATCH}
        countdownText={sportsClockText(clock, "pro")}
        countdownLabel="Match winner"
        countdownUrgency={clock.phase === "live" ? "live" : "muted"}
        statsExtra={<ProMobileWatchLive eventId={kind === "stream" ? "demo-live-cs2" : null} onPlay={noop} />}
        showBack
        showLogo={false}
      />
    </div>
  );
};

export const PwDeskStream = () => <Desk kind="stream" />;
export const PwDeskNoStream = () => <Desk kind="nostream" />;
export const PwDeskPre = () => <Desk kind="pre" />;
export const PwMobStream = () => <Mob kind="stream" />;
export const PwMobNoStream = () => <Mob kind="nostream" />;
export const PwMobPre = () => <Mob kind="pre" />;
