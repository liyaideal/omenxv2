import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileDrawer, MobileDrawerList } from "@/components/ui/mobile-drawer";
import { useT } from "@/i18n";
import type { LanguageCode } from "@/lib/languages";
import { cn } from "@/lib/utils";

/**
 * Footer Telegram entry (CPO 2026-11-04, footer-telegram-v1 R1–R9).
 *
 *   R1  sits last in the footer social row: X · Discord · Telegram
 *   R2  monochrome paper plane in the same 34px outline pill as X / Discord
 *   R3  desktop: 220px dropdown above the pill (flips down when there is no
 *       room); outside click / Esc closes; pill keeps an "open" look meanwhile
 *   R4  mobile: MobileDrawer, title + one-line description, list only — no
 *       footer buttons (pure-selection drawer, DESIGN §5)
 *   R5  four groups, fixed order, each in its own language
 *   R6  every row is a real <a>, opens the group in a new tab and closes
 *   R7  the row matching the site language gets a fill (no ✓, order unchanged)
 *   R8  only the title + description are translated; group names are not
 *
 * The list itself lives here once; SeoFooter mounts `variant="menu"` in its
 * desktop layout and `variant="drawer"` in its mobile layout.
 */

export type TelegramGroupId = "en" | "zh" | "ru" | "vi";

export const TELEGRAM_GROUPS: {
  id: TelegramGroupId;
  short: string;
  label: string;
  region?: string;
  href: string;
}[] = [
  { id: "en", short: "EN", label: "English", region: "Global", href: "https://t.me/omenx_news" },
  { id: "zh", short: "ZH", label: "中文", href: "https://t.me/+hcIqv6toxwdhY2Fh" },
  { id: "ru", short: "RU", label: "Русский", region: "CIS", href: "https://t.me/omenx_news_ru" },
  { id: "vi", short: "VI", label: "Tiếng Việt", href: "https://t.me/omenxvietnam" },
];

/** R7 — which group the site language points at. Languages without a group of their own → Global. */
export const suggestedTelegramGroup = (code: LanguageCode): TelegramGroupId => {
  if (code === "zh-CN" || code === "zh-TW") return "zh";
  if (code === "ru") return "ru";
  if (code === "vi") return "vi";
  return "en";
};

/** Monochrome paper plane (the plane from TelegramIcon, without its blue disc). */
export const TelegramGlyph = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="4.6 6.8 14.8 12.4" className={cn("fill-current", className)} aria-hidden="true">
    <path d="M5.43 11.87c2.65-1.15 4.42-1.91 5.3-2.28 2.52-1.05 3.05-1.23 3.39-1.24.08 0 .25.02.36.12.09.08.12.19.13.27.01.08.03.25.01.39-.17 1.82-.92 6.24-1.3 8.28-.16.86-.48 1.15-.79 1.18-.67.06-1.18-.44-1.83-.87-.01 0-.02-.01-.03-.02l-2.62-1.72c-.72-.47-.25-.73.17-1.15.12-.11 2.09-1.92 2.13-2.08.01-.02.01-.1-.04-.14-.05-.04-.12-.03-.17-.02-.07.02-1.24.79-3.5 2.32-.33.23-.63.34-.9.33-.3 0-.86-.17-1.29-.31-.52-.17-.93-.26-.89-.55.02-.15.22-.31.6-.47z" />
  </svg>
);

/** Style-guide only: render the list open and/or as if the site were in another language. */
export interface TelegramPreviewProps {
  previewOpen?: boolean;
  previewCode?: LanguageCode;
}

/** Open look for the pill (R3) — layered on the footer's SOCIAL_CLASS. */
const PILL_OPEN = "text-foreground border-border bg-muted/40";

export const TelegramGroupsMenu = ({
  variant,
  pillClassName,
  previewOpen,
  previewCode,
}: {
  variant: "menu" | "drawer";
  /** the footer's shared social pill class */
  pillClassName: string;
} & TelegramPreviewProps) => {
  const { t, code: siteCode } = useT();
  const [open, setOpen] = useState(!!previewOpen);
  const suggested = suggestedTelegramGroup(previewCode ?? siteCode);
  const title = t("legal.footer.telegram.title");

  if (variant === "menu") {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="Telegram" className={cn(pillClassName, open && PILL_OPEN)}>
            <TelegramGlyph />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[220px]">
          <DropdownMenuLabel className="pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.10em] text-muted-foreground">
            {title}
          </DropdownMenuLabel>
          {TELEGRAM_GROUPS.map((g) => (
            <DropdownMenuItem key={g.id} asChild className={cn("gap-2 cursor-pointer", g.id === suggested && "bg-muted")}>
              <a href={g.href} target="_blank" rel="noopener noreferrer" data-telegram-group={g.id}>
                <span className="w-6 font-mono text-[11px] text-muted-foreground">{g.short}</span>
                <span className="flex-1">{g.label}</span>
                {g.region && <span className="text-[11px] text-muted-foreground">{g.region}</span>}
                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Telegram"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(pillClassName, open && PILL_OPEN)}
      >
        <TelegramGlyph />
      </button>
      <MobileDrawer
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={t("legal.footer.telegram.description")}
      >
        <MobileDrawerList>
          {TELEGRAM_GROUPS.map((g) => (
            <a
              key={g.id}
              href={g.href}
              target="_blank"
              rel="noopener noreferrer"
              data-telegram-group={g.id}
              onClick={() => setOpen(false)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium hover:bg-muted/50 active:bg-muted transition-colors",
                g.id === suggested && "bg-muted/40",
              )}
            >
              <span className="w-6 font-mono text-[11px] text-muted-foreground">{g.short}</span>
              <span className="flex-1">{g.label}</span>
              {g.region && <span className="text-xs text-muted-foreground">{g.region}</span>}
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </a>
          ))}
        </MobileDrawerList>
      </MobileDrawer>
    </>
  );
};
