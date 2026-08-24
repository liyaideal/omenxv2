/**
 * Preview registry — key → LAZY loader.
 *
 * Perf contract: this module must never statically import a preview module.
 * Each /style-guide/preview iframe boots its own React root, so a static
 * registry meant every iframe downloaded and evaluated the whole style-guide
 * preview graph (wallet + vouchers + api + settlement + sports + rewards…).
 * With loaders, an iframe pulls only its own group chunk — and sibling frames
 * in the same section reuse that chunk from cache.
 */
import type { ComponentType } from "react";

type Loader = () => Promise<ComponentType>;

const pick =
  (loader: () => Promise<Record<string, unknown>>, name: string): Loader =>
  async () =>
    (await loader())[name] as ComponentType;

const mobileHeader = () => import("./mobileHeaderPreviews");
const portfolio = () => import("./portfolioPreviews");
const liteEvents = () => import("./liteEventsPreviews");
const sportsLines = () => import("./sportsLinesPreviews");
const vouchers2 = () => import("./vouchers2Previews");
const vouchers1 = () => import("./voucherPreviews");
const api = () => import("./apiPreviews");
const wallet = () => import("./walletPreviews");
const settlements = () => import("./settlementPreviews");
const rewards = () => import("./rewardsPreviews");
const funding = () => import("./fundingPreviews");

export const previewRegistry: Record<string, Loader> = {
  /* -------- Mobile header system -------- */
  "mobile-header-brand-top": pick(mobileHeader, "HeaderBrandTopPreview"),
  "mobile-header-brand-scrolled": pick(mobileHeader, "HeaderBrandScrolledPreview"),
  "mobile-header-brand-control": pick(mobileHeader, "HeaderBrandControlPreview"),
  "mobile-header-inner-title": pick(mobileHeader, "HeaderInnerTitlePreview"),
  "mobile-header-inner-one-icon": pick(mobileHeader, "HeaderInnerOneIconPreview"),
  "mobile-header-inner-two-icons": pick(mobileHeader, "HeaderInnerTwoIconsPreview"),
  "mobile-header-inner-title-hidden": pick(mobileHeader, "HeaderInnerTitleHiddenPreview"),
  "mobile-header-inner-long-title": pick(mobileHeader, "HeaderInnerLongTitlePreview"),
  "mobile-header-inner-subbar": pick(mobileHeader, "HeaderInnerSubBarPreview"),
  "mobile-header-dont": pick(mobileHeader, "HeaderDontPreview"),

  /* -------- Portfolio (Lite) -------- */
  "portfolio-lite-chrome": pick(portfolio, "PortfolioChromePreview"),
  "portfolio-lite-kpi-mobile": pick(portfolio, "PortfolioKpiMobilePreview"),
  "portfolio-lite-kpi-desktop": pick(portfolio, "PortfolioKpiDesktopPreview"),
  "portfolio-lite-gauge-states": pick(portfolio, "PortfolioGaugeStatesPreview"),
  "portfolio-lite-gauge-bar": pick(portfolio, "PortfolioGaugeBarPreview"),
  "portfolio-lite-live-cards": pick(portfolio, "PortfolioLiveCardsPreview"),
  "portfolio-lite-desktop-rows": pick(portfolio, "PortfolioDesktopRowsPreview"),
  "portfolio-lite-settled": pick(portfolio, "PortfolioSettledListPreview"),
  "portfolio-lite-empty": pick(portfolio, "PortfolioEmptyStatesPreview"),
  "portfolio-lite-auth-gate-out": pick(portfolio, "PortfolioAuthGateSignedOutPreview"),
  "portfolio-lite-auth-gate-in": pick(portfolio, "PortfolioAuthGateSignedInPreview"),

  "portfolio-lite-error": pick(portfolio, "PortfolioErrorBoundaryPreview"),
  "portfolio-lite-detail-won": pick(portfolio, "SettlementDetailWonPreview"),
  "portfolio-lite-detail-autoclosed": pick(portfolio, "SettlementDetailAutoClosedPreview"),
  "portfolio-lite-detail-cashout": pick(portfolio, "SettlementDetailCashoutPreview"),
  "portfolio-lite-detail-lost": pick(portfolio, "SettlementDetailLostPreview"),
  "portfolio-lite-detail-won-mobile": pick(portfolio, "SettlementDetailWonMobilePreview"),
  "portfolio-lite-detail-autoclosed-mobile": pick(portfolio, "SettlementDetailAutoClosedMobilePreview"),
  "portfolio-lite-detail-cashout-mobile": pick(portfolio, "SettlementDetailCashoutMobilePreview"),
  "portfolio-lite-detail-lost-mobile": pick(portfolio, "SettlementDetailLostMobilePreview"),
  "portfolio-lite-series-detail": pick(portfolio, "SettlementSeriesDetailPreview"),
  "portfolio-lite-series-extremes": pick(portfolio, "SettlementSeriesExtremesPreview"),
  "portfolio-lite-series-mobile-page": pick(portfolio, "SeriesMobilePagePreview"),

  /* -------- Lite events -------- */
  "lite-events-loading": pick(liteEvents, "LiteEventsLoadingPreview"),
  "lite-events-loading-catalogue": pick(liteEvents, "LiteEventsCatalogueLoadingPreview"),

  /* -------- Sports game lines -------- */
  "trade-sports-lines-default": pick(sportsLines, "SportsLinesDefaultPreview"),
  "trade-sports-lines-handicap-selected": pick(sportsLines, "SportsLinesHandicapSelectedPreview"),
  "trade-sports-lines-scrubbed": pick(sportsLines, "SportsLinesScrubbedPreview"),
  "trade-sports-lines-single-line": pick(sportsLines, "SportsLinesSingleLinePreview"),
  "trade-sports-lines-settled": pick(sportsLines, "SportsLinesSettledPreview"),
  "line-scrubber": pick(sportsLines, "LineScrubberPreview"),

  /* -------- Vouchers v2 -------- */
  "vouchers2-rows": pick(vouchers2, "Vouchers2RowsPreview"),
  "vouchers2-earnings": pick(vouchers2, "Vouchers2EarningsPreview"),
  "vouchers2-archive": pick(vouchers2, "Vouchers2ArchivePreview"),
  "vouchers2-picker": pick(vouchers2, "Vouchers2PickerPreview"),
  "vouchers2-desk": pick(vouchers2, "Vouchers2DeskPreview"),
  "vouchers2-mobile-flow": pick(vouchers2, "Vouchers2MobileFlowPreview"),

  /* -------- Vouchers (still-serving components) -------- */
  "voucher-banner": pick(vouchers1, "BannerPreview"),
  "voucher-close": pick(vouchers1, "ClosePreview"),

  /* -------- API / Developers -------- */
  "tier-track-ok": pick(api, "TierTrackOkPreview"),
  "tier-track-partial": pick(api, "TierTrackPartialPreview"),
  "tier-track-locked": pick(api, "TierTrackLockedPreview"),
  "tier-quick-ok": pick(api, "TierQuickOkPreview"),
  "tier-quick-partial": pick(api, "TierQuickPartialPreview"),
  "tier-quick-locked": pick(api, "TierQuickLockedPreview"),
  "keys-empty": pick(api, "KeysEmptyPreview"),
  "keys-loading": pick(api, "KeysLoadingPreview"),
  "keys-error": pick(api, "KeysErrorPreview"),
  "keys-table": pick(api, "KeysTablePreview"),
  "step-indicator-1": pick(api, "StepIndicator1Preview"),
  "step-indicator-2": pick(api, "StepIndicator2Preview"),
  "step-indicator-3": pick(api, "StepIndicator3Preview"),
  "step-indicator-4": pick(api, "StepIndicator4Preview"),
  step1: pick(api, "Step1Preview"),
  step2: pick(api, "Step2Preview"),
  "step2-invalid": pick(api, "Step2InvalidPreview"),
  step3: pick(api, "Step3Preview"),
  "step3-error": pick(api, "Step3ErrorPreview"),
  step4: pick(api, "Step4Preview"),
  "step4-copied": pick(api, "Step4CopiedPreview"),
  "wizard-shell": pick(api, "WizardShellPreview"),
  "revoke-dialog": pick(api, "RevokeDialogPreview"),
  "developers-mobile-tiers": pick(api, "DevelopersMobileTiersPreview"),

  /* -------- Wallet · Dual-Account 2b -------- */
  "wallet-equity-bands": pick(wallet, "WalletEquityBandsPreview"),
  "wallet-transfer-normal": pick(wallet, "TransferFormNormalPreview"),
  "wallet-transfer-insufficient": pick(wallet, "TransferFormInsufficientPreview"),
  "wallet-transfer-zero": pick(wallet, "TransferFormZeroPreview"),
  "wallet-deposit-to": pick(wallet, "DepositToPickerPreview"),
  "wallet-equity-hovercard": pick(wallet, "EquityHoverCardPreview"),
  "wallet-tx-history": pick(wallet, "TransactionHistoryPreview"),
  "wallet-account-badge-legend": pick(wallet, "AccountBadgeLegendPreview"),

  /* -------- Settlements -------- */
  "settlement-row-futures-win-desktop": pick(settlements, "SettlementFuturesWinDesktopPreview"),
  "settlement-row-spot-settled-desktop": pick(settlements, "SettlementSpotSettledDesktopPreview"),
  "settlement-row-spot-closed-desktop": pick(settlements, "SettlementSpotClosedDesktopPreview"),
  "settlement-row-futures-win-mobile": pick(settlements, "SettlementFuturesWinMobilePreview"),
  "settlement-row-spot-settled-mobile": pick(settlements, "SettlementSpotSettledMobilePreview"),
  "settlement-row-spot-closed-mobile": pick(settlements, "SettlementSpotClosedMobilePreview"),
  "product-line-badge-legend": pick(settlements, "ProductLineBadgeLegendPreview"),
  "resolved-market-card-spot": pick(settlements, "ResolvedMarketCardSpotPreview"),
  "market-search-row-spot": pick(settlements, "MarketSearchRowSpotPreview"),

  /* -------- Rewards / Campaigns -------- */
  "rewards-campaign-cards": pick(rewards, "CampaignCardStatesPreview"),
  "rewards-grant-rows": pick(rewards, "GrantTaskRowStatesPreview"),
  "rewards-kol-band": pick(rewards, "KolBandPreview"),
  "rewards-ended-archive": pick(rewards, "EndedArchivePreview"),
  "rewards-ended-detail": pick(rewards, "EndedCampaignDetailPreview"),
  "rewards-points-notice": pick(rewards, "PointsRetiredNoticePreview"),
  "rewards-signin-prompt": pick(rewards, "SignInPromptPreview"),
  "rewards-referral-panels": pick(rewards, "ReferralPanelPreview"),
  "rewards-fine-print": pick(rewards, "RewardsFinePrintPreview"),
  "rewards-campaign-rules": pick(rewards, "CampaignRulesDisclosurePreview"),
  "rewards-ineligible-redirect": pick(rewards, "CampaignIneligibleRedirectPreview"),
  "rewards-taskrow-playground": pick(rewards, "GrantTaskRowPlaygroundPreview"),
  "rewards-taskrow-board": pick(rewards, "GrantTaskRowBoardPreview"),

  /* -------- Funding flows -------- */
  "wallet-deposit-to-screen": pick(funding, "DepositToScreenPreview"),
  "wallet-deposit-checklist": pick(funding, "DepositChecklistPreview"),
  "wallet-deposit-address": pick(funding, "DepositAddressPreview"),
  "wallet-withdraw-form": pick(funding, "WithdrawFormPreview"),
  "wallet-withdraw-address-drawer": pick(funding, "WithdrawAddressDrawerPreview"),
  "wallet-withdraw-address-add": pick(funding, "WithdrawAddressAddStepPreview"),
  "wallet-withdraw-verify": pick(funding, "WithdrawVerifyPreview"),
  "wallet-withdraw-status": pick(funding, "WithdrawStatusPreview"),
  "wallet-account-picker": pick(funding, "AccountPickerDrawerPreview"),
  "wallet-address-delete": pick(funding, "AddressDeleteDrawerPreview"),
};

export type PreviewKey = keyof typeof previewRegistry;
