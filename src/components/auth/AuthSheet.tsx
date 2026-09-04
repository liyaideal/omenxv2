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
  /** style-guide 专用：锁定初始 step，并跳过 user 登录态驱动的 step 切换。不传 = 生产行为逐字不变。 */
  previewStep?: AuthStep;
  /** style-guide 专用：透传给 AuthContent 的纯展示 fixture。不传 = 生产行为逐字不变。 */
  previewFixture?: React.ComponentProps<typeof AuthContent>["fixture"] & { isLoading?: boolean };
}

export const AuthSheet = ({ open, onOpenChange, previewStep, previewFixture }: AuthSheetProps) => {
  const { user } = useAuth();
  const setAuthFlowOpen = useAuthFlowStore((state) => state.setIsOpen);
  const [step, setStep] = useState<AuthStep>(previewStep ?? "login");
  const [isLoading, setIsLoading] = useState(previewFixture?.isLoading ?? false);

  useEffect(() => {
    setAuthFlowOpen(open);
    return () => setAuthFlowOpen(false);
  }, [open, setAuthFlowOpen]);

  // Move to wallet creation step when user logs in
  useEffect(() => {
    if (previewStep) return;
    if (user && open) {
      setStep("createWallet");
    }
  }, [user, open, previewStep]);

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
          fixture={previewFixture}
        />
      </div>
    </MobileDrawer>
  );
};
