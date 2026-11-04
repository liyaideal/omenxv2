// ============================================================
// AuthPromptHost — the one listener for useAuthFlowStore.openPrompt().
// Mounted once in App (and in style-guide frames that exercise it).
// Opens the standard sign-in, unchanged: AuthDialog on desktop, AuthSheet
// (bottom drawer) on mobile. CPO 2026-11-04: no per-feature headline.
// ============================================================
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthFlowStore } from "@/stores/useAuthFlowStore";
import { AuthDialog } from "./AuthDialog";
import { AuthSheet } from "./AuthSheet";

export const AuthPromptHost = () => {
  const isMobile = useIsMobile();
  const open = useAuthFlowStore((s) => s.promptOpen);
  const closePrompt = useAuthFlowStore((s) => s.closePrompt);
  const onOpenChange = (next: boolean) => {
    if (!next) closePrompt();
  };
  return isMobile ? (
    <AuthSheet open={open} onOpenChange={onOpenChange} />
  ) : (
    <AuthDialog open={open} onOpenChange={onOpenChange} />
  );
};

export default AuthPromptHost;
