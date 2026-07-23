import { X, AlertTriangle, ShieldCheck, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ALL_SCOPES, type ApiScope, type ApiTier, type TierEligibility } from "@/hooks/useApiKeys";
import { DEMO_OTP_HINT } from "@/lib/demoOtp";
import { TIER_META } from "./tierMeta";

export const Step1 = ({
  label,
  setLabel,
  tier,
  setTier,
  tierEntries,
}: {
  label: string;
  setLabel: (s: string) => void;
  tier: ApiTier;
  setTier: (t: ApiTier) => void;
  tierEntries: TierEligibility[];
}) => (
  <div className="space-y-4">
    <div className="space-y-1.5">
      <Label htmlFor="key-label" className="text-sm font-medium">
        Label
      </Label>
      <Input
        id="key-label"
        placeholder="e.g. Trading bot – prod"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={64}
      />
    </div>
    <div className="space-y-2">
      <Label className="text-sm font-medium">Tier</Label>
      <div className="space-y-2">
        {tierEntries.map((t) => {
          const meta = TIER_META[t.tier];
          const Icon = meta.icon;
          const selected = tier === t.tier;
          const disabled = !t.eligible;
          return (
            <button
              key={t.tier}
              type="button"
              disabled={disabled}
              onClick={() => setTier(t.tier)}
              className={cn(
                "w-full text-left rounded-lg border p-3 transition-colors",
                selected && "border-primary bg-primary/[0.06]",
                !selected && !disabled && "border-border/40 hover:border-primary/50 hover:bg-muted/20",
                disabled && "border-border/40 opacity-50 cursor-not-allowed",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-4 h-4 rounded-full border shrink-0 flex items-center justify-center",
                    selected ? "border-primary" : "border-border",
                  )}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
                </span>
                <Icon className={cn("w-3.5 h-3.5", meta.accent)} />
                <span className="text-sm font-medium flex-1">{meta.label}</span>
                {disabled && (
                  <span className="text-[10px] text-muted-foreground">Requirements not met</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1 pl-6">{t.description}</div>
              {disabled && (
                <div className="mt-2 pl-6 space-y-0.5">
                  {t.requirements
                    .filter((r) => !r.met)
                    .map((r, i) => (
                      <div key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <X className="w-3 h-3" /> {r.label}
                      </div>
                    ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

export const Step2 = ({
  scopes,
  setScopes,
  availableScopes,
  requiresIp,
  ipRaw,
  setIpRaw,
  ipInvalid,
}: {
  scopes: ApiScope[];
  setScopes: (fn: (prev: ApiScope[]) => ApiScope[]) => void;
  availableScopes: typeof ALL_SCOPES;
  requiresIp: boolean;
  ipRaw: string;
  setIpRaw: (s: string) => void;
  ipInvalid: string[];
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label className="text-sm font-medium">Scopes</Label>
      <div className="rounded-lg border border-border/40 divide-y divide-border/40 overflow-hidden">
        {availableScopes.map((s) => {
          const checked = scopes.includes(s.id);
          return (
            <label
              key={s.id}
              className="flex items-start gap-3 p-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => {
                  setScopes((prev) => (v ? [...prev, s.id] : prev.filter((x) => x !== s.id)));
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono">{s.label}</code>
                  {s.requiresIp && (
                    <Badge variant="outline" className="text-[9px] py-0 h-4 bg-amber-400/10 text-amber-400 border-amber-400/20">
                      IP required
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.description}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>

    <div className="space-y-1.5">
      <Label htmlFor="ip-wl" className="text-sm font-medium">
        IP whitelist{" "}
        {requiresIp && <span className="text-amber-400 font-normal">(required for trade / private scopes)</span>}
      </Label>
      <Textarea
        id="ip-wl"
        value={ipRaw}
        onChange={(e) => setIpRaw(e.target.value)}
        placeholder="203.0.113.10, 198.51.100.0/24"
        rows={3}
        className="font-mono text-sm"
      />
      <div className="text-[11px] text-muted-foreground">Comma or newline separated. IPv4 / IPv6 / CIDR.</div>
      {ipInvalid.length > 0 && (
        <div className="text-[11px] text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Invalid: {ipInvalid.join(", ")}
        </div>
      )}
    </div>
  </div>
);

export const Step3 = ({
  otp,
  setOtp,
  otpError,
}: {
  otp: string;
  setOtp: (v: string) => void;
  otpError: string | null;
}) => (
  <div className="space-y-3">
    <div className="rounded-lg border border-border/40 bg-muted/30 p-3 flex items-start gap-2">
      <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div className="text-xs text-muted-foreground">
        Enter the 6-digit code from your authenticator app to finalize key creation.
        <span className="block text-[10px] text-muted-foreground/70 mt-1">{DEMO_OTP_HINT}</span>
      </div>
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="otp-input" className="text-sm font-medium">
        2FA code
      </Label>
      <Input
        id="otp-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="font-mono tracking-[0.4em] text-center text-lg"
      />
      {otpError && (
        <div className="text-[11px] text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {otpError}
        </div>
      )}
    </div>
  </div>
);

export const Step4Secret = ({
  secret,
  copied,
  onCopy,
}: {
  secret: string;
  copied: boolean;
  onCopy: () => void;
}) => (
  <div className="space-y-3">
    <div className="rounded-lg border border-amber-400/40 bg-amber-400/[0.06] p-3 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
      <div className="text-xs text-amber-100/90 leading-relaxed">
        <div className="font-medium text-amber-300 mb-0.5">Save this secret now.</div>
        It will never be shown again. If you lose it, you'll need to revoke the key and create a new one.
      </div>
    </div>
    <div className="rounded-lg border-2 border-primary/40 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Your API secret</div>
      <code className="block font-mono text-sm md:text-base text-foreground break-all leading-relaxed select-all">
        {secret}
      </code>
      <Button
        size="sm"
        variant={copied ? "outline" : "default"}
        className="w-full mt-3 gap-1.5 h-10"
        onClick={onCopy}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied to clipboard" : "Copy secret"}
      </Button>
    </div>
    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
      <ShieldCheck className="w-3 h-3" /> Send this secret in the{" "}
      <code className="font-mono">X-OMENX-API-KEY</code> header.
    </div>
  </div>
);
