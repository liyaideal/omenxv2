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

/** One pending "remove the outline" timer per card, so a second click restarts it. */
const flashTimers = new WeakMap<HTMLElement, number>();

/**
 * Scroll to the position card for `optionId` and outline it.
 *
 * The card may not be rendered yet right after the fill (positions refetch),
 * so this waits up to ~2 s for the exact card. Only when it still is not there
 * does it fall back to the first card on the page (a netted leg, a legacy
 * position without an option id). No card at all → nothing happens.
 */
export function focusYourCall(optionId?: string | null) {
  let tries = 0;
  const run = () => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(`[${YOUR_CALL_ATTR}]`));
    const exact = optionId ? cards.find((c) => c.getAttribute(YOUR_CALL_ATTR) === optionId) : undefined;
    const lastTry = tries >= 14;
    const el = exact ?? (lastTry || !optionId ? cards[0] : undefined);
    if (!el) {
      if (!lastTry) {
        tries += 1;
        window.setTimeout(run, 150);
      }
      return;
    }
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    el.classList.add(YOUR_CALL_FLASH_CLASS);
    const pending = flashTimers.get(el);
    if (pending) window.clearTimeout(pending);
    // ~400 ms of smooth scroll, then the full 1.5 s in view.
    flashTimers.set(
      el,
      window.setTimeout(() => {
        el.classList.remove(YOUR_CALL_FLASH_CLASS);
        flashTimers.delete(el);
      }, YOUR_CALL_FLASH_MS + 400),
    );
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

/**
 * Style-guide only: static replica of the site toast as sonner renders it in
 * production (measured on the preview build 2026-11-18): page-coloured body,
 * 1px border, 8px radius, 16px padding, filled white check, 13px/500 title,
 * 12px muted description, action button = near-white fill, black 12px text,
 * 24px high, 4px radius.
 */
export const PlacedToastBody = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex w-[356px] max-w-full items-center gap-1.5 rounded-lg border border-border bg-background p-4 shadow-lg">
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-foreground" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      />
    </svg>
    <div className="min-w-0 flex-1">
      <div className="text-[13px] font-medium leading-snug text-foreground">{title}</div>
      {description && <div className="text-[12px] leading-snug text-muted-foreground">{description}</div>}
    </div>
    <button type="button" className="h-6 shrink-0 rounded px-2 text-[12px] text-black" style={{ background: "rgb(252,252,252)" }}>
      {placedToastActionLabel()}
    </button>
  </div>
);
