import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { DualDevicePreview } from "../components/DeviceFrame";

/**
 * Rewards mobile task rows — playground.
 * Every case mounts the REAL GrantTaskRow inside a same-origin preview iframe.
 * Mobile · 375 is a true 375px viewport, so GrantTaskRow's useIsMobile (<768px)
 * branch resolves for real: two-layer stack (icon + copy, hairline divider,
 * reward left / 44px action right). Desktop keeps the three-column row.
 * Narrow containers in the parent viewport are forbidden here — they render a
 * squeezed desktop row and lie about the mobile layout.
 */
export const RewardsMobileSection = ({ isMobile }: { isMobile: boolean }) => (
  <SectionWrapper
    id="rewards-mobile"
    title="Rewards · mobile task rows"
    platform="mobile"
    description="One row recipe (TaskRowShell) for campaign grants and referral invites. Mobile stacks it into two layers: icon + copy + full-width progress, hairline divider, then reward left / 44px action right."
  >
    <div className="space-y-8">
      <SubSection
        title="State playground"
        description="Every state a task row can render. The preset rail lives inside the frame — switch device to compare the mobile stack against the desktop row."
      >
        <DualDevicePreview
          previewKey="rewards-taskrow-playground"
          label="GrantTaskRow — live component, preset rail inside the frame"
          defaultDevice="mobile"
          minHeight={220}
        />
      </SubSection>

      <SubSection title="All states at once" description="Regression board — every row must keep reward and action columns aligned.">
        <DualDevicePreview
          previewKey="rewards-taskrow-board"
          label="GrantTaskRow — all states"
          defaultDevice="mobile"
          minHeight={520}
        />
      </SubSection>

      <SubSection title="Rules" description="">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Mobile: no fixed reward/action widths — the divider row handles alignment.</li>
          <li>Desktop: reward column w-[92px] right-aligned, action column w-[132px] justified end.</li>
          <li>Action buttons keep a 44px minimum touch target on mobile (40px desktop).</li>
          <li>Status words only appear when there is no action to take; otherwise the CTA wins.</li>
          <li>Mobile cases must run in the 375px iframe — a narrow container in this viewport renders the desktop row squeezed, never the real stack.</li>
          <li>{isMobile ? "You are viewing the style guide on a mobile viewport." : "You are viewing the style guide on a desktop viewport."}</li>
        </ul>
      </SubSection>
    </div>
  </SectionWrapper>
);
