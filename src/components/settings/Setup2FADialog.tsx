import { useEffect, useMemo, useState } from "react";
import { Copy, Check, ShieldCheck, Smartphone } from "lucide-react";
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  DEMO_OTP_HINT,
  formatTotpSecret,
  generateDemoTotpSecret,
  verifyDemoOtp,
} from "@/lib/demoOtp";

interface Setup2FADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the generated secret when setup completes successfully */
  onSuccess: (secret: string) => void | Promise<void>;
}

/**
 * Demo Authenticator (TOTP) setup flow.
 * Step 1: Show QR placeholder + secret to copy.
 * Step 2: User enters 6-digit code; accepts 111111.
 */
export const Setup2FADialog = ({ open, onOpenChange, onSuccess }: Setup2FADialogProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<"qr" | "verify">("qr");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Generate a fresh secret each time the dialog opens
  const secret = useMemo(() => (open ? generateDemoTotpSecret() : ""), [open]);

  useEffect(() => {
    if (!open) {
      setStep("qr");
      setCode("");
      setCopied(false);
      setSubmitting(false);
    }
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleConfirm = async () => {
    if (!verifyDemoOtp(code)) {
      toast.error("Invalid code");
      return;
    }
    setSubmitting(true);
    try {
      await onSuccess(secret);
      toast.success("Authenticator enabled");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to enable");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Step content (shared between Dialog and MobileDrawer) ----
  const qrContent = (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{DEMO_OTP_HINT}</p>

      <div className="rounded-lg border bg-muted/30 p-4 flex items-center justify-center">
        <QrPlaceholder />
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        <div className="text-xs text-muted-foreground">Or enter this key manually</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-sm break-all">
            {formatTotpSecret(secret)}
          </code>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 shrink-0"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground leading-relaxed">
        Scan the QR code with an authenticator app (e.g. Google Authenticator, Authy),
        then continue to enter the 6-digit code.
      </div>
    </div>
  );

  const verifyContent = (
    <div className="space-y-4">
      <div className="text-center py-2">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
          <Smartphone className="w-7 h-7 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app
        </p>
        <p className="text-xs text-muted-foreground mt-1">{DEMO_OTP_HINT}</p>
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
    </div>
  );

  // ---- Mobile ----
  if (isMobile) {
    return (
      <MobileDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={step === "qr" ? "Set up authenticator" : "Verify authenticator"}
      >
        <MobileDrawerSection>{step === "qr" ? qrContent : verifyContent}</MobileDrawerSection>
        <MobileDrawerActions>
          {step === "qr" ? (
            <>
              <Button onClick={() => setStep("verify")} className="w-full h-11">
                Continue
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full h-11"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleConfirm}
                disabled={code.length !== 6 || submitting}
                className="w-full h-11"
              >
                {submitting ? "Enabling..." : "Enable"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("qr")}
                className="w-full h-11"
              >
                Back
              </Button>
            </>
          )}
        </MobileDrawerActions>
      </MobileDrawer>
    );
  }

  // ---- Desktop ----
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {step === "qr" ? "Set up authenticator" : "Verify authenticator"}
          </DialogTitle>
          <DialogDescription>
            {step === "qr"
              ? "Add OmenX to an authenticator app, then verify with a 6-digit code."
              : "Enter the 6-digit code from your authenticator app to finish setup."}
          </DialogDescription>
        </DialogHeader>

        {step === "qr" ? qrContent : verifyContent}

        <DialogFooter>
          {step === "qr" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep("verify")}>Continue</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("qr")}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={code.length !== 6 || submitting}>
                {submitting ? "Enabling..." : "Enable"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** Decorative QR placeholder (not a real QR code — demo only) */
const QrPlaceholder = () => {
  // 21x21 grid like a real QR; cells are deterministic from a hash
  const cells = useMemo(() => {
    const rows: boolean[][] = [];
    for (let r = 0; r < 21; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < 21; c++) {
        // Finder patterns (corners)
        const inCorner =
          (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
        if (inCorner) {
          const lr = r < 7 ? r : r - 14;
          const lc = c < 7 ? c : c - 14;
          const isFrame = lr === 0 || lr === 6 || lc === 0 || lc === 6;
          const isCenter = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
          row.push(isFrame || isCenter);
        } else {
          // Pseudo-random pattern
          row.push(((r * 31 + c * 17 + r * c) % 5) < 2);
        }
      }
      rows.push(row);
    }
    return rows;
  }, []);

  return (
    <svg viewBox="0 0 21 21" className="w-40 h-40 text-foreground">
      <rect width="21" height="21" fill="hsl(var(--background))" />
      {cells.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="currentColor" /> : null
        )
      )}
    </svg>
  );
};
