import { SectionWrapper, SubSection, DualDevicePreview } from "../components";

/**
 * Vouchers section — same "real components + all states + true dual-viewport"
 * standard as ApiSection. Every case mounts through <DualDevicePreview> so
 * `md:` breakpoints resolve against the 375px mobile iframe viewport.
 *
 * Real production components are used directly (VoucherCard, VoucherEarningsCard,
 * CloseVoucherContent, EmptyState/LoadingState). Cases where production has no
 * independent prop-driven component are style-guide-internal mirrors — each is
 * annotated at the top of src/pages/StyleGuide/preview/voucherPreviews.tsx.
 */

interface Props {
  isMobile: boolean;
}

export const VouchersSection = ({ isMobile: _isMobile }: Props) => {
  return (
    <SectionWrapper
      id="vouchers"
      title="Vouchers"
      description="Position vouchers — granted → claimed (7d) → redeemed → settled, tiered earnings claim. Every module toggles Desktop / Mobile·375 through an iframe so `md:` breakpoints render honestly. Copy locked to docs/copy-dictionary.md."
    >
      <div className="space-y-10">
        <SubSection
          title="1. VoucherBanner"
          description="Home / Vouchers entry banner. Granted CTA (Gift icon) wins over claimed CTA (Ticket icon) whenever any granted voucher exists. Mirror — production VoucherBanner is hook-driven with no props."
          platform="shared"
        >
          <DualDevicePreview previewKey="voucher-banner" label="Toggle Mobile·375 to see the stacked breakpoint." minHeight={280} />
        </SubSection>

        <SubSection
          title="2. Vouchers page — list-level states"
          description="Loading / empty / populated branches rendered by src/pages/Vouchers.tsx. Uses the real EmptyState and LoadingState components mounted by the page."
          platform="shared"
        >
          <DualDevicePreview previewKey="voucher-page-list-level" label="loading · empty · populated (see other cases)" minHeight={360} />
        </SubSection>

        <SubSection
          title="3. VoucherCard"
          description="Real VoucherCard, compact variant, driven by mock voucher + poolOverride props. Enumerates granted (comfortable / warning / urgent / sold out / claiming) and claimed (fresh / selected / urgent) lifecycles. Expired visuals live in case 10 — VoucherCard has no expired branch."
          platform="shared"
        >
          <DualDevicePreview previewKey="voucher-card" label="8 lifecycle states via preset rail" minHeight={520} />
        </SubSection>

        <SubSection
          title="4. VoucherEarningsCard"
          description="Real VoucherEarningsCard fed by mock tier data. Pending earnings pool with 4-tier volume ladder (T1 $5k → $25 · T2 $15k → $100 · T3 $50k → $500 · T4 $150k → unlimited). Claimable = min(pending, tier.cap − lifetimeCredited). Claim-button state ladder shown beneath as dev reference."
          platform="shared"
        >
          <DualDevicePreview previewKey="voucher-earnings" label="7 tier states · toggle Mobile to verify stacked layout" minHeight={700} />
        </SubSection>

        <SubSection
          title="5. EventPickerList — option rows"
          description="Eligibility check per option: price band, time-to-settlement, resolution. Binary events render Buy {alias}; multi-market events render Yes / No. Mirror — EventPickerList is hook-driven and eligibility states can't be forced without mocking useActiveEvents."
          platform="shared"
        >
          <DualDevicePreview previewKey="voucher-picker" label="binary vs multi-market · locked reasons" minHeight={420} />
        </SubSection>

        <SubSection
          title="6. Redeem confirm — sticky action bar"
          description="Bottom bar for the redemption flow. Mirror — this bar is embedded inside RedeemVoucherContent and is not exported as a standalone component."
          platform="shared"
        >
          <DualDevicePreview previewKey="voucher-redeem-sticky" label="empty · picked (binary / multi) · submitting" minHeight={260} />
        </SubSection>

        <SubSection
          title="7. CloseVoucherContent"
          description="Real CloseVoucherContent — the shared body used by the close Dialog (desktop) and MobileDrawer. Credit floors at 0 and caps at Max profit; covers long / short × profit / loss / capped / submitting."
          platform="shared"
        >
          <DualDevicePreview previewKey="voucher-close" label="6 PnL states" minHeight={620} />
        </SubSection>

        <SubSection
          title="8. Redeemed voucher row (Vouchers page)"
          description="Mirror of RedeemedSection row in src/pages/Vouchers.tsx. Binary events surface the alias chip on its own line; multi-market events show market label + YES/NO inline. Right column mirrors production exactly: flat `Position open` / `Position closed` — PnL amount varies per settled variant."
          platform="shared"
        >
          <DualDevicePreview previewKey="voucher-redeemed-row" label="6 open / settled variants" minHeight={340} />
        </SubSection>

        <SubSection
          title="9. Position chip — voucher source marker"
          description="Voucher badge + Hold-window countdown rendered inside positions tables. Mirror — chips are composed inline in the positions surface."
          platform="shared"
        >
          <DualDevicePreview previewKey="voucher-position-chip" label="comfortable · urgent · past hold" minHeight={180} />
        </SubSection>

        <SubSection
          title="10. Expired voucher row (Vouchers page)"
          description="Mirror of ExpiredSection row in src/pages/Vouchers.tsx. Two lifecycle sources surface via the subline: granted-never-claimed (Unclaimed) and claimed-never-redeemed within 7 days (Claimed, not redeemed)."
          platform="shared"
        >
          <DualDevicePreview previewKey="voucher-expired-row" label="Unclaimed · Claimed, not redeemed" minHeight={260} />
        </SubSection>
      </div>
    </SectionWrapper>
  );
};
