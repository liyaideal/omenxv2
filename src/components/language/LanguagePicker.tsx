import { useState } from "react";
import { Check, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileDrawer, MobileDrawerList } from "@/components/ui/mobile-drawer";
import { useLanguage } from "@/hooks/useLanguage";
import { SITE_LANGUAGES, getLanguage, type LanguageCode } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { tIn, loadLanguage } from "@/i18n";

/**
 * Language picker — the ONE set of pieces every language entry point uses
 * (CPO 2026-09-28, docs/delivery/language-entry-v1.md R1–R6):
 *
 *   LanguageChip        desktop header, both signed-in and guest (R1)
 *   LanguageIconButton  mobile brand bar right slot → LanguageDrawer (R3)
 *   LanguageDrawer      bottom sheet list; also used by the Me drawer row (R4)
 *                       and Settings › Preferences on mobile
 *   LanguageMenuItems   dropdown rows; also used by Settings › Preferences
 *                       on desktop
 *   useLanguagePick     pick = save + toast, shared by all of the above (R5)
 *
 * List form (R6): muted 2-letter code · language's own name · ✓ on the
 * current row. The chip shows only the code so "Tiếng Việt" never widens
 * the header. Data + storage live in src/lib/languages.ts + useLanguage().
 */

export type LanguagePickResult = { success: boolean; error?: string };

/** Style-guide only: drive the picker without touching profile/localStorage. */
export interface LanguagePreviewProps {
  previewCode?: LanguageCode;
  previewOpen?: boolean;
}

export const useLanguagePick = (preview?: LanguagePreviewProps) => {
  const isPreview = preview?.previewCode !== undefined || preview?.previewOpen !== undefined;
  const live = useLanguage();
  const [localCode, setLocalCode] = useState<LanguageCode>(preview?.previewCode ?? "en");
  const code = isPreview ? localCode : live.code;

  const pick = async (next: LanguageCode): Promise<LanguagePickResult> => {
    if (next === code) return { success: true };
    const label = getLanguage(next).label;
    await loadLanguage(next); // so the toast itself is already in the new language
    if (isPreview) {
      setLocalCode(next);
      toast.success(tIn(next, "language.set", { label }));
      return { success: true };
    }
    const res = await live.setLanguage(next);
    if (res.success) toast.success(tIn(next, "language.set", { label }));
    else toast.error(tIn(code, "language.saveFailed"));
    return res;
  };

  return { code, current: getLanguage(code), pick, isPreview };
};

/* ---------------- dropdown rows (desktop) ---------------- */

export const LanguageMenuItems = ({
  current,
  onPick,
}: {
  current: LanguageCode;
  onPick: (code: LanguageCode) => void;
}) => (
  <>
    {SITE_LANGUAGES.map((l) => (
      <DropdownMenuItem
        key={l.code}
        onSelect={() => onPick(l.code)}
        className={cn("gap-2", l.code === current && "bg-muted")}
      >
        <span className="w-6 font-mono text-[11px] text-muted-foreground">{l.short}</span>
        <span className="flex-1">{l.label}</span>
        <Check className={cn("h-4 w-4 text-primary", l.code !== current && "opacity-0")} />
      </DropdownMenuItem>
    ))}
  </>
);

/* ---------------- bottom sheet (mobile) ---------------- */

export const LanguageDrawer = ({
  open,
  onOpenChange,
  current,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: LanguageCode;
  onPick: (code: LanguageCode) => void;
}) => (
  <MobileDrawer open={open} onOpenChange={onOpenChange} title={tIn(current, "nav.language")}>
    <MobileDrawerList>
      {SITE_LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => onPick(l.code)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium hover:bg-muted/50 transition-colors",
            l.code === current && "bg-muted/40",
          )}
        >
          <span className="w-6 font-mono text-[11px] text-muted-foreground">{l.short}</span>
          <span className="flex-1">{l.label}</span>
          {l.code === current && <Check className="w-4 h-4 text-primary" />}
        </button>
      ))}
    </MobileDrawerList>
  </MobileDrawer>
);

/* ---------------- desktop header chip (R1) ---------------- */

export const LanguageChip = ({ className, ...preview }: { className?: string } & LanguagePreviewProps) => {
  const { code, current, pick } = useLanguagePick(preview);
  const [open, setOpen] = useState(!!preview.previewOpen);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Language: ${current.label}`}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
            className,
          )}
        >
          <Globe className="h-4 w-4" />
          <span>{current.short}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <LanguageMenuItems
          current={code}
          onPick={(c) => {
            setOpen(false);
            void pick(c);
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/* ---------------- mobile brand-bar icon (R3) ---------------- */

export const LanguageIconButton = ({ className, ...preview }: { className?: string } & LanguagePreviewProps) => {
  const { code, pick } = useLanguagePick(preview);
  const [open, setOpen] = useState(!!preview.previewOpen);
  return (
    <>
      <button
        type="button"
        aria-label="Language"
        onClick={() => setOpen(true)}
        className={cn(
          "h-9 w-9 -mr-2 flex items-center justify-center text-muted-foreground active:scale-95 transition-transform duration-200",
          className,
        )}
      >
        <Globe className="w-5 h-5" strokeWidth={1.5} />
      </button>
      <LanguageDrawer
        open={open}
        onOpenChange={setOpen}
        current={code}
        onPick={(c) => {
          setOpen(false);
          void pick(c);
        }}
      />
    </>
  );
};
