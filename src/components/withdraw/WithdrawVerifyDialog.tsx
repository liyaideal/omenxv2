import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Smartphone, Shield, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MobileDrawer,
  MobileDrawerSection,
  MobileDrawerActions,
} from "@/components/ui/mobile-drawer";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  formatTotpSecret,
  generateDemoTotpSecret,
  verifyDemoOtp,
} from "@/lib/demoOtp";

type StepKind = "bind_email" | "email_otp" | "bind_totp" | "totp";

interface WithdrawVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called once all required steps pass. Parent should then submit the withdrawal. */
  onVerified: () => void | Promise<void>;
}

/**
 * Multi-step verification dialog for withdrawals.
 * Steps are derived from profile.withdraw_2fa_mode + bound state of email/TOTP.
 */
export const WithdrawVerifyDialog = ({
  open,
  onOpenChange,
  onVerified,
}: WithdrawVerifyDialogProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { profile, email, updateEmail, enableTotp } = useUserProfile();

  const mode = (profile?.withdraw_2fa_mode as "email" | "totp" | "both") || "email";
  const totpEnabled = !!profile?.totp_enabled;
  const hasEmail = !!email;

  // Build the step queue based on mode + current bindings.
  const steps: StepKind[] = useMemo(() => {
    const list: StepKind[] = [];
    if (mode === "email" || mode === "both") {
      list.push(hasEmail ? "email_otp" : "bind_email");
    }
    if (mode === "totp" || mode === "both") {
      list.push(totpEnabled ? "totp" : "bind_totp");
    }
    return list;
  }, [mode, hasEmail, totpEnabled]);

  const [stepIdx, setStepIdx] = useState(0);
  const [code, setCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailSubStep, setEmailSubStep] = useState<"input" | "verify">("input");
  const [submitting, setSubmitting] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setCode("");
      setNewEmail("");
      setEmailSubStep("input");
      setSubmitting(false);
    }
  }, [open]);

  const totalSteps = steps.length;
  const currentStep = steps[stepIdx];
  const isLastStep = stepIdx >= totalSteps - 1;

  const goNextOrFinish = async () => {
    if (isLastStep) {
      setSubmitting(true);
      try {
        await onVerified();
        onOpenChange(false);
      } finally {
        setSubmitting(false);
      }
    } else {
      setStepIdx((i) => i + 1);
      setCode("");
      setEmailSubStep("input");
    }
  };

  // ---- Handlers per step ----

  const handleEmailOtp = async () => {
    if (!verifyDemoOtp(code)) {
      toast.error("Invalid code");
      return;
    }
    await goNextOrFinish();
  };

  const handleTotp = async () => {
    if (!verifyDemoOtp(code)) {
      toast.error("Invalid code");
      return;
    }
    await goNextOrFinish();
  };

  const handleSendBindEmailCode = () => {
    const trimmed = newEmail.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setEmailSubStep("verify");
    setCode("");
  };

  const handleConfirmBindEmail = async () => {
    if (!verifyDemoOtp(code)) {
      toast.error("Invalid code");
      return;
    }
    setSubmitting(true);
    const res = await updateEmail(newEmail.trim());
    setSubmitting(false);
    if (!res.success) {
      toast.error(res.error || "Failed to add email");
      return;
    }
    toast.success("Email verified");
    await goNextOrFinish();
  };

  // For bind_totp inside this dialog: simplified single-screen (secret + code)
  const totpSecret = useMemo(
    () => (currentStep === "bind_totp" ? generateDemoTotpSecret() : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStep, stepIdx, open]
  );

  const handleConfirmBindTotp = async () => {
    if (!verifyDemoOtp(code)) {
      toast.error("Invalid code");
      return;
    }
    setSubmitting(true);
    const res = await enableTotp(totpSecret);
    setSubmitting(false);
    if (!res.success) {
      toast.error(res.error || "Failed to enable authenticator");
      return;
    }
    toast.success("Authenticator enabled");
    await goNextOrFinish();
  };

  const goToSettings = () => {
    onOpenChange(false);
    navigate("/settings");
  };

  // ---- Content per step ----
  const renderStep = () => {
    if (!currentStep) return null;

    switch (currentStep) {
      case "email_otp":
        return (
          <OtpPanel
            icon={<Mail className="w-7 h-7 text-primary" />}
            title="Verify by email"
            description={`Enter the 6-digit code sent to ${maskEmail(email!)}`}
            code={code}
            onCodeChange={setCode}
          />
        );

      case "totp":
        return (
          <OtpPanel
            icon={<Smartphone className="w-7 h-7 text-primary" />}
            title="Verify with authenticator"
            description="Enter the 6-digit code from your authenticator app"
            code={code}
            onCodeChange={setCode}
          />
        );

      case "bind_email":
        if (emailSubStep === "input") {
          return (
            <div className="space-y-3">
              <PanelHeading
                icon={<Mail className="w-7 h-7 text-primary" />}
                title="Add email to continue"
                description="Withdrawals require email verification. Add your email below."
              />
              <Input
                type="email"
                placeholder="you@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="h-11"
              />
              <button
                onClick={goToSettings}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Manage in Settings instead
              </button>
            </div>
          );
        }
        return (
          <OtpPanel
            icon={<Mail className="w-7 h-7 text-primary" />}
            title="Verify your email"
            description={`Enter the 6-digit code sent to ${newEmail}`}
            code={code}
            onCodeChange={setCode}
            footer={
              <button
                onClick={() => {
                  setEmailSubStep("input");
                  setCode("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Change email
              </button>
            }
          />
        );

      case "bind_totp":
        return (
          <div className="space-y-3">
            <PanelHeading
              icon={<Shield className="w-7 h-7 text-primary" />}
              title="Set up authenticator"
              description="Scan with an authenticator app, then enter the 6-digit code."
            />
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="text-xs text-muted-foreground">Secret key</div>
              <code className="block font-mono text-sm break-all">
                {formatTotpSecret(totpSecret)}
              </code>
            </div>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <button
              onClick={goToSettings}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Full setup in Settings
            </button>
          </div>
        );
    }
  };

  // ---- Primary action label / handler ----
  const primary = (() => {
    if (!currentStep) return { label: "Continue", disabled: true, onClick: () => {} };
    const finishLabel = isLastStep ? "Confirm withdrawal" : "Continue";
    switch (currentStep) {
      case "email_otp":
        return {
          label: finishLabel,
          disabled: code.length !== 6 || submitting,
          onClick: handleEmailOtp,
        };
      case "totp":
        return {
          label: finishLabel,
          disabled: code.length !== 6 || submitting,
          onClick: handleTotp,
        };
      case "bind_email":
        return emailSubStep === "input"
          ? {
              label: "Send code",
              disabled: !newEmail.trim() || submitting,
              onClick: handleSendBindEmailCode,
            }
          : {
              label: isLastStep ? "Confirm withdrawal" : "Verify & continue",
              disabled: code.length !== 6 || submitting,
              onClick: handleConfirmBindEmail,
            };
      case "bind_totp":
        return {
          label: isLastStep ? "Confirm withdrawal" : "Enable & continue",
          disabled: code.length !== 6 || submitting,
          onClick: handleConfirmBindTotp,
        };
    }
  })();

  const stepPrefix = totalSteps > 1 ? `Step ${stepIdx + 1} of ${totalSteps} · ` : "";
  const subtitle = `${stepPrefix}Confirm it's you before sending funds off-platform.`;

  if (!open || totalSteps === 0) {
    // Edge case: no steps required (shouldn't happen, but allow safe close)
  }

  // ---- Mobile ----
  if (isMobile) {
    return (
      <MobileDrawer
        open={open}
        onOpenChange={onOpenChange}
        title="Verify withdrawal"
      >
        <MobileDrawerSection>
          <p className="text-xs text-muted-foreground -mt-1 mb-3">{subtitle}</p>
          {renderStep()}
        </MobileDrawerSection>
        <MobileDrawerActions>
          <Button
            onClick={primary.onClick}
            disabled={primary.disabled}
            className="w-full h-11"
          >
            {primary.label}
            {!isLastStep && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full h-11"
          >
            Cancel
          </Button>
        </MobileDrawerActions>
      </MobileDrawer>
    );
  }

  // ---- Desktop ----
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <Shield className="w-5 h-5 text-primary" />
            Verify withdrawal
          </DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">{renderStep()}</div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={primary.onClick} disabled={primary.disabled}>
            {primary.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---- Subcomponents ----

const PanelHeading = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="text-center py-2">
    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
      {icon}
    </div>
    <div className="text-sm font-medium">{title}</div>
    <p className="text-xs text-muted-foreground mt-1">{description}</p>
  </div>
);

const OtpPanel = ({
  icon,
  title,
  description,
  code,
  onCodeChange,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  code: string;
  onCodeChange: (v: string) => void;
  footer?: React.ReactNode;
}) => (
  <div className="space-y-3">
    <PanelHeading icon={icon} title={title} description={description} />
    <div className="flex justify-center">
      <InputOTP maxLength={6} value={code} onChange={onCodeChange}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
    {footer && <div className="text-center">{footer}</div>}
  </div>
);

const maskEmail = (e: string) => {
  const [local, domain] = e.split("@");
  if (!domain) return e;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
};
