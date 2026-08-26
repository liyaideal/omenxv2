import { Component, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { CampaignKeyVisual } from "@/components/campaigns/CampaignKeyVisual";
import { SignInPromptCard } from "@/components/campaigns/SignInPromptCard";
import { RewardsFinePrint } from "@/components/campaigns/RewardsFinePrint";
import { CampaignRulesDisclosure } from "@/components/campaigns/CampaignRulesDisclosure";
import { ConnectedAccountsCard } from "@/components/h2e/ConnectedAccountsCard";
import { H2eRewardsCard } from "@/components/h2e/H2eRewardsCard";
import { useAuth } from "@/hooks/useAuth";
import { useH2eRewardsSummary } from "@/hooks/useH2eRewardsSummary";
import omenxLogo from "@/assets/omenx-logo.svg";

const H2E_ACCENT = "linear-gradient(120deg, rgba(1,50,129,.7), rgba(51,214,255,.22) 50%, rgba(10,11,13,.3))";

const H2E_RULES = [
  "Hedge Airdrop Rewards is a permanent OmenX platform program. Connect the wallet you use on an external prediction market, and qualifying positions receive a $10 hedge on the counter side as an airdrop.",
  "Airdrop settlement earnings accumulate up to a lifetime cap of $100 per account. Earnings unlock for withdrawal in tiers as your OmenX trading volume grows: 10% at $10K, 25% at $50K, 50% at $100K, 75% at $200K and 100% at $400K. Unlocks are cumulative with no interpolation between tiers.",
  "The $5 Starter unlock is independent of this program and is withdrawable at any time.",
  "Qualification, expiry and anti-abuse limits are listed under Connected accounts above. OmenX may adjust or end program terms to prevent abuse.",
];

/** Local boundary — only the H2E modules, never the whole Rewards shell. */
class H2eErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[h2e] campaign detail crashed:", error);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="rounded-[16px] border border-[#1D2026] bg-[#131519] px-4 py-10 text-center text-[13px] text-[#9AA1AC]">
        Something went wrong loading this program. Please refresh.
      </div>
    );
  }
}

export default function H2eCampaignDetailPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const h2e = useH2eRewardsSummary();
  const signedOut = !user;

  const heroChip = (padding: string, size: string) => (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-display font-bold"
      style={{ background: "#131519", border: "1px solid #1D2026", color: "#33D6FF", padding, fontSize: size }}
    >
      ${h2e.earningsCap} USDC airdrop cap
    </span>
  );

  const alwaysOnBadge = (
    <span
      className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em]"
      style={{ background: "#242830", color: "#C9CED6" }}
    >
      Always on
    </span>
  );

  const mobileHero = (
    <div className="flex flex-col" style={{ background: "#0C0E12", borderRadius: 14 }}>
      <CampaignKeyVisual
        src={undefined}
        accent={H2E_ACCENT}
        ratio="16 / 9.5"
        className="rounded-[14px]"
        scrim="linear-gradient(180deg, rgba(10,11,13,0.0) 0%, rgba(10,11,13,0.45) 20%, rgba(10,11,13,0.85) 55%, rgba(10,11,13,0.98) 100%)"
      >
        <div>{alwaysOnBadge}</div>
        <div className="flex flex-col gap-[10px]">
          <h1 className="font-display text-[22px] font-bold leading-[28px] text-[#F2F3F5]">Hedge Airdrop Rewards</h1>
          <div className="font-display text-[12px] leading-[16px] tabular-nums text-[#9AA1AC]">
            Always valid
          </div>
          <div className="flex flex-wrap items-center gap-2">{heroChip("6px 12px", "12px")}</div>
        </div>
      </CampaignKeyVisual>
    </div>
  );

  const desktopHero = (
    <div style={{ background: "#0C0E12", borderRadius: 14 }}>
      <CampaignKeyVisual
        src={undefined}
        accent={H2E_ACCENT}
        ratio="1232 / 300"
        className="rounded-[14px]"
        scrim="linear-gradient(180deg,rgba(10,11,13,0) 0%,rgba(10,11,13,.72) 46%,rgba(10,11,13,.94) 100%)"
        scrimHeight="190px"
      >
        <div className="mx-auto w-full max-w-[1248px]">{alwaysOnBadge}</div>
        <div className="mx-auto flex w-full max-w-[1248px] flex-col gap-[12px]">
          <h1 className="font-display text-[36px] font-bold leading-tight text-[#F2F3F5]">Hedge Airdrop Rewards</h1>
          <div className="font-display text-[12.5px] tabular-nums text-[#C9CED6]">
            Always valid
          </div>
          <div className="flex flex-wrap items-center gap-2">{heroChip("7px 13px", "12.5px")}</div>
        </div>
      </CampaignKeyVisual>
    </div>
  );

  const credited = Math.max(0, h2e.totalEarned - h2e.lockedAmount);

  const rewardsCard = signedOut ? (
    <SignInPromptCard />
  ) : (
    <aside
      className="flex flex-col gap-[14px] rounded-[16px] border border-[#1D2026] bg-[#131519]"
      style={{ padding: isMobile ? 16 : 18 }}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Your rewards here</div>

      {isMobile ? (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Earned", value: `$${h2e.totalEarned.toFixed(2)}`, color: "#33D6FF" },
            { label: "Credited", value: `$${credited.toFixed(2)}`, color: "#FFFFFF" },
            { label: "Locked", value: `$${h2e.lockedAmount.toFixed(2)}`, color: "#9AA1AC" },
          ].map((s) => (
            <div key={s.label} className="rounded-[12px] bg-[#0F1114] px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.1em] text-[#6B7280]">{s.label}</div>
              <div className="mt-1 font-display text-[16px] font-bold tabular-nums" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] text-[#9AA1AC]">Airdrops earned</span>
            <span className="font-display text-[15px] font-bold tabular-nums text-[#33D6FF]">
              ${h2e.totalEarned.toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] text-[#9AA1AC]">Credited to wallet</span>
            <span className="font-display text-[15px] font-bold tabular-nums text-white">${credited.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline justify-between" style={{ borderTop: "1px solid #1D2026", paddingTop: 11 }}>
            <span className="text-[12.5px] text-[#9AA1AC]">Still locked here</span>
            <span className="font-display text-[15px] font-bold tabular-nums text-[#9AA1AC]">
              ${h2e.lockedAmount.toFixed(2)}
            </span>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => navigate("/wallet")}
        className="w-full rounded-[10px] bg-white px-4 font-display text-[12.5px] font-bold text-[#0A0B0D] transition-colors hover:bg-[#E6E9EE]"
        style={{ minHeight: 44 }}
      >
        Open Wallet →
      </button>

      <div
        className="flex items-center gap-2.5 rounded-[12px]"
        style={{ background: "#0F1115", border: "1px solid #1D2026", padding: "11px 12px" }}
      >
        <span
          className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full text-[11px] font-bold"
          style={{ background: "#16181D", color: "#9AA1AC" }}
        >
          <img src={omenxLogo} alt="OmenX" className="h-2.5 w-[18px] object-contain" />
        </span>
        <div className="min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6B7280]">Host</div>
          <div className="text-[12.5px] font-semibold" style={{ color: "#F2F3F5" }}>
            Official OmenX campaign — open to everyone
          </div>
        </div>
      </div>
    </aside>
  );

  const leftColumn = (
    <>
      <ConnectedAccountsCard />
      <H2eRewardsCard h2e={h2e} />
      <CampaignRulesDisclosure heading="Campaign rules" paragraphs={H2E_RULES} />
    </>
  );

  const body = isMobile ? (
    <div className="space-y-5">
      {mobileHero}
      <H2eErrorBoundary>
        <div className="space-y-5">{leftColumn}</div>
      </H2eErrorBoundary>
      {rewardsCard}
      <RewardsFinePrint />
    </div>
  ) : (
    <div className="space-y-5">
      {desktopHero}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="order-2 space-y-5 lg:order-1">
          <H2eErrorBoundary>
            <div className="space-y-5">{leftColumn}</div>
          </H2eErrorBoundary>
          <RewardsFinePrint />
        </div>
        <div className="order-1 lg:order-2">{rewardsCard}</div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader title="Campaign" showLogo={false} showBack />
        <main className="px-4 py-4">{body}</main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EventsDesktopHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-6">{body}</main>
    </div>
  );
}
