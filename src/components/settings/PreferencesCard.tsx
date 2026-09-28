import { useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LanguageCode } from "@/lib/languages";
import {
  LanguageDrawer,
  LanguageMenuItems,
  useLanguagePick,
} from "@/components/language/LanguagePicker";
import { SettingsCard, SettingsRow } from "./SettingsCard";

/**
 * Settings › Preferences (CPO 2026-09-22 rules 14–15, mock v5 §1 / 4.11).
 * One row this batch: Language. Desktop = chip (outline sm, shows the
 * language's own name) + the shared dropdown list; mobile = the chip opens
 * the shared LanguageDrawer. Pick = save + toast via useLanguagePick — the
 * same list, storage and toast as the header chip / brand-bar globe / Me
 * drawer row (language-entry-v1 R6, 2026-09-28). This is the secondary
 * entry; the header is the primary one. Page copy is not translated in
 * Lovable.
 */
export const PreferencesCard = ({
  previewCode,
  previewOpen,
}: {
  /** Style-guide only: show this language as current. Never set in product. */
  previewCode?: LanguageCode;
  /** Style-guide only: render the picker open. Never set in product. */
  previewOpen?: boolean;
} = {}) => {
  const isMobile = useIsMobile();
  const { code, current, pick } = useLanguagePick({ previewCode, previewOpen });
  const [open, setOpen] = useState(!!previewOpen);

  const onPick = (next: LanguageCode) => {
    setOpen(false);
    void pick(next);
  };

  const chip = (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 pr-2.5" onClick={isMobile ? () => setOpen(true) : undefined}>
      {current.label}
      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
    </Button>
  );

  return (
    <SettingsCard label="Preferences" compact={isMobile}>
      <SettingsRow
        icon={Globe}
        title="Language"
        sub="Also changes the language of emails we send you"
        last
        right={
          isMobile ? (
            chip
          ) : (
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>{chip}</DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <LanguageMenuItems current={code} onPick={onPick} />
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />

      {isMobile && <LanguageDrawer open={open} onOpenChange={setOpen} current={code} onPick={onPick} />}
    </SettingsCard>
  );
};
