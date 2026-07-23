import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { verifyDemoOtp } from "@/lib/demoOtp";
import {
  ALL_SCOPES,
  useApiKeys,
  type ApiScope,
  type ApiTier,
  type TierEligibility,
} from "@/hooks/useApiKeys";
import { StepIndicator, STEP_TITLES, type WizardStep } from "./StepIndicator";
import { Step1, Step2, Step3, Step4Secret } from "./CreateKeySteps";
import { isValidIp } from "./tierMeta";

export const CreateKeyFlow = ({
  open,
  onOpenChange,
  onCreated,
  newSecret,
  tiers,
  createKey,
  isMobile,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (secret: string) => void;
  newSecret: string | null;
  tiers: TierEligibility[];
  createKey: ReturnType<typeof useApiKeys>["createKey"];
  isMobile: boolean;
}) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [label, setLabel] = useState("");
  const [tier, setTier] = useState<ApiTier>("read_only");
  const [scopes, setScopes] = useState<ApiScope[]>(["read_public"]);
  const [ipRaw, setIpRaw] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setStep(1);
    setLabel("");
    setTier("read_only");
    setScopes(["read_public"]);
    setIpRaw("");
    setOtp("");
    setOtpError(null);
    setCopied(false);
  };

  const ipList = useMemo(
    () =>
      ipRaw
        .split(/[,\n\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [ipRaw],
  );
  const ipInvalid = ipList.filter((ip) => !isValidIp(ip));
  const requiresIp = scopes.some((s) => ALL_SCOPES.find((x) => x.id === s)?.requiresIp);
  const availableScopes = ALL_SCOPES.filter((s) =>
    tier === "read_only" ? !s.requiresIp : true,
  );
  const tierEntries = tiers.filter((t) => t.tier !== "pro_mm");

  const canNext1 = label.trim().length >= 2 && (tiers.find((t) => t.tier === tier)?.eligible ?? false);
  const canNext2 = scopes.length > 0 && (!requiresIp || (ipList.length > 0 && ipInvalid.length === 0));
  const canSubmit3 = /^\d{6}$/.test(otp.trim());

  const handleClose = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(reset, 200);
  };

  const handleVerifyAndCreate = async () => {
    if (!verifyDemoOtp(otp)) {
      setOtpError("Invalid code. Try again.");
      return;
    }
    setOtpError(null);
    try {
      const res = await createKey.mutateAsync({
        label: label.trim(),
        tier,
        scopes,
        ip_whitelist: ipList,
      });
      onCreated(res.secret);
      setStep(4);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create key");
    }
  };

  const title = step === 4 ? "API key created" : "Create API key";
  const description =
    step === 1
      ? "Choose a label and tier for this key."
      : step === 2
      ? "Select scopes and configure IP whitelist."
      : step === 3
      ? "Verify with your 2FA code to generate the key."
      : "Copy the secret now — it will not be shown again.";

  const body = (
    <div className="space-y-4">
      <StepIndicator current={step} titles={STEP_TITLES} />

      {step === 1 && (
        <Step1
          label={label}
          setLabel={setLabel}
          tier={tier}
          setTier={setTier}
          tierEntries={tierEntries}
        />
      )}
      {step === 2 && (
        <Step2
          scopes={scopes}
          setScopes={setScopes}
          availableScopes={availableScopes}
          requiresIp={requiresIp}
          ipRaw={ipRaw}
          setIpRaw={setIpRaw}
          ipInvalid={ipInvalid}
        />
      )}
      {step === 3 && (
        <Step3
          otp={otp}
          setOtp={(v) => {
            setOtp(v);
            setOtpError(null);
          }}
          otpError={otpError}
        />
      )}
      {step === 4 && newSecret && (
        <Step4Secret
          secret={newSecret}
          copied={copied}
          onCopy={() => {
            navigator.clipboard.writeText(newSecret);
            setCopied(true);
            toast.success("Secret copied");
          }}
        />
      )}
    </div>
  );

  const actions = (
    <>
      {step === 1 && (
        <>
          <Button variant="outline" onClick={() => handleClose(false)} className="h-11 md:h-10">
            Cancel
          </Button>
          <Button disabled={!canNext1} onClick={() => setStep(2)} className="h-11 md:h-10">
            Next
          </Button>
        </>
      )}
      {step === 2 && (
        <>
          <Button variant="outline" onClick={() => setStep(1)} className="h-11 md:h-10">
            Back
          </Button>
          <Button disabled={!canNext2} onClick={() => setStep(3)} className="h-11 md:h-10">
            Next
          </Button>
        </>
      )}
      {step === 3 && (
        <>
          <Button variant="outline" onClick={() => setStep(2)} disabled={createKey.isPending} className="h-11 md:h-10">
            Back
          </Button>
          <Button
            disabled={!canSubmit3 || createKey.isPending}
            onClick={handleVerifyAndCreate}
            className="h-11 md:h-10"
          >
            {createKey.isPending ? "Creating…" : "Verify & create"}
          </Button>
        </>
      )}
      {step === 4 && (
        <Button className="w-full h-11 md:h-10" onClick={() => handleClose(false)}>
          Done
        </Button>
      )}
    </>
  );

  if (isMobile) {
    return (
      <MobileDrawer open={open} onOpenChange={handleClose} title={title} description={description}>
        <MobileDrawerSection>{body}</MobileDrawerSection>
        <MobileDrawerActions>{actions}</MobileDrawerActions>
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
        <DialogFooter className="gap-2">{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
