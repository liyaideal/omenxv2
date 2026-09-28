import { t } from "@/i18n";
import { useState } from "react";
import { Plus, KeyRound } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";
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
      {/* DATA OPENING — TierQuickAnswer is the opening; no page h1. */}
      <div className="border-t border-border/30" />

      <TierQuickAnswer tiers={tiers} />

      <div className="border-t border-border/30" />

      <section className="py-6 md:py-8">
        <div className="flex items-baseline justify-between gap-3 mb-4 min-w-0">
          <h2 className="text-sm font-semibold text-foreground flex-shrink-0">{t("common.access_tiers")}</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 hidden md:inline truncate min-w-0">
            {t("api-management.screen.api_management_page.auto_evaluated_read_only_trading_pro")}
          </span>
        </div>
        <TierTrack tiers={tiers} highestEligible={highestEligible} />
      </section>

      <div className="border-t border-border/30" />

      <section className="py-6 md:py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t("api-management.screen.api_management_page.your_api_keys")}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {keys.length} key{keys.length === 1 ? "" : "s"} · secrets shown once at creation
            </p>
          </div>
          {keys.length > 0 && (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> {t("api-management.screen.api_management_page.create_key")}
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingState label="Loading keys…" />
        ) : isError ? (
          <ErrorState
            title={t("api-management.screen.api_management_page.couldnt_load_api_keys")}
            description={t("api-management.screen.api_management_page.something_went_wrong_fetching_your_keys")}
            onRetry={() => refetch()}
          />
        ) : keys.length === 0 ? (
          <EmptyState
            title={t("api-management.screen.api_management_page.no_api_keys_yet")}
            description={t("api-management.screen.api_management_page.create_your_first_key_to_start_streaming_data_or_placing_orders_programmatically")}
            actionLabel="Create key"
            onAction={() => setCreateOpen(true)}
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
          <MobileHeader title={t("api-management.screen.api_management_page.keys_and_access")} showLogo={false} showBack />
          <LiteAuthGate
            title={t("auth.lite.api_title")}
            description={t("auth.lite.api_description")}
          >
            <div className="px-4 py-6 pb-24 max-w-7xl mx-auto">{content}</div>
          </LiteAuthGate>
          <BottomNav />
        </>
      ) : (
        <>
          <EventsDesktopHeader />
          <LiteAuthGate
            title={t("auth.lite.api_title")}
            description={t("auth.lite.api_description")}
          >
            <main className="max-w-7xl mx-auto w-full px-4 py-10 lg:px-6">{content}</main>
          </LiteAuthGate>
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
