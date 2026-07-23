import { useState } from "react";
import { Plus, KeyRound } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { toast } from "sonner";
import { EmptyState, LoadingState, ErrorState } from "@/components/states";
import { useApiKeys, useTierEligibility, type ApiKey } from "@/hooks/useApiKeys";
import {
  TierTrack,
  TierQuickAnswer,
  KeysTable,
  CreateKeyFlow,
  RevokeDialog,
} from "@/components/api";

const ApiManagement = () => {
  const isMobile = useIsMobile();
  const { keys, isLoading, isError, refetch, createKey, revokeKey } = useApiKeys();
  const { tiers } = useTierEligibility();

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);


  const eligibleTiers = tiers.filter((t) => t.eligible);
  const highestEligible = eligibleTiers[eligibleTiers.length - 1]?.tier;

  const content = (
    <div>
      {!isMobile && (
        <div className="pb-8">
          <PageHeader
            title="Keys & access"
            subtitle="Generate signed keys for programmatic access. Secrets are shown once at creation and never stored in plain text."
          />
        </div>
      )}

      <div className="border-t border-border/30" />

      <TierQuickAnswer tiers={tiers} />

      <div className="border-t border-border/30" />

      <section className="py-6 md:py-8">
        <div className="flex items-baseline justify-between gap-3 mb-4 min-w-0">
          <h2 className="text-sm font-semibold text-foreground flex-shrink-0">Access tiers</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 hidden md:inline truncate min-w-0">
            Auto-evaluated · Read-only → Trading → Pro
          </span>
        </div>
        <TierTrack tiers={tiers} highestEligible={highestEligible} />
      </section>

      <div className="border-t border-border/30" />

      <section className="py-6 md:py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Your API keys</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {keys.length} key{keys.length === 1 ? "" : "s"} · secrets shown once at creation
            </p>
          </div>
          {keys.length > 0 && (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> Create key
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingState label="Loading keys…" />
        ) : isError ? (
          <ErrorState
            title="Couldn't load API keys"
            description="Something went wrong fetching your keys."
            onRetry={() => refetch()}
          />
        ) : keys.length === 0 ? (
          <EmptyState
            variant="card"
            icon={KeyRound}
            title="No API keys yet"
            description="Create your first key to start streaming data or placing orders programmatically."
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" /> Create key
              </Button>
            }
          />
        ) : (
          <KeysTable keys={keys} onRevoke={setRevokeTarget} />
        )}
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <MobileHeader title="Keys & access" showLogo={false} showBack={true} />
          <AuthGateOverlay
            title="Sign in to manage API keys"
            description="Create and revoke signed keys for programmatic access after signing in."
            maxPreviewHeight="600px"
          >
            <div className="px-4 py-6 pb-24 max-w-7xl mx-auto">{content}</div>
          </AuthGateOverlay>
          <BottomNav />
        </>
      ) : (
        <>
          <EventsDesktopHeader />
          <AuthGateOverlay
            title="Sign in to manage API keys"
            description="Create and revoke signed keys for programmatic access after signing in."
            maxPreviewHeight="600px"
          >
            <main className="max-w-7xl mx-auto w-full px-8 py-10">{content}</main>
          </AuthGateOverlay>
        </>
      )}


      <CreateKeyFlow
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setNewSecret(null);
        }}
        onCreated={(secret) => setNewSecret(secret)}
        newSecret={newSecret}
        tiers={tiers}
        createKey={createKey}
        isMobile={!!isMobile}
      />

      <RevokeDialog
        target={revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={async (id) => {
          await revokeKey.mutateAsync(id);
          toast.success("API key revoked");
          setRevokeTarget(null);
        }}
        pending={revokeKey.isPending}
      />
    </div>
  );
};

export default ApiManagement;
