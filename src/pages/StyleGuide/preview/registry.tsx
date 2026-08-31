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
const walletLite = () => import("./walletLitePreviews");
const h2e = () => import("./h2ePreviews");
const autoClose = () => import("./autoClosePreviews");
const auth = () => import("./authPreviews");
const events = () => import("./eventsPreviews");
const homeStage = () => import("./homeStagePreviews");
const trade = () => import("./tradePreviews");
const spot = () => import("./spotPreviews");
const share = () => import("./sharePreviews");


export const previewRegistry: Record<string, Loader> = {
  /* -------- Events 列表（M1a 分区①–④）-------- */
  "events-ev1": pick(homeStage, "Ev1Preview"),
  "events-ev2": pick(events, "Ev2Preview"),
  "events-ev3": pick(events, "Ev3Preview"),
  "events-ev4": pick(events, "Ev4Preview"),
  "events-ev5": pick(homeStage, "Ev5Preview"),
  "events-ev6": pick(homeStage, "Ev6Preview"),
  "events-ev7": pick(homeStage, "Ev7Preview"),
  "events-ev8": pick(homeStage, "Ev8Preview"),
  "events-ev9": pick(homeStage, "Ev9Preview"),
  "events-ev9e": pick(homeStage, "Ev9ePreview"),
  "events-ev10": pick(homeStage, "Ev10Preview"),
  "events-ev11": pick(events, "Ev11Preview"),
  "events-ev12": pick(events, "Ev12Preview"),
  "events-ev13": pick(events, "Ev13Preview"),
  "events-ev14": pick(events, "Ev14Preview"),
  "events-ev15": pick(events, "Ev15Preview"),
  "events-ev16": pick(events, "Ev16Preview"),
  "events-ev17": pick(events, "Ev17Preview"),
  "events-ev18": pick(events, "Ev18Preview"),
  /* -------- Events 列表（M1b 分区⑤–⑧）--------
     EV-24 / EV-25 reuse the shipped skeleton keys below
     (`lite-events-loading` / `lite-events-loading-catalogue`) — kept as-is so
     old deep links stay valid; the Events page references them by new number. */
  "events-ev19": pick(events, "Ev19Preview"),
  "events-ev20": pick(events, "Ev20Preview"),
  "events-ev21": pick(events, "Ev21Preview"),
  "events-ev22": pick(events, "Ev22Preview"),
  "events-ev23": pick(events, "Ev23Preview"),
  "events-ev24": pick(homeStage, "Ev24Preview"),
  "events-ev25": pick(homeStage, "Ev25Preview"),
  "events-ev26": pick(events, "Ev26Preview"),
  "events-ev27": pick(homeStage, "Ev27Preview"),
  "events-ev28": pick(homeStage, "Ev28Preview"),
  "events-ev29": pick(homeStage, "Ev29Preview"),
  "events-ev30": pick(homeStage, "Ev30Preview"),
  "events-ev31": pick(homeStage, "Ev31Preview"),
  "events-ev32": pick(homeStage, "Ev32Preview"),
  "events-ev33": pick(homeStage, "Ev33Preview"),
  "events-ev34": pick(homeStage, "Ev34Preview"),
  "events-ev35": pick(homeStage, "Ev35Preview"),

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
  "portfolio-lite-voucher-hairline": pick(portfolio, "PortfolioVoucherHairlinePreview"),
  "portfolio-lite-select-entry": pick(portfolio, "PortfolioSelectEntryPreview"),
  "portfolio-lite-kpi-mobile": pick(portfolio, "PortfolioKpiMobilePreview"),
  "portfolio-lite-kpi-desktop": pick(portfolio, "PortfolioKpiDesktopPreview"),
  "portfolio-lite-kpi-settled": pick(portfolio, "PortfolioKpiSettledPreview"),
  "portfolio-lite-kpi-settled-mobile": pick(portfolio, "PortfolioKpiSettledMobilePreview"),

  "portfolio-lite-gauge-states": pick(portfolio, "PortfolioGaugeStatesPreview"),
  "portfolio-lite-gauge-bar": pick(portfolio, "PortfolioGaugeBarPreview"),
  "portfolio-lite-live-cards": pick(portfolio, "PortfolioLiveCardsPreview"),
  "portfolio-lite-desktop-rows": pick(portfolio, "PortfolioDesktopRowsPreview"),
  "portfolio-lite-settled": pick(portfolio, "PortfolioSettledListPreview"),
  "portfolio-lite-empty": pick(portfolio, "PortfolioEmptyStatesPreview"),
  "portfolio-lite-auth-gate-out": pick(portfolio, "PortfolioAuthGateSignedOutPreview"),
  "portfolio-lite-auth-gate-in": pick(portfolio, "PortfolioAuthGateSignedInPreview"),

  "portfolio-lite-details-drawer": pick(portfolio, "PortfolioDetailsDrawerPreview"),
  "portfolio-lite-details-popover": pick(portfolio, "PortfolioDetailsPopoverPreview"),
  "portfolio-lite-pending-desktop": pick(portfolio, "PortfolioPendingDesktopPreview"),
  "portfolio-lite-settled-loadmore": pick(portfolio, "PortfolioSettledLoadMorePreview"),
  "portfolio-lite-settled-collapse": pick(portfolio, "PortfolioSettledListPreview"),
  "portfolio-lite-live-select": pick(portfolio, "PortfolioLiveSelectPreview"),
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

  "portfolio-lite-airdrop-tag-rows": pick(portfolio, "PortfolioAirdropTagRowsPreview"),
  "portfolio-lite-airdrop-tag-cards": pick(portfolio, "PortfolioAirdropTagCardsPreview"),

  /* -------- Portfolio 状态字典 Ⓓ–Ⓕ（M6a-② · PF-9…PF-18）-------- */
  "portfolio-lite-side-chip": pick(portfolio, "PortfolioSideChipPreview"),
  "portfolio-lite-side-chip-mobile": pick(portfolio, "PortfolioSideChipMobilePreview"),
  "portfolio-lite-hot": pick(portfolio, "PortfolioHotPreview"),
  "portfolio-lite-hot-mobile": pick(portfolio, "PortfolioHotMobilePreview"),
  "portfolio-lite-standard-live": pick(portfolio, "PortfolioStandardLivePreview"),
  "portfolio-lite-standard-live-mobile": pick(portfolio, "PortfolioStandardLiveMobilePreview"),
  "portfolio-lite-settles-time": pick(portfolio, "PortfolioSettlesTimePreview"),
  "portfolio-lite-settles-time-mobile": pick(portfolio, "PortfolioSettlesTimeMobilePreview"),
  "portfolio-lite-pending-mobile": pick(portfolio, "PortfolioPendingMobilePreview"),
  "portfolio-lite-live-select-desktop": pick(portfolio, "PortfolioLiveSelectDesktopPreview"),
  "portfolio-lite-batch-bar": pick(portfolio, "PortfolioBatchBarPreview"),
  "portfolio-lite-batch-bar-mobile": pick(portfolio, "PortfolioBatchBarMobilePreview"),
  "portfolio-lite-batch-confirm": pick(portfolio, "PortfolioBatchConfirmPreview"),
  "portfolio-lite-batch-confirm-mobile": pick(portfolio, "PortfolioBatchConfirmMobilePreview"),
  "portfolio-lite-batch-closing": pick(portfolio, "PortfolioBatchClosingPreview"),
  "portfolio-lite-batch-closing-mobile": pick(portfolio, "PortfolioBatchClosingMobilePreview"),

  /* -------- Auto-close (two-state value grammar) -------- */
  "autoclose-desktop-rows": pick(autoClose, "AutoCloseDesktopRowsPreview"),
  "autoclose-standard-row": pick(autoClose, "AutoCloseStandardRowPreview"),
  "autoclose-mobile-cards": pick(autoClose, "AutoCloseMobileCardsPreview"),
  "autoclose-position-none": pick(autoClose, "AutoClosePositionNonePreview"),
  "autoclose-position-hot": pick(autoClose, "AutoClosePositionHotPreview"),
  "autoclose-position-level": pick(autoClose, "AutoClosePositionLevelPreview"),
  "autoclose-order-panel-states": pick(autoClose, "AutoCloseOrderPanelStatesPreview"),
  "autoclose-order-panel-partial-net": pick(autoClose, "AutoCloseOrderPanelPartialNetPreview"),

  /* -------- H2E campaign -------- */
  "h2e-card-s0": pick(h2e, "H2eCardS0Preview"),
  "h2e-card-s1": pick(h2e, "H2eCardS1Preview"),
  "h2e-card-s2-scanning": pick(h2e, "H2eCardS2ScanningPreview"),
  "h2e-card-s2-plural": pick(h2e, "H2eCardS2PluralPreview"),
  "h2e-card-s2-singular": pick(h2e, "H2eCardS2SingularPreview"),
  "h2e-card-s2-none": pick(h2e, "H2eCardS2NonePreview"),
  "h2e-card-s3": pick(h2e, "H2eCardS3Preview"),
  "h2e-conn-disconnected": pick(h2e, "H2eConnectedDisconnectedPreview"),
  "h2e-conn-linked": pick(h2e, "H2eConnectedLinkedPreview"),
  "h2e-airdrops-all": pick(h2e, "H2eAirdropsAllStatesPreview"),
  "h2e-airdrops-welcome": pick(h2e, "H2eAirdropsWelcomePreview"),
  "h2e-airdrops-mobile": pick(h2e, "H2eAirdropsMobilePreview"),
  "h2e-rewards-s1": pick(h2e, "H2eRewardsS1Preview"),
  "h2e-rewards-s2": pick(h2e, "H2eRewardsS2Preview"),
  "h2e-rewards-s2-scanning": pick(h2e, "H2eRewardsS2ScanningPreview"),
  "h2e-rewards-s2-none": pick(h2e, "H2eRewardsS2NonePreview"),
  "h2e-rewards-s3": pick(h2e, "H2eRewardsS3Preview"),
  "h2e-rewards-s3-disconnected": pick(h2e, "H2eRewardsS3DisconnectedPreview"),
  "h2e-aside-signed-out": pick(h2e, "H2eAsideSignedOutPreview"),


  /* -------- Lite events -------- */
  "lite-events-loading": pick(liteEvents, "LiteEventsLoadingPreview"),
  "lite-events-loading-catalogue": pick(liteEvents, "LiteEventsCatalogueLoadingPreview"),

  /* -------- Trade 交易页（M2b · mock11 终版 TR-1…TR-24）-------- */
  "trade-tr1": pick(trade, "Tr1Preview"),
  "trade-tr2": pick(trade, "Tr2Preview"),
  "trade-tr3": pick(trade, "Tr3Preview"),
  "trade-tr4": pick(trade, "Tr4Preview"),
  "trade-tr5": pick(trade, "Tr5Preview"),
  "trade-tr6": pick(trade, "Tr6Preview"),
  "trade-tr7": pick(trade, "Tr7Preview"),
  "trade-tr8": pick(trade, "Tr8Preview"),
  "trade-tr9": pick(trade, "Tr9Preview"),
  "trade-tr10": pick(trade, "Tr10Preview"),
  "trade-tr11": pick(trade, "Tr11Preview"),
  "trade-tr12": pick(trade, "Tr12Preview"),
  "trade-tr13": pick(trade, "Tr13Preview"),
  "trade-tr14": pick(trade, "Tr14Preview"),
  "trade-tr15": pick(trade, "Tr15Preview"),
  "trade-tr16": pick(trade, "Tr16Preview"),
  "trade-tr17": pick(trade, "Tr17Preview"),
  "trade-tr18": pick(trade, "Tr18Preview"),
  "trade-tr19": pick(trade, "Tr19Preview"),
  "trade-tr20": pick(trade, "Tr20Preview"),
  "trade-tr21": pick(trade, "Tr21Preview"),
  "trade-tr22": pick(trade, "Tr22Preview"),
  "trade-tr23": pick(trade, "Tr23Preview"),
  "trade-tr24": pick(trade, "Tr24Preview"),

  /* -------- Spot 现货轮（M2c · SP-1…SP-16；缺口 SP-1/2/9/15/16 见 SpotStatesSection）-------- */
  "spot-sp1": pick(spot, "Sp1Preview"),
  "spot-sp2": pick(spot, "Sp2Preview"),
  "spot-sp3": pick(spot, "Sp3Preview"),
  "spot-sp4": pick(spot, "Sp4Preview"),
  "spot-sp5": pick(spot, "Sp5Preview"),
  "spot-sp6": pick(spot, "Sp6Preview"),
  "spot-sp7": pick(spot, "Sp7Preview"),
  "spot-sp8": pick(spot, "Sp8Preview"),
  "spot-sp9": pick(spot, "Sp9Preview"),
  "spot-sp10": pick(spot, "Sp10Preview"),
  "spot-sp11": pick(spot, "Sp11Preview"),
  "spot-sp12": pick(spot, "Sp12Preview"),
  "spot-sp13": pick(spot, "Sp13Preview"),
  "spot-sp14": pick(spot, "Sp14Preview"),
  "spot-sp15": pick(spot, "Sp15Preview"),
  "spot-sp16": pick(spot, "Sp16Preview"),
  "spot-sp17": pick(homeStage, "Sp17Preview"),
  "spot-sp18": pick(homeStage, "Sp18Preview"),

  /* -------- Share 晒单（SH-b · SH-1…SH-8）-------- */
  "share-sh1": pick(share, "Sh1Preview"),
  "share-sh2": pick(share, "Sh2Preview"),
  "share-sh3": pick(share, "Sh3Preview"),
  "share-sh4": pick(share, "Sh4Preview"),
  "share-sh5": pick(share, "Sh5Preview"),
  "share-sh6": pick(share, "Sh6Preview"),
  "share-sh7": pick(share, "Sh7Preview"),
  "share-sh8": pick(share, "Sh8Preview"),

  /* -------- Sports game lines（旧节复用，M2c 并账时清理）-------- */
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

  /* -------- Wallet Lite R1 (batches 1-3) -------- */
  "wallet-lite-address-rows-desktop": pick(walletLite, "SavedAddressRowsDesktopPreview"),
  "wallet-lite-address-rows-mobile": pick(walletLite, "SavedAddressRowsMobilePreview"),
  "wallet-lite-address-actions": pick(walletLite, "SavedAddressActionsDrawerPreview"),
  "wallet-lite-address-actions-default": pick(walletLite, "SavedAddressActionsDrawerDefaultPreview"),
  "wallet-lite-product-badges": pick(walletLite, "ProductLineBadgePairPreview"),
  "wallet-lite-tx-icon-matrix": pick(walletLite, "TxIconMatrixPreview"),
  "wallet-lite-hero-note-lite": pick(walletLite, "HeroEquityNoteLitePreview"),

  /* -------- Wallet audit round (2026-08-27) · W-1 … W-16 -------- */
  "wallet-lite-pending-confirmations": pick(walletLite, "PendingConfirmationsDesktopPreview"),
  "wallet-lite-pending-confirmations-mobile": pick(walletLite, "PendingConfirmationsMobilePreview"),
  "wallet-lite-tx-empty": pick(walletLite, "TxEmptyPreview"),
  "wallet-lite-tx-empty-filtered": pick(walletLite, "TxEmptyFilteredPreview"),
  "wallet-lite-tx-transfer-legs": pick(walletLite, "TxTransferLegsPreview"),
  "wallet-lite-tx-status-column": pick(walletLite, "TxStatusMatrixPreview"),
  "wallet-lite-tx-unknown-type": pick(walletLite, "TxUnknownTypePreview"),
  "wallet-lite-tx-expanded": pick(walletLite, "TxExpandedDetailPreview"),
  "wallet-lite-tx-pro-only-types": pick(walletLite, "TxProOnlyTypesPreview"),
  "wallet-lite-address-empty": pick(walletLite, "SavedAddressesEmptyPreview"),
  "wallet-lite-hero-hidden": pick(walletLite, "HeroEquityHiddenPreview"),
  "wallet-deposit-dialog-checklist": pick(walletLite, "DepositDialogChecklistPreview"),
  "wallet-deposit-dialog-address": pick(walletLite, "DepositDialogAddressPreview"),
  "wallet-deposit-dialog-fiat": pick(walletLite, "DepositDialogFiatPreview"),
  "wallet-deposit-dialog-wallet-tab": pick(walletLite, "DepositDialogWalletTabPreview"),
  "wallet-withdraw-desktop-form": pick(walletLite, "WithdrawFormDesktopPreview"),
  "wallet-lite-tx-fiat-buy": pick(walletLite, "TxFiatBuyPreview"),

  /* -------- Login / Registration (2026-08-27) · AU-* -------- */
  "auth-login-google": pick(auth, "AuthLoginGoogleDefaultPreview"),
  "auth-login-wallet": pick(auth, "AuthLoginWalletTabPreview"),
  "auth-login-telegram": pick(auth, "AuthLoginTelegramTabPreview"),
  "auth-login-loading": pick(auth, "AuthLoginLoadingPreview"),
  "auth-login-mobile": pick(auth, "AuthLoginMobilePreview"),
  "auth-create-desktop": pick(auth, "AuthCreateWalletDesktopPreview"),
  "auth-create-mobile": pick(auth, "AuthCreateWalletMobilePreview"),
  "auth-profile-default": pick(auth, "AuthProfileDefaultPreview"),
  "auth-profile-loading": pick(auth, "AuthProfileLoadingPreview"),
  "auth-profile-email-error": pick(auth, "AuthProfileEmailErrorPreview"),
  "auth-profile-referral-open": pick(auth, "AuthProfileReferralOpenPreview"),
  "auth-profile-referral-prefilled": pick(auth, "AuthProfileReferralPrefilledPreview"),
  "auth-profile-mobile": pick(auth, "AuthProfileMobilePreview"),
  "auth-gate-lite-out": pick(auth, "AuthGateLiteWalletPreview"),
  "auth-gate-lite-in": pick(auth, "AuthGateLiteSignedInPreview"),
  "auth-demo-google-chooser": pick(auth, "AuthGoogleChooserPreview"),


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
