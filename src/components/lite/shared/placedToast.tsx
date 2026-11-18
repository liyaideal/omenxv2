// ============================================================
// "Your call is placed" toast + jump to the position card (CPO 2026-11-18).
//
// After a buy on any Lite trade page (Boost, Standard, crypto rounds) the
// success toast carries a `View your call` action. Clicking it scrolls the
// matching position card into view and outlines it for 1.5 s — the card sits
// below the fold on most pages, so the user used to lose track of the call
// they had just made.
//
// Same atom pattern as CreditedToastBody: the production toast and the
// style-guide static body render from the same strings.
// ============================================================
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { t } from "@/i18n";

/** Attribute every Lite position card carries; its value is the option id. */
export const YOUR_CALL_ATTR = "data-lite-your-call";
/** Class toggled on the card while it is outlined. Styled in index.css. */
export const YOUR_CALL_FLASH_CLASS = "lite-call-flash";

/** How long the toast stays (sonner default is 4 s — too short to click). */
export const PLACED_TOAST_MS = 6000;
/** How long the card stays outlined once it is in view. */
export const YOUR_CALL_FLASH_MS = 1500;

export const placedToastActionLabel = () => t("trade.screen.lite.winloss.toast_view_call");

/**
 * Scroll to the position card for `optionId` and outline it. Falls back to the
 * first card on the page when the id has no exact match (a netted leg, or a
 * page with a single card). The card may not be rendered yet right after the
 * fill — positions refetch — so this retries for ~2 s before giving up.
 */
export function focusYourCall(optionId?: string | null) {
  let tries = 0;
  const run = () => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(`[${YOUR_CALL_ATTR}]`));
    const el = (optionId && cards.find((c) => c.getAttribute(YOUR_CALL_ATTR) === optionId)) || cards[0];
    if (!el) {
      if (tries++ < 14) window.setTimeout(run, 150);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add(YOUR_CALL_FLASH_CLASS);
    // ~400 ms of smooth scroll, then the full 1.5 s in view.
    window.setTimeout(() => el.classList.remove(YOUR_CALL_FLASH_CLASS), YOUR_CALL_FLASH_MS + 400);
  };
  run();
}

/** Success toast after a buy. `description` is omitted at 1× / on Standard. */
export function showPlacedToast(title: string, description?: string, optionId?: string | null) {
  toast.success(title, {
    description,
    duration: PLACED_TOAST_MS,
    action: { label: placedToastActionLabel(), onClick: () => focusYourCall(optionId) },
  });
}

/** Style-guide only: static replica of the sonner toast chrome. */
export const PlacedToastBody = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex w-[356px] max-w-full items-center gap-2 rounded-lg border border-border bg-background p-4 shadow-lg">
    <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
    <div className="min-w-0 flex-1">
      <div className="text-[13px] font-semibold leading-snug text-foreground">{title}</div>
      {description && <div className="text-[12px] leading-snug text-muted-foreground">{description}</div>}
    </div>
    <button
      type="button"
      className="h-6 shrink-0 rounded bg-primary px-2 text-[12px] font-medium text-primary-foreground"
    >
      {placedToastActionLabel()}
    </button>
  </div>
);
