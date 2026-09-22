import { useNavigate } from "react-router-dom";
import { ChevronRight, KeyRound, ShieldCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SettingsCard, SettingsRow } from "./SettingsCard";

/**
 * Settings › More — the two sub-page links (Transparency audit, API
 * management) as hairline rows with a chevron (mock v5 §1). Routes unchanged.
 */
export const MoreCard = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const chevron = <ChevronRight className="w-4 h-4 text-muted-foreground" />;
  return (
    <SettingsCard label="More" compact={isMobile}>
      <SettingsRow
        icon={ShieldCheck}
        title="Transparency audit"
        sub="Verify assets, trades and auto-closes on-chain"
        right={chevron}
        onClick={() => navigate("/settings/transparency")}
      />
      <SettingsRow
        icon={KeyRound}
        title="API management"
        sub="API keys for programmatic trading"
        right={chevron}
        onClick={() => navigate("/settings/api")}
        last
      />
    </SettingsCard>
  );
};
