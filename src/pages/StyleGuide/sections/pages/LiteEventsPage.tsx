import { LitePage } from "./shell";
import { LiteSection } from "../LiteSection";
import { LiteAllStageSection } from "../LiteAllStageSection";
import { LiteVerticalViewsSection } from "../LiteVerticalViewsSection";
import { LiteCalendarSection } from "../LiteCalendarSection";
import { LiteFinalTouchesSection } from "../LiteFinalTouchesSection";
import { EventArtSection } from "../EventArtSection";
import { EventsStatesSection } from "../EventsStatesSection";

type P = { isMobile: boolean };

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

    <EventsStatesSection />

    <div className="border-t-2 border-dashed border-[#FF8A3D]/50 pt-5">
      <div className="text-[13px] font-semibold uppercase tracking-wider text-[#FF8A3D]">
        ── 以下为旧版节（M1b 并账后删除） ──
      </div>
    </div>

    <LiteSection isMobile={isMobile} part="events" />
    <LiteAllStageSection />
    <LiteVerticalViewsSection />
    <LiteCalendarSection />
    <LiteFinalTouchesSection />
    <EventArtSection isMobile={isMobile} />
  </LitePage>
);
