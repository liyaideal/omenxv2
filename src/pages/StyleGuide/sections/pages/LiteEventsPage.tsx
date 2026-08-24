import { LitePage } from "./shell";
import { LiteSection } from "../LiteSection";
import { LiteAllStageSection } from "../LiteAllStageSection";
import { LiteVerticalViewsSection } from "../LiteVerticalViewsSection";
import { LiteCalendarSection } from "../LiteCalendarSection";
import { LiteFinalTouchesSection } from "../LiteFinalTouchesSection";
import { EventArtSection } from "../EventArtSection";

type P = { isMobile: boolean };

export const LiteEventsPage = ({ isMobile }: P) => (
  <LitePage
    id="lite-events"
    title="Events 列表"
    route="/events"
    status="done"
    note="列表卡、All stage、垂类视图、日历视图、收官细节，以及事件封面插画契约（封面只在列表/卡片出现，故归入本页）。"
  >
    <LiteSection isMobile={isMobile} part="events" />
    <LiteAllStageSection />
    <LiteVerticalViewsSection />
    <LiteCalendarSection />
    <LiteFinalTouchesSection />
    <EventArtSection isMobile={isMobile} />
  </LitePage>
);
