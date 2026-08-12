import { SectionWrapper, SubSection, DualDevicePreview } from "../components";

/**
 * Vouchers v2 — the shipped surface (/rewards → Vouchers tab).
 * Every case mounts through <DualDevicePreview> so `md:` breakpoints resolve
 * against the real 375px mobile viewport. Production components are used
 * directly; the market picker is an annotated mirror (hook-driven in prod).
 */
export const Vouchers2Section = ({ isMobile: _isMobile }: { isMobile: boolean }) => (
  <SectionWrapper
    id="vouchers2"
    title="Vouchers v2 (shipped)"
    platform="shared"
    description="Flat chrome, volt rails, dual payout modes (instant → wallet · tiered → pending pool). Lives inside /rewards as the Vouchers tab; /vouchers redirects there. Copy locked to docs/copy-dictionary.md."
  >
    <div className="space-y-10">
      <SubSection
        title="1. VoucherRow — every state"
        description="Real VoucherRow + RowPrimaryButton / RowOutlineButton / RowStatusWord. 3px volt rail (grey when spent), face value in volt, two text lines; instant payout gets an exceptional third line. Mobile drops the action to a full-width 44px block."
        platform="shared"
      >
        <DualDevicePreview previewKey="vouchers2-rows" label="ready · sold out · active tiered · active instant · selected" minHeight={320} />
      </SubSection>

      <SubSection
        title="2. VoucherEarningsCard — earnings hero"
        description="Real component fed by data + stats overrides. Two flat cells (pending USDC blue · claim CTA), tier rail T0–T4 with the unlock ladder, one-line stats strip. Claimable = min(pending, tier cap − lifetime credited)."
        platform="shared"
      >
        <DualDevicePreview previewKey="vouchers2-earnings" label="claimable · locked at cap · pending $0" minHeight={520} />
      </SubSection>

      <SubSection
        title="3. VoucherHistoryArchive"
        description="Real collapsible archive bar (count + profit summary) with redeemed and expired rows underneath. Right column captions differ by payout mode; expired rows carry the reason (Unclaimed / Claimed, not redeemed)."
        platform="shared"
      >
        <DualDevicePreview previewKey="vouchers2-archive" label="collapsed bar + expanded rows" minHeight={420} />
      </SubSection>

      <SubSection
        title="4. Market picker — cards, locks, empty"
        description="Live pieces of EventPickerList (PickerSearchBar / PickerSkeleton / PickerEmpty / EventPickerCard rows) with mock props — production is the same code, hook-driven. BOOST / STANDARD line badges, neutral mono prices, 1px outline Buy button on binary cards, Yes/No pair on multi-option, volt Picked state, price-band dim and event-level voucher lock."
        platform="shared"
      >
        <DualDevicePreview previewKey="vouchers2-picker" label="7 card states · toggle Mobile for stacked option rows" minHeight={420} />
      </SubSection>

      <SubSection
        title="5. Redeem desk — header + empty"
        description="Real VoucherDeskHeader (Max profit · Hold window · Payout) inside the desk shell, plus the nothing-selected placeholder. Compact variant is what mobile mounts above the picker."
        platform="shared"
      >
        <DualDevicePreview previewKey="vouchers2-desk" label="tiered · instant · empty desk" minHeight={420} />
      </SubSection>

      <SubSection
        title="6. Mobile 375 — list and redeem screen"
        description="On 375 the redeem flow replaces the list with its own screen (back header + compact desk header + picker) and the confirm bar floats above the BottomNav with a truncating summary."
        platform="mobile"
      >
        <DualDevicePreview previewKey="vouchers2-mobile-flow" label="list · redeem screen" minHeight={420} />
      </SubSection>

      <SubSection
        title="7. VoucherBanner"
        description="Real VoucherBannerView — production mount: /portfolio (src/pages/Portfolio.tsx). Granted CTA (Gift icon) wins over claimed CTA (Ticket icon) whenever any granted voucher exists; returns null at zero."
        platform="shared"
      >
        <DualDevicePreview previewKey="voucher-banner" label="hidden · granted · granted+claimed · claimed" minHeight={280} />
      </SubSection>

      <SubSection
        title="8. CloseVoucherContent — cash out a voucher position"
        description="Real CloseVoucherContent — production mounts: CloseVoucherDialog on /trade desktop and CloseVoucherDrawer inside PositionCard on mobile. Credit floors at 0 and caps at Max profit; covers long / short × profit / loss / capped / submitting."
        platform="shared"
      >
        <DualDevicePreview previewKey="voucher-close" label="6 PnL states" minHeight={620} />
      </SubSection>
    </div>
  </SectionWrapper>
);
