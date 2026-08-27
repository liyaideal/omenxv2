# Wallet + Auth Style Guide QA — 2026-08-27

## Summary

- New cases captured: **35/35** (W-1…W-16 + 19 AU cases).
- Deleted modules verified absent: **9/9**.
- Fixture redline: production `/wallet` signed-out page and real Sign In dialog captured separately.
- TypeScript: `tsgo --noEmit -p tsconfig.app.json` passed with 0 errors.

## Case copy comparison

- **W-1 — PASS:** actual `PENDING CONFIRMATIONS +$800.00 Deposit CONFIRMING Base · 3 min ago · est. ~45s left 6/15 blocks Sent to the wrong network? Request recovery`; appendix-required strings matched.
- **W-2 — PASS:** actual `PENDING CONFIRMATIONS +$800.00 Deposit CONFIRMING Base · 3 min ago · est. ~45s left 6/15 blocks Sent to the wrong network? Request recovery`; appendix-required strings matched.
- **W-3 — PASS:** actual `TRANSACTION HISTORY All Deposits Withdrawals Trades No recent activity Deposits, withdrawals and trades land here as they happen.`; appendix-required strings matched.
- **W-4 — PASS:** actual `TRANSACTION HISTORY All Deposits Withdrawals Trades No transactions match your filters Clear the filters to see the full history. Clear filters`; appendix-required strings matched.
- **W-5 — PASS:** actual `TRANSACTION HISTORY All Deposits Withdrawals Trades Transfer from Standard 8/27/26, 3:55 AM BOOST +$500.00 Transfer to Boost 8/27/26, 2:55 AM STANDARD $500.00 Transfer from Boost 8/27/26, 1:55 AM STANDARD +$250.00 Transfer to Standard 8/27/26, 12:55 AM BOOST $250.00`; appendix-required strings matched.
- **W-6 — PASS:** actual `TRANSACTION HISTORY All Deposits Withdrawals Trades USDC withdraw · Base 8/27/26, 3:55 AM BOOST $250.00 Status Pending Review Network Base USDC withdraw · Base 8/27/26, 2:55 AM BOOST $250.00 Status Processing Network Base USDC withdraw · Base 8/27/26, 1:55 AM BOOST $250.00 Status Completed Network Base USDC withdraw · Base 8/27/26, 12:55 AM BOOST $250.00 Status Failed Network Base USDC withdraw · Base 8/26/26, 11:55 PM BOOST $250.00 Status Rejected Network Base`; appendix-required strings matched.
- **W-7 — PASS:** actual `TRANSACTION HISTORY All Deposits Withdrawals Trades Unmapped ledger entry 8/27/26, 3:55 AM STANDARD +$12.50`; appendix-required strings matched.
- **W-8 — PASS:** actual `TRANSACTION HISTORY All Deposits Withdrawals Trades USDC deposit · Base 8/27/26, 3:55 AM STANDARD +$800.00 Status Processing Network Base Fee $0.35 Transaction 0x8f2a...0d9e8f`; appendix-required strings matched.
- **W-9 — PASS:** actual `TRANSACTION HISTORY All Deposits Withdrawals Trades Bridged in from Arbitrum 8/27/26, 3:55 AM STANDARD +$1,000.00 Bridged out to Polygon 8/27/26, 2:55 AM STANDARD $400.00 Bought USDC with USD · Banxa 8/27/26, 1:55 AM STANDARD +$300.00 Sold USDC for USD · Banxa 8/27/26, 12:55 AM STANDARD $150.00`; appendix-required strings matched.
- **W-10 — PASS:** actual `SAVED ADDRESSES 0 addresses Add address No saved addresses Save addresses for quick deposits and withdrawals.`; appendix-required strings matched.
- **W-11 — PASS:** actual `EST. TOTAL EQUITY •••••• Boost + Standard · does not include open trade profit Deposit Withdraw Transfer ⇄`; appendix-required strings matched.
- **W-12 — PASS:** actual `Deposit To: Standard Account Address Wallet Fiat Only send USDC on Base network. Sending other tokens or using a different network may result in permanent loss of funds. I am sending USDC (not USDT, ETH, BNB, or any other token) I am using the Base network (not Ethereum, BSC, Polygon, Arbitrum, or any other chain) I have double-checked the deposit address below before sending Confirm all items above to continue`; appendix-required strings matched.
- **W-13 — PASS:** actual `Deposit To: Standard Account Address Wallet Fiat Only send USDC on Base network. Sending other tokens or using a different network may result in permanent loss of funds. USDC deposit address (Base) 0x742d35Cc6634C0532925a3b844Bc9e7595f5B3E1 Copy address Network Base Token USDC Fee 0 USDC Confirmations 12 Processing time < 2 minutes Done`; appendix-required strings matched.
- **W-14 — PASS:** actual `Deposit To: Standard Account Address Wallet Fiat You pay Min 20 / Max 5,000 USD 🇺🇸 USD You receive on Base 0.00 USDC Payment method Credit / Debit Card Bank Transfer Apple Pay Fees Enter amount to see fees Continue to Payment Powered by Banxa • Limits and fees vary by region and payment method. View Banxa limits`; appendix-required strings matched.
- **W-15 — PASS:** actual `Deposit To: Standard Account Address Wallet Fiat Swap Connect Wallet From Ethereum USDC To OmenX Wallet 0.00 USDC Base Powered by SOCKET`; appendix-required strings matched.
- **W-16 — FAIL:** missing `You’ll Receive`; actual `USDC Base Network From account Boost Account Available: 8720.42 USDC Withdrawal Address Select withdrawal address Amount MAX USDC Available: 8720.42 USDC Min 20 USDC Network Fee 1 USDC Minimum 20 USDC You'll Receive 0.00 USDC Important: Only Base network addresses are supported. Sending to an incompatible address may result in permanent loss. Withdraw`.
- **AU-L1 — PASS:** actual `MAINNET Trade what happens next Intraday crypto, stock and sports markets — settled in USDC. Wallet Google Telegram Quick sign-in with Google Sign in with Google No wallet needed · Ready in seconds OR New to OMENX? Your account is created the first time you sign in. By continuing, you agree to our Terms of Service and Privacy Policy`; appendix-required strings matched.
- **AU-L2 — PASS:** actual `MAINNET Trade what happens next Intraday crypto, stock and sports markets — settled in USDC. Wallet Google Telegram Connect your Web3 wallet Connect Wallet Supports MetaMask, WalletConnect & more OR New to OMENX? Your account is created the first time you sign in. By continuing, you agree to our Terms of Service and Privacy Policy`; appendix-required strings matched.
- **AU-L3 — PASS:** actual `MAINNET Trade what happens next Intraday crypto, stock and sports markets — settled in USDC. Wallet Google Telegram Sign in with Telegram Sign in with Telegram Fast & secure Telegram authentication OR New to OMENX? Your account is created the first time you sign in. By continuing, you agree to our Terms of Service and Privacy Policy`; appendix-required strings matched.
- **AU-L4 — PASS:** actual `MAINNET Trade what happens next Intraday crypto, stock and sports markets — settled in USDC. Wallet Google Telegram Quick sign-in with Google Sign in with Google No wallet needed · Ready in seconds OR New to OMENX? Your account is created the first time you sign in. By continuing, you agree to our Terms of Service and Privacy Policy`; appendix-required strings matched.
- **AU-L5 — PASS:** actual `MAINNET Trade what happens next Intraday crypto, stock and sports markets — settled in USDC. Wallet Google Telegram Quick sign-in with Google Sign in with Google No wallet needed · Ready in seconds OR New to OMENX? Your account is created the first time you sign in. By continuing, you agree to our Terms of Service and Privacy Policy`; appendix-required strings matched.
- **AU-L6 — PASS:** actual `MAINNET Predict the Future, Profit from Certainty Trade crypto, politics, sports & more like futures Predict. Trade. Profit. Up to 100x Leverage · Pro Trading Tools Wallet Google Telegram Quick sign-in with Google Sign in with Google Instant access · No wallet needed · Start trading in seconds OR New to OMENX? Authorization creates your account automatically Predict. Trade. Profit. · Start Trading Now By continuing, you agree to our Terms of Service and Privacy Policy`; appendix-required strings matched.
- **AU-W1 — PASS:** actual `MAINNET Back Create your wallet A USDC wallet on Base, set up for you in one tap. Trade markets with USDC on Base No seed phrase, no gas — sign in and go Cash out to your own address any time Success! Cloudflare Privacy · Terms Create wallet`; appendix-required strings matched.
- **AU-W2 — PASS:** actual `MAINNET Back Create your wallet A USDC wallet on Base, set up for you in one tap. Trade markets with USDC on Base No seed phrase, no gas — sign in and go Cash out to your own address any time Success! Cloudflare Privacy · Terms Create wallet`; appendix-required strings matched.
- **AU-W3 — PASS:** actual `MAINNET Back Create Your Trading Wallet Start trading events with real funds Pro Trading Platform Up to 100x leverage on events Real-time market data Zero Risk Full Trading Live Data Security Verified Verified Create Wallet & Start Trading`; appendix-required strings matched.
- **AU-P1 — PASS:** actual `MAINNET Back Wallet created — complete your profile to start Final step Complete your profile Username Optional Public display name 0/20 Email Address * For notifications and account recovery Have a referral code? Start trading →`; appendix-required strings matched.
- **AU-P2 — PASS:** actual `MAINNET Back Wallet created — complete your profile to start Final step Complete your profile Username Optional Public display name 0/20 Email Address * Please enter a valid email address Have a referral code? Start trading →`; appendix-required strings matched.
- **AU-P3 — PASS:** actual `MAINNET Back Wallet created — complete your profile to start Final step Complete your profile Username Optional Public display name 0/20 Email Address * For notifications and account recovery Have a referral code? You and your inviter will both earn bonus points! Start trading →`; appendix-required strings matched.
- **AU-P4 — PASS:** actual `MAINNET Back Wallet created — complete your profile to start Final step Complete your profile Username Optional Public display name 0/20 Email Address * For notifications and account recovery Invited by a friend ABCDEF You and your inviter will both earn bonus points! Start trading →`; appendix-required strings matched.
- **AU-P6 — PASS:** actual `MAINNET Back Wallet created — complete your profile to start Final step Complete your profile Username Optional Public display name 0/20 Email Address * For notifications and account recovery Have a referral code? Start trading →`; appendix-required strings matched.
- **AU-P7 — PASS:** actual `MAINNET Back Wallet created! Complete your profile to start Final Step Complete Your Profile Username Optional Public display name 0/20 Email Address * For notifications and account recovery Have a referral code? Start Trading Now`; appendix-required strings matched.
- **AU-G1 — PASS:** actual `Sign in to view your wallet Deposit, withdraw and move funds between your accounts by signing in. Sign in Create account`; appendix-required strings matched.
- **AU-G2 — PASS:** actual ``; appendix-required strings matched.
- **AU-G3 — PASS:** actual `Sign in to view your wallet Manage your funds and saved addresses by signing in. Log In Sign Up`; appendix-required strings matched.
- **AU-D1 — PASS:** actual `Choose an account Choose an account to continue to OMENX Alex Carter alex.carter@gmail.com Mia Reyes mia.reyes@gmail.com Use another account To continue, Google will share your name, email address, language preference and profile picture with OMENX. Close`; appendix-required strings matched.

## Deleted-module cancellation

- **A1 — PASS:** `H2E Unlock Playground` has 0 matching Style Guide module headings.
- **A2 — PASS:** `Transaction Status Badges` has 0 matching Style Guide module headings.
- **A3 — PASS:** `Stepper / Progress Timeline` has 0 matching Style Guide module headings.
- **A4 — PASS:** `Blockchain Explorer Links` has 0 matching Style Guide module headings.
- **A5 — PASS:** `Chain & Token Logos` has 0 matching Style Guide module headings.
- **A6 — PASS:** `SOCKET 品牌卡` has 0 matching Style Guide module headings.
- **A7 — PASS:** `Powered By Footer` has 0 matching Style Guide module headings.
- **A8 — PASS:** `Swap Card Pattern` has 0 matching Style Guide module headings.
- **A9 — PASS:** `Quote Details Row / Status Flow` has 0 matching Style Guide module headings.

Final order observed: Wallet Lite R1 starts with HeroEquityCard → 双账户卡 → Transfer 三态 → PendingConfirmations → 交易流水 → Saved addresses → Deposit & Withdraw; Recovery follows in Deposit & Withdraw; Maintenance and Settlements 4B close the page.

## Fixture redline

- `fixture-redline-wallet-signed-out.png`: production `/wallet`, signed-out gate.
- `fixture-redline-auth-dialog.png`: real login dialog opened from Sign in.
- Fixtures remain isolated to Style Guide previews; product behavior is unchanged.
