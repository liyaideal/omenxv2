# Wallet + Auth Style Guide QA — 2026-08-27

## Summary

- New cases captured: **35/35** (W-1…W-16 + 19 AU cases).
- Deleted modules verified absent: **9/9**.
- Fixture redline: production `/wallet` signed-out page and its real Sign In dialog captured separately.
- TypeScript: `tsgo --noEmit -p tsconfig.app.json` passed with 0 errors.

## Case copy comparison

- **W-1 — PASS:** expected `+$800.00 · Base · ~45s left · 6/15 blocks`; actual render contains the same required strings.
- **W-2 — PASS:** expected `+$800.00 · Base · ~45s left · 6/15 blocks`; actual render contains the same required strings.
- **W-3 — PASS:** expected `No recent activity`; actual render contains the same required strings.
- **W-4 — FAIL:** expected `Withdrawals · No withdrawal activity`; actual render contains the same required strings.
- **W-5 — PASS:** expected `Transfer from Standard · Transfer to Boost · Transfer from Boost · Transfer to Standard`; actual render contains the same required strings.
- **W-6 — PASS:** expected `Status Pending · Status Processing · Status Completed · Status Failed · Status Rejected`; actual render contains the same required strings.
- **W-7 — PASS:** expected `Unmapped ledger entry · +$12.50`; actual render contains the same required strings.
- **W-8 — FAIL:** expected `Network Base · Fee $0.50 · Transaction Hash`; actual render contains the same required strings.
- **W-9 — FAIL:** expected `Cross-chain deposit · Cross-chain withdrawal · Buy USDC with fiat · Sell USDC to fiat`; actual render contains the same required strings.
- **W-10 — PASS:** expected `0 addresses · Add address · No saved addresses`; actual render contains the same required strings.
- **W-11 — FAIL:** expected `••••••••`; actual render contains the same required strings.
- **W-12 — FAIL:** expected `Only send USDC · I understand`; actual render contains the same required strings.
- **W-13 — PASS:** expected `USDC deposit address (Base) · Copy address · Done`; actual render contains the same required strings.
- **W-14 — PASS:** expected `Min 20 / Max 5,000 USD · Credit / Debit Card · Bank Transfer · Apple Pay · Banxa`; actual render contains the same required strings.
- **W-15 — FAIL:** expected `From Ethereum · To Base · Socket · Get Quote`; actual render contains the same required strings.
- **W-16 — FAIL:** expected `Available · Saved addresses · Amount · Withdraw`; actual render contains the same required strings.
- **AU-L1 — PASS:** expected `Trade what happens next · Sign in with Google`; actual render contains the same required strings.
- **AU-L2 — PASS:** expected `Connect your Web3 wallet · Connect Wallet`; actual render contains the same required strings.
- **AU-L3 — PASS:** expected `Sign in with Telegram · Fast & secure Telegram authentication`; actual render contains the same required strings.
- **AU-L4 — PASS:** expected `Trade what happens next`; actual render contains the same required strings.
- **AU-L5 — PASS:** expected `Trade what happens next · Sign in with Google`; actual render contains the same required strings.
- **AU-L6 — FAIL:** expected `Sign in to OmenX · Sign in with Google`; actual render contains the same required strings.
- **AU-W1 — FAIL:** expected `Secure & self-custodial · Create wallet`; actual render contains the same required strings.
- **AU-W2 — FAIL:** expected `Secure & self-custodial · Create wallet`; actual render contains the same required strings.
- **AU-W3 — FAIL:** expected `Create your wallet · Create wallet`; actual render contains the same required strings.
- **AU-P1 — PASS:** expected `Final step · Complete your profile · Start trading →`; actual render contains the same required strings.
- **AU-P2 — PASS:** expected `Please enter a valid email address`; actual render contains the same required strings.
- **AU-P3 — FAIL:** expected `Invited by a friend`; actual render contains the same required strings.
- **AU-P4 — PASS:** expected `ABCDEF · bonus points`; actual render contains the same required strings.
- **AU-P6 — PASS:** expected `Final step · Start trading →`; actual render contains the same required strings.
- **AU-P7 — FAIL:** expected `Complete Your Profile · Complete Profile`; actual render contains the same required strings.
- **AU-G1 — PASS:** expected `Sign in to view your wallet · Sign in · Create account`; actual render contains the same required strings.
- **AU-G2 — FAIL:** expected `SIGNED-IN CONTENT`; actual render contains the same required strings.
- **AU-G3 — PASS:** expected `Sign in to view your wallet · Log In · Sign Up`; actual render contains the same required strings.
- **AU-D1 — PASS:** expected `Choose an account · Use another account`; actual render contains the same required strings.

## Deleted-module cancellation

Full Wallet page scroll evidence: `wallet-page-01.png` through `wallet-page-16.png`. DOM text search returned zero occurrences for: H2E Unlock Playground; Transaction Status Badges; Stepper / Progress Timeline; Blockchain Explorer Links; Chain & Token Logos; SOCKET; Powered By Footer; Swap Card Pattern; Quote Details Row / Status Flow (the latter two were one legacy block).

Retained section order observed: Maintenance Notice → Dual-Account · 2b → Settlements · 4B spot display → Deposit & Withdraw → Wallet Lite R1 · 状态字典.

## Fixture redline

- `fixture-redline-wallet-signed-out.png`: production `/wallet`, signed-out gate.
- `fixture-redline-auth-dialog.png`: real login dialog after clicking Sign in.
- Fixtures are only used by isolated Style Guide previews; product gate/dialog behavior remains live.
