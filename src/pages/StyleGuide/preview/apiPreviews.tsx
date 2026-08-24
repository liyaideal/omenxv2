/**
 * API / Developers preview cases.
 *
 * Extracted out of registry.tsx so the registry itself holds ONLY dynamic
 * import loaders — every preview iframe then downloads just the chunk it
 * needs instead of the whole style-guide preview module graph.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { KeyRound, Plus } from "lucide-react";
import { EmptyState, LoadingState, ErrorState } from "@/components/states";
import {
  TierTrack,
  TierQuickAnswer,
  KeysTable,
  StepIndicator,
  Step1,
  Step2,
  Step3,
  Step4Secret,
  CreateKeyFlow,
  RevokeDialog,
} from "@/components/api";
import type { ApiKey, ApiScope, ApiTier, TierEligibility } from "@/hooks/useApiKeys";
import { ALL_SCOPES, useApiKeys } from "@/hooks/useApiKeys";
import { useIsMobile } from "@/hooks/use-mobile";
import { TiersStepperMobile } from "@/components/developers/TiersStepperMobile";
import { DEVELOPERS_MOBILE_TIERS } from "@/pages/DevelopersPageMobile";

/* ---- Mock factories ---- */
export const makeTiers = (level: "ok-readonly" | "ok-trading" | "locked"): TierEligibility[] => [
  {
    tier: "read_only",
    label: "Read-only",
    description: "Market data, account & order history (read only)",
    requirements: [
      { label: "Email verified", met: true },
      { label: "2FA enabled", met: level !== "locked", hint: "Enable in Settings → Account Security" },
    ],
    eligible: level !== "locked",
  },
  {
    tier: "trading",
    label: "Trading",
    description: "Place & cancel orders, private WebSocket streams",
    requirements: [
      { label: "Read-only requirements met", met: level !== "locked" },
      { label: "At least 1 successful deposit", met: level === "ok-trading" },
      { label: "Balance ≥ 100 USDC", met: level === "ok-trading" },
      { label: "At least 1 filled trade", met: level === "ok-trading", hint: "Place any market order to unlock" },
    ],
    eligible: level === "ok-trading",
  },
  {
    tier: "pro_mm",
    label: "Pro / Market Maker",
    description: "High rate limits, colocation, MM programs — manual review",
    requirements: [
      { label: "30d volume ≥ 50,000 USDC or equity ≥ 10,000 USDC", met: false },
      { label: "Manual review required", met: false, hint: "Contact us to apply" },
    ],
    eligible: false,
    manualReview: true,
  },
];

export const mockKeys: ApiKey[] = [
  {
    id: "k1",
    user_id: "u",
    label: "Trading bot – prod",
    key_prefix: "omx_live_a1b2c3d4…f8a9",
    tier: "trading",
    scopes: ["read_public", "read_private", "trade_order", "trade_cancel", "ws_private"],
    ip_whitelist: ["203.0.113.10", "198.51.100.0/24"],
    status: "active",
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    last_used_at: new Date(Date.now() - 3600000).toISOString(),
    revoked_at: null,
  },
  {
    id: "k2",
    user_id: "u",
    label: "Read dashboard",
    key_prefix: "omx_live_e5f6g7h8…c2d1",
    tier: "read_only",
    scopes: ["read_public", "read_private"],
    ip_whitelist: [],
    status: "active",
    created_at: new Date(Date.now() - 32 * 86400000).toISOString(),
    last_used_at: null,
    revoked_at: null,
  },
  {
    id: "k3",
    user_id: "u",
    label: "Old MM script",
    key_prefix: "omx_live_i9j0k1l2…b4a5",
    tier: "pro_mm",
    scopes: ["read_public", "trade_order", "trade_cancel", "trade_conditional", "ws_private"],
    ip_whitelist: ["192.0.2.4", "192.0.2.5", "192.0.2.6", "192.0.2.7"],
    status: "revoked",
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    last_used_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    revoked_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

/* ---- Interactive wrappers ---- */
const Step1Demo = () => {
  const [label, setLabel] = useState("Trading bot – prod");
  const [tier, setTier] = useState<ApiTier>("read_only");
  return (
    <Step1
      label={label}
      setLabel={setLabel}
      tier={tier}
      setTier={setTier}
      tierEntries={makeTiers("ok-readonly").filter((t) => t.tier !== "pro_mm")}
    />
  );
};

const Step2Demo = ({ invalid }: { invalid?: boolean }) => {
  const [scopes, setScopes] = useState<ApiScope[]>(["read_public", "trade_order"]);
  const [ipRaw, setIpRaw] = useState(invalid ? "203.0.113.10, not-an-ip" : "203.0.113.10");
  const ipList = ipRaw.split(/[,\n\s]+/).map((s) => s.trim()).filter(Boolean);
  const ipInvalid = ipList.filter((ip) => !/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ip));
  return (
    <Step2
      scopes={scopes}
      setScopes={setScopes}
      availableScopes={ALL_SCOPES}
      requiresIp={true}
      ipRaw={ipRaw}
      setIpRaw={setIpRaw}
      ipInvalid={ipInvalid}
    />
  );
};

const Step3Demo = ({ error }: { error?: boolean }) => {
  const [otp, setOtp] = useState(error ? "000000" : "");
  return <Step3 otp={otp} setOtp={setOtp} otpError={error ? "Invalid code. Try again." : null} />;
};

const Step4Demo = ({ copied }: { copied?: boolean }) => (
  <Step4Secret
    secret="omx_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
    copied={!!copied}
    onCopy={() => {}}
  />
);

/* ---- Exported preview cases ---- */
export const TierTrackOkPreview = () => (
  <TierTrack tiers={makeTiers("ok-trading")} highestEligible="trading" />
);
export const TierTrackPartialPreview = () => (
  <TierTrack tiers={makeTiers("ok-readonly")} highestEligible="read_only" />
);
export const TierTrackLockedPreview = () => <TierTrack tiers={makeTiers("locked")} />;

export const TierQuickOkPreview = () => <TierQuickAnswer tiers={makeTiers("ok-trading")} />;
export const TierQuickPartialPreview = () => <TierQuickAnswer tiers={makeTiers("ok-readonly")} />;
export const TierQuickLockedPreview = () => <TierQuickAnswer tiers={makeTiers("locked")} />;

export const KeysEmptyPreview = () => (
  <EmptyState
    variant="card"
    icon={KeyRound}
    title="No API keys yet"
    description="Create your first key to start streaming data or placing orders programmatically."
    action={
      <Button size="sm" className="gap-1.5">
        <Plus className="w-4 h-4" /> Create key
      </Button>
    }
  />
);
export const KeysLoadingPreview = () => <LoadingState label="Loading keys…" />;
export const KeysErrorPreview = () => (
  <ErrorState
    title="Couldn't load API keys"
    description="Something went wrong fetching your keys."
    onRetry={() => {}}
  />
);
export const KeysTablePreview = () => <KeysTable keys={mockKeys} onRevoke={() => {}} />;

export const StepIndicator1Preview = () => <StepIndicator current={1} />;
export const StepIndicator2Preview = () => <StepIndicator current={2} />;
export const StepIndicator3Preview = () => <StepIndicator current={3} />;
export const StepIndicator4Preview = () => <StepIndicator current={4} />;

export const Step1Preview = () => <Step1Demo />;
export const Step2Preview = () => <Step2Demo />;
export const Step2InvalidPreview = () => <Step2Demo invalid />;
export const Step3Preview = () => <Step3Demo />;
export const Step3ErrorPreview = () => <Step3Demo error />;
export const Step4Preview = () => <Step4Demo />;
export const Step4CopiedPreview = () => <Step4Demo copied />;

export const WizardShellPreview = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(true);
  const [secret, setSecret] = useState<string | null>(null);
  const createKeyStub = {
    mutateAsync: async () => ({ secret: "omx_live_" + "0".repeat(48) }),
    isPending: false,
  } as unknown as ReturnType<typeof useApiKeys>["createKey"];
  return (
    <div className="p-4">
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Re-open {isMobile ? "Drawer" : "Dialog"}
      </Button>
      <CreateKeyFlow
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSecret(null);
        }}
        onCreated={setSecret}
        newSecret={secret}
        tiers={makeTiers("ok-trading")}
        createKey={createKeyStub}
        isMobile={isMobile}
      />
    </div>
  );
};

export const RevokeDialogPreview = () => {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-4">
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Re-open Revoke
      </Button>
      <RevokeDialog
        target={open ? mockKeys[0] : null}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        pending={false}
      />
    </div>
  );
};

export const DevelopersMobileTiersPreview = () => (
  <TiersStepperMobile tiers={DEVELOPERS_MOBILE_TIERS} />
);
