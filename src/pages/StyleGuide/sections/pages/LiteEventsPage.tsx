import { LitePage } from "./shell";
import { EventsStatesSection } from "../EventsStatesSection";
import { HomeAllSection } from "../HomeAllSection";

type P = { isMobile: boolean };

/**
 * Events 列表页 = 首页 All 视图字典 HA-1 … HA-20（2026-11-09 改版）+ EV-2 … EV-47。
 * M1b 已把旧六节（LiteSection part=events / LiteAllStage / LiteVerticalViews /
 * LiteCalendar / LiteFinalTouches / EventArt）并账删除挂载；逐条去向见
 * EventsStatesSection 末尾的「并账清单」。EventArt 的美术方向规范迁入 Foundations。
 */
export const LiteEventsPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-events"
    title="Events 列表"
    route="/"
    status="done"
    note="本页 = 产品页 /（Events 列表）的状态字典 · 样式与布局看生产页，状态与判定看本页。"
  >
    <div className="rounded-lg border border-[#CFFF4A]/30 bg-[#CFFF4A]/5 px-3 py-2 text-[12px] text-foreground">
      本页 = 产品页 <code className="font-mono">/</code>（Events 列表）的状态字典 ·
      样式与布局看生产页，状态与判定看本页
    </div>

    <HomeAllSection />
    <EventsStatesSection />
  </LitePage>
);
