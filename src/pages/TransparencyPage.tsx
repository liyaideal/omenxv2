import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, FileSearch, Scale, ChevronRight, ExternalLink, Lock, Eye, Zap, Percent } from "lucide-react";
import { DesktopBackLink } from "@/components/ui/desktop-back-link";
import { useIsMobile } from "@/hooks/use-mobile";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { SeoFooter } from "@/components/seo/SeoFooter";
import { useAuth } from "@/hooks/useAuth";
import { LoginPrompt } from "@/components/LoginPrompt";
import { MerkleProofVerification } from "@/components/transparency/MerkleProofVerification";
import { TradeVerification } from "@/components/transparency/TradeVerification";
import { LiquidationAudit } from "@/components/transparency/LiquidationAudit";
import { FundingRateAudit } from "@/components/transparency/FundingRateAudit";


const SCENARIOS = [
  {
    id: "merkle-proof",
    icon: Shield,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
    title: "My Funds Are Really There?",
    subtitle: "State Root Verification",
    description: "Verify your account balance and positions are included in the platform's on-chain state root (batchId, oldRoot → newRoot) using cryptographic Merkle proofs.",
    steps: ["Fetch proof from platform", "Read on-chain StateRoot", "Local browser verification", "Result display"],
    badge: "Proof of Reserves",
  },
  {
    id: "trade-verification",
    icon: FileSearch,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    title: "Is My Trade Real?",
    subtitle: "TradeLogged Event Audit",
    description: "Compare your trade records against on-chain TradeLogged events (eventId, marketId, makerUid, takerUid, price, size, side) to verify execution integrity.",
    steps: ["Select a trade", "Fetch on-chain log", "Field-by-field comparison", "Counterparty verification"],
    badge: "Trade Audit",
  },
  {
    id: "liquidation-audit",
    icon: Scale,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10",
    title: "Why Was I Liquidated?",
    subtitle: "PositionLiquidated Event Audit",
    description: "Audit forced liquidations by replaying the on-chain markPrice and your margin ratio at trigger time — verify the closure was executed by the contract's maintenance margin rule, not by manual intervention.",
    steps: ["Select position", "Fetch on-chain event", "Margin analysis", "Fairness conclusion"],
    badge: "Price Fairness",
  },
  {
    id: "funding-rate-audit",
    icon: Percent,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
    title: "Am I Being Overcharged?",
    subtitle: "FundingRate Event Audit",
    description: "Compare the funding rate applied to your position against the on-chain FundingRate event log (eventId, marketId, fundingRate) to verify no unfair fees.",
    steps: ["Select a position", "Fetch on-chain log", "Rate comparison", "Fee verification"],
    badge: "Fee Transparency",
  },
];

const SCENARIO_GRADIENTS: Record<string, string> = {
  "merkle-proof": "hsl(160 50% 15% / 0.15)",
  "trade-verification": "hsl(210 50% 15% / 0.15)",
  "liquidation-audit": "hsl(40 50% 15% / 0.15)",
  "funding-rate-audit": "hsl(270 50% 15% / 0.15)",
  
};

const SCENARIO_TITLES: Record<string, string> = {
  "merkle-proof": "Asset Verification",
  "trade-verification": "Trade Verification",
  "liquidation-audit": "Liquidation Audit",
  "funding-rate-audit": "Funding Rate Audit",
  
};

const BASE_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const TransparencyPage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  if (!user) {
    return (
      <LoginPrompt
        title="Sign in to access Transparency Audit"
        description="Verify your assets, trades, and liquidations on-chain."
      />
    );
  }

  // Render active scenario
  const renderScenario = () => {
    const onBack = () => setActiveScenario(null);
    switch (activeScenario) {
      case "merkle-proof": return <MerkleProofVerification onBack={onBack} />;
      case "trade-verification": return <TradeVerification onBack={onBack} />;
      case "liquidation-audit": return <LiquidationAudit onBack={onBack} />;
      case "funding-rate-audit": return <FundingRateAudit onBack={onBack} />;
      
      default: return null;
    }
  };

  if (activeScenario) {
    const scenarioContent = renderScenario();
    const gradient = SCENARIO_GRADIENTS[activeScenario] || "hsl(160 50% 15% / 0.15)";
    const title = SCENARIO_TITLES[activeScenario] || "Transparency";

    if (isMobile) {
      return (
        <div className="min-h-screen bg-background pb-24">
          <MobileHeader title={title} showLogo={false} showBack={true} />
          <div className="px-4 py-6">{scenarioContent}</div>
          <BottomNav />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex flex-col"
        style={{ background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${gradient} 0%, hsl(222 47% 6%) 70%)` }}
      >
        <EventsDesktopHeader />
        <main className="flex-1 mx-auto w-full max-w-7xl px-8 py-10 space-y-6">{scenarioContent}</main>
        <SeoFooter />
      </div>
    );
  }


  const ScenarioCard = ({ scenario }: { scenario: typeof SCENARIOS[0] }) => {
    const Icon = scenario.icon;
    return (
      <button
        onClick={() => setActiveScenario(scenario.id)}
        className="trading-card p-5 md:p-6 text-left group hover:border-primary/30 transition-all duration-200 w-full"
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${scenario.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-6 h-6 ${scenario.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {scenario.badge}
              </span>
            </div>
            <h3 className="font-semibold text-base md:text-lg mb-1 group-hover:text-primary transition-colors">
              {scenario.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {scenario.description}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {scenario.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground/70 bg-muted/30 px-2 py-0.5 rounded">
                    {i + 1}. {s}
                  </span>
                  {i < scenario.steps.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30" />}
                </div>
              ))}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary shrink-0 mt-1 transition-colors" />
        </div>
      </button>
    );
  };

  const FooterInfo = () => (
    <div className="trading-card p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Smart Contract</h3>
          <p className="text-xs text-muted-foreground mb-2">All user funds are held in the OmenX smart contract on Base network.</p>
          <code className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded break-all">{BASE_CONTRACT}</code>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5"
            onClick={() => window.open(`https://basescan.org/address/${BASE_CONTRACT}`, "_blank")}
          >
            <ExternalLink className="w-3.5 h-3.5" /> View on BaseScan
          </Button>
          {/* TODO: Unhide when audit report is ready */}
          {/* <Button variant="outline" size="sm" className="text-xs gap-1.5"
            onClick={() => window.open("https://github.com/omenx/auditor", "_blank")}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Source Auditor
          </Button> */}
        </div>
      </div>
    </div>
  );

  const content = (
    <div className="space-y-4 md:space-y-6">
      {SCENARIOS.map((scenario) => (
        <ScenarioCard key={scenario.id} scenario={scenario} />
      ))}
      <FooterInfo />
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Transparency Audit" showLogo={false} showBack={true} />
        <div className="px-4 py-6">{content}</div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col"
      style={{ background: "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(160 50% 15% / 0.15) 0%, hsl(222 47% 6%) 70%)" }}
    >
      <EventsDesktopHeader />
      <main className="flex-1 mx-auto w-full max-w-7xl px-8 py-10 space-y-6">
        <PageHeader
          title="On-Chain Transparency"
          subtitle="Don't trust — verify. Audit your assets, trades, liquidations, fees, and settlements directly against on-chain data using cryptographic proofs."
        />
        {content}
      </main>
      <SeoFooter />
    </div>
  );
};

export default TransparencyPage;
