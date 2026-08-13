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
        description="Live pieces of EventPickerList (PickerSearchBar / PickerSkeleton / PickerEmpty / PickerDirectionPair / EventPickerCard rows) with mock props — production is the same code, hook-driven. v2.1: complementary markets (two outcomes) collapse to one 44px direction pair with the price inside each button and no BINARY tail; multi-option cards keep the per-option Yes/No pair, each side carrying its own price. Colours ride the market axis (long = --yes Pulse Blue, short = --no Volt; never trading-green/red)."
        platform="shared"
      >
        <DualDevicePreview previewKey="vouchers2-picker" label="7 card states · toggle Mobile for stacked option rows" minHeight={420} />
      </SubSection>

      <SubSection
        title="5. Redeem desk — header + empty"
        description="Real VoucherDeskHeader (Max profit · Hold window · Payout) inside the desk shell, plus the nothing-selected placeholder. The compact variant is now a ticket stub: 56px collapsed line (volt rail · face value · From {campaign} · INSTANT tail · chevron) that grows a terms disclosure in place."
        platform="shared"
      >
        <DualDevicePreview previewKey="vouchers2-desk" label="tiered · instant · empty desk" minHeight={420} />
      </SubSection>

      <SubSection
        title="6. Redeem screen v2.1 — six states"
        description="Production mount: /rewards?tab=vouchers&redeem=<id> (mobile full screen, BottomNav retires — the header ‹ owns the exit) and the desk column of the same tab on desktop. States: A default (no bottom chrome) · B stub open + pills (>8 eligible markets) · C complementary picked · D multi picked · E locked + no-eligible empty · F desktop desk on the same collapse branch."
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
