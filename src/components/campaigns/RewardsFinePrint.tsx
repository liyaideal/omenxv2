/**
 * One fine print per page carrying USDC amounts (no inline "not guaranteed").
 * Extracted verbatim out of LiteRewardsPage / LiteCampaignDetailPage — same JSX,
 * both pages keep rendering it in place.
 */
export const RewardsFinePrint = () => (
  <p className="pt-1 text-[11.5px] leading-5 text-[#6B7280]">
    USDC amounts are estimates and not guaranteed. A Trial Position Voucher opens a trial position — the profit is
    yours, the voucher itself is not withdrawable.
  </p>
);
