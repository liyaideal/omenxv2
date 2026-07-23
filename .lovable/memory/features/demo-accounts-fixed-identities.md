---
name: Demo accounts for QA
description: Two persistent fixed demo accounts (matched / welcome) for previewing both H2E airdrop states — surfaced only in /style-guide, NOT in production Auth dialog
type: feature
---
**Two persistent demo accounts** for QA preview of the first-login airdrop modal:

- **Matched user (A)** — `demo.matched@omenx.dev` → returns `MOCK_AIRDROPS_MATCHED` (4 matched cards, no welcome_gift)
- **Welcome gift user (B)** — `demo.welcome@omenx.dev` → returns `MOCK_AIRDROPS_WELCOME` (1 welcome_gift card)
- Shared password (internal): `OmenxDemo!2026`

**Where surfaced:**
- **Production Auth dialog** → "Sign in with Google" 触发 `GoogleAccountChooser`（Dialog 桌面 / bottom sheet 移动）里两行固定账号即入口。UI 语义纯 Google，**绝不出现 demo/test 字样**。
  - `Alex Carter · alex.carter@gmail.com`（avatar seed=felix / bg=b6e3f4） → 底层 scenario `matched`
  - `Mia Reyes · mia.reyes@gmail.com`（avatar seed=mia / bg=ffd5dc） → 底层 scenario `welcome`
  - 选固定账号后 toast `Welcome back, {name}` 并直接关闭弹窗，**跳过** createWallet / completeProfile 两步
  - 第 3 行 `Use another account` → 现有 `signInAnonymously` 匿名新号 3 步流程完全不变
- `/style-guide` → UserIdentity section 保留两个 subsection：`GoogleAccountChooser`（preview-only playground）+ `Demo accounts (QA only)` (`DemoAccountsBlock`，QA 直接触发不走弹窗)。

**Mechanism:**
- `supabase/functions/ensure-demo-user` (verify_jwt = false) admin-creates the user idempotently with `email_confirm: true` then returns `{email, password}`.
- `GoogleAccountChooser` / `DemoAccountsBlock` 均调用同一 edge function 后 `signInWithPassword`。
- profiles 行的 `username` / `email` / `avatar_url` 已手工更新为 Alex Carter / Mia Reyes 对应值（auth.users.email 仍为 `demo.matched@omenx.dev` / `demo.welcome@omenx.dev` — 仅登录凭据）。
- `useAirdropPositions.ts` picks mock by `email` via `pickMockByEmail()`（映射 key 使用 auth email，不是 profile email）。任何其他用户（匿名等）fallback 到 `MOCK_AIRDROPS_MATCHED`。
- `useConnectedAccounts` is already user-id scoped via localStorage → two accounts get independent connected-account state automatically.

**Why:** fixed credentialed accounts give us repeatable, comparable QA / demo / screenshot flows that survive sign-out (unlike `signInAnonymously`). 通过高保真 Google 账号选择器把它们伪装成两个"真实老用户"，解决跨站（Sports 子站等）验收时"去哪找固定身份"的问题。

**Red line:** `signInAnonymously` + Google 账号选择器仿真均为 🔴 仅演示范畴（见 `docs/backend-boundary.md`），正式版必须替换为真实 OAuth / OTP 体系；届时账号选择器 UI 结构可保留但落地到真 Google Identity Services。
