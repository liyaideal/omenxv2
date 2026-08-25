import { useState, useEffect } from "react";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Logo } from "@/components/Logo";
import { AuthContent } from "./AuthContent";
import { useAuth, type AuthStep } from "@/hooks/useAuth";
import { useAuthFlowStore } from "@/stores/useAuthFlowStore";

interface AuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthSheet = ({ open, onOpenChange }: AuthSheetProps) => {
  const { user } = useAuth();
  const setAuthFlowOpen = useAuthFlowStore((state) => state.setIsOpen);
  const [step, setStep] = useState<AuthStep>("login");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAuthFlowOpen(open);
    return () => setAuthFlowOpen(false);
  }, [open, setAuthFlowOpen]);

  // Move to wallet creation step when user logs in
  useEffect(() => {
    if (user && open) {
      setStep("createWallet");
    }
  }, [user, open]);

  const handleSuccess = () => {
    onOpenChange(false);
    setStep("login"); // Reset for next time
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep("login"); // Reset step when closing
    }
    onOpenChange(newOpen);
  };

  return (
    <MobileDrawer 
      open={open} 
      onOpenChange={handleOpenChange}
      height="max-h-[85vh]"
      hideCloseButton
    >
      {/* a11y: Radix requires a Title inside the sheet content. Visually hidden — zero visual change. */}
      <VisuallyHidden>
        <SheetTitle>Sign in</SheetTitle>
      </VisuallyHidden>

      {/* Logo header */}
      <div className="flex justify-center mb-4">
        <Logo size="lg" />
      </div>

      <div className="overflow-y-auto">
        <AuthContent
          step={step}
          setStep={setStep}
          onSuccess={handleSuccess}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          variant="mobile"
        />
      </div>
    </MobileDrawer>
  );
};
