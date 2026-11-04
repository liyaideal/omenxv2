// ============================================================
// AuthPromptHost — the one listener for useAuthFlowStore.openPrompt().
// Mounted once in App (and in style-guide frames that exercise it).
// Opens the standard sign-in, unchanged: AuthDialog on desktop, AuthSheet
// (bottom drawer) on mobile. CPO 2026-11-04: no per-feature headline.
// ============================================================
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AuthStep } from "@/hooks/useAuth";
import { useAuthFlowStore } from "@/stores/useAuthFlowStore";
import { AuthDialog } from "./AuthDialog";
import { AuthSheet } from "./AuthSheet";

export const AuthPromptHost = ({
  previewStep,
}: {
  /** Style-guide only: lock the step so a signed-in viewer still sees the login step. Not passed in production. */
  previewStep?: AuthStep;
} = {}) => {
  const isMobile = useIsMobile();
  const open = useAuthFlowStore((s) => s.promptOpen);
  const closePrompt = useAuthFlowStore((s) => s.closePrompt);
  const { pathname } = useLocation();
  // Style-guide frames mount their own host (with previewStep) — the app-level
  // one must not open a second dialog behind it.
  if (!previewStep && pathname.startsWith("/style-guide/preview")) return null;
  const onOpenChange = (next: boolean) => {
    if (!next) closePrompt();
  };
  return isMobile ? (
    <AuthSheet open={open} onOpenChange={onOpenChange} previewStep={previewStep} />
  ) : (
    <AuthDialog open={open} onOpenChange={onOpenChange} previewStep={previewStep} />
  );
};

export default AuthPromptHost;
