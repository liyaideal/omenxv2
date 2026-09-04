import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Logo } from "@/components/Logo";
import { AuthContent } from "./AuthContent";
import { useAuth, type AuthStep } from "@/hooks/useAuth";
import { useAuthFlowStore } from "@/stores/useAuthFlowStore";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "signin" | "signup";
  /** style-guide 专用：锁定初始 step，并跳过 user 登录态驱动的 step 切换。不传 = 生产行为逐字不变。 */
  previewStep?: AuthStep;
  /** style-guide 专用：透传给 AuthContent 的纯展示 fixture。不传 = 生产行为逐字不变。 */
  previewFixture?: React.ComponentProps<typeof AuthContent>["fixture"] & { isLoading?: boolean };
}

export const AuthDialog = ({ open, onOpenChange, defaultTab = "signin", previewStep, previewFixture }: AuthDialogProps) => {
  const { user } = useAuth();
  const setAuthFlowOpen = useAuthFlowStore((state) => state.setIsOpen);
  // "signup" and "signin" both start at login step (auth flow is unified)
  const [step, setStep] = useState<AuthStep>(previewStep ?? "login");
  const [isLoading, setIsLoading] = useState(previewFixture?.isLoading ?? false);

  useEffect(() => {
    setAuthFlowOpen(open);
    return () => setAuthFlowOpen(false);
  }, [open, setAuthFlowOpen]);

  // Close dialog when user logs in
  useEffect(() => {
    if (previewStep) return;
    if (user && open) {
      // User just logged in, move to wallet creation step
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-[16px] border border-[#23262D] bg-gradient-to-b from-[#012A35] from-[12.85%] via-[#0A0B0D] via-[21%] to-[#0A0B0D] overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Sign In</DialogTitle>
        </VisuallyHidden>

        <div className="p-[24px]">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <Logo size="lg" />
          </div>


          <AuthContent
            step={step}
            setStep={setStep}
            onSuccess={handleSuccess}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            variant="desktop"
            fixture={previewFixture}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
