import { SectionWrapper } from "../components/SectionWrapper";

/**
 * Placeholder documentation node — no demo, no live component.
 * Lazily loaded as its own chunk from nav.tsx (never via the sections barrel).
 */
export const MessageCenterSection = (_: { isMobile: boolean }) => (
  <SectionWrapper
    id="message-center"
    title="Message Center · 消息中心（Backlog）"
    platform="shared"
  >
    <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p>
        <span className="font-semibold text-foreground">背景：</span>
        站内通知此前只有一个野生实现——H2E 空投 toast（AirdropNotificationToast，全局挂载、任意页面弹出），2026-08-25
        按 CPO 决策移除；空投到账提醒暂无承接面，属有意决策。
      </p>
      <p>
        <span className="font-semibold text-foreground">需求方向：</span>
        统一消息中心承接全站通知——H2E 空投到账/即将过期、campaign grant 可领取、voucher
        即将过期、结算通知、充提确认等；入口候选=顶栏铃铛（desktop header + mobile 头部）；需已读/未读与历史列表。未定稿。
      </p>
      <p>
        <span className="font-semibold text-foreground">状态：</span>
        Backlog。正式立项后按需求流程出方案，本节仅占位防遗忘。
      </p>
    </div>
  </SectionWrapper>
);
