import { useT } from "@/i18n";
import { useNavigate } from "react-router-dom";
import { ChevronRight, KeyRound, ShieldCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SettingsCard, SettingsRow } from "./SettingsCard";

/**
 * Settings › More — the two sub-page links (Transparency audit, API
 * management) as hairline rows with a chevron (mock v5 §1). Routes unchanged.
 */
export const MoreCard = () => {
  const { t } = useT();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const chevron = <ChevronRight className="w-4 h-4 text-muted-foreground" />;
  return (
    <SettingsCard label={t("common.screen.ui.breadcrumb.more")} compact={isMobile}>
      <SettingsRow
        icon={ShieldCheck}
        title={t("settings.transparency_audit")}
        sub={t("settings.more.transparencySub")}
        right={chevron}
        onClick={() => navigate("/settings/transparency")}
      />
      <SettingsRow
        icon={KeyRound}
        title={t("settings.api_management")}
        sub={t("settings.more.apiSub")}
        right={chevron}
        onClick={() => navigate("/settings/api")}
        last
      />
    </SettingsCard>
  );
};
