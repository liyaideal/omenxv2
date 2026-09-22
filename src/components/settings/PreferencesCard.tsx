import { useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileDrawer, MobileDrawerList } from "@/components/ui/mobile-drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { SITE_LANGUAGES, getLanguage, type LanguageCode } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { SettingsCard, SettingsRow } from "./SettingsCard";

/**
 * Settings › Preferences (new, CPO 2026-09-22 rules 14–15, mock v5 §1 / 4.11).
 * One row this batch: Language. Desktop = chip (outline sm) + dropdown with
 * the 7 languages, current ticked; mobile = the chip opens a MobileDrawer
 * list. Pick = save (`profiles.language`) + toast. Shares list + storage
 * with the header switcher through `useLanguage`. Page copy is not
 * translated in the blueprint.
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
  const { code, setLanguage } = useLanguage();
  const preview = previewCode !== undefined || previewOpen !== undefined;
  const [localCode, setLocalCode] = useState<LanguageCode>(previewCode ?? "en");
  const current = getLanguage(preview ? localCode : code);
  const [open, setOpen] = useState(!!previewOpen);

  const pick = async (next: LanguageCode) => {
    setOpen(false);
    if (next === current.code) return;
    const label = getLanguage(next).label;
    if (preview) {
      setLocalCode(next);
      toast.success(`Language set to ${label}`);
      return;
    }
    const res = await setLanguage(next);
    if (res.success) toast.success(`Language set to ${label}`);
    else toast.error("Couldn't save that. Try again.");
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
                {SITE_LANGUAGES.map((l) => (
                  <DropdownMenuItem key={l.code} onSelect={() => pick(l.code)} className="justify-between">
                    <span>{l.label}</span>
                    <Check className={cn("w-4 h-4 text-primary", l.code !== current.code && "opacity-0")} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />

      {isMobile && (
        <MobileDrawer open={open} onOpenChange={setOpen} title="Language">
          <MobileDrawerList>
            {SITE_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => pick(l.code)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-medium hover:bg-muted/50 transition-colors",
                  l.code === current.code && "bg-muted/40",
                )}
              >
                <span>{l.label}</span>
                {l.code === current.code && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </MobileDrawerList>
        </MobileDrawer>
      )}
    </SettingsCard>
  );
};
