import { SeoFooter } from "@/components/seo/SeoFooter";

/* ---------------- Footer · Telegram entry (footer-telegram-v1, 2026-11-04) ---------------- */

/** FT-TG1 · production footer at rest — X · Discord · Telegram (desktop layout ≥ md, mobile layout in the 375 frame). */
export const FooterTelegramDefaultPreview = () => <SeoFooter />;

/**
 * FT-TG2 · desktop dropdown open, site language zh-CN → the ZH row is filled.
 * The top spacing is only room for the menu to open upward, as it does at the bottom of a real page.
 */
export const FooterTelegramMenuOpenPreview = () => (
  <div className="pt-56">
    <SeoFooter telegramPreview={{ open: "menu", code: "zh-CN" }} />
  </div>
);

/** FT-TG3 · mobile bottom drawer open, site language ru → the RU row is filled. */
export const FooterTelegramDrawerOpenPreview = () => (
  <SeoFooter telegramPreview={{ open: "drawer", code: "ru" }} />
);
