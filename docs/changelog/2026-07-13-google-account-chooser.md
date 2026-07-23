# 2026-07-13 — Google 账号选择器仿真（固定身份自然入口）

> 登录 `Sign in with Google` 由 1.2s 假 OAuth loading 升级为高保真「Choose an account」选择器。两个固定 demo 账号（matched / welcome）以 **Alex Carter** / **Mia Reyes** 的身份出现在选择器里，点选即登录并跳过 onboarding，解决跨站验收（Sports 子站等）"要去 /style-guide 才能拿到固定身份"的问题。产品面 UI 语义纯 Google，**绝无 demo / test 字样**。
>
> 相关：`mem://features/demo-accounts-fixed-identities`（已同步更新）· `docs/backend-boundary.md`

## 1. 动机

- 演示引擎的固定 demo 账号（`ensure-demo-user` scenario `matched` / `welcome`）是我们跨模块、跨站验收的唯一"稳定身份"。
- 此前只能从 `/style-guide` → UserIdentity → `Demo accounts (QA only)` 触发，跨站验收极不自然（例如 Sports 子站要 QA 先跳回主站 style-guide 登录再回来）。
- 需要一个**自然的、产品面看不出破绽**的固定身份入口 —— 落地为伪装成真 Google 账号的选择器。

## 2. 前后对比

| | 改造前 | 改造后 |
|---|---|---|
| 点击 `Sign in with Google` | 1200ms 假 loading → `signInAnonymously` → 生成匿名新号 → onboarding 3 步 | 弹出 `GoogleAccountChooser`（桌面 Dialog / 移动 bottom sheet） |
| 固定身份入口 | 只有 `/style-guide` `DemoAccountsBlock` | Chooser 里两行常驻账号（Alex Carter · Mia Reyes） |
| 匿名新号入口 | 默认路径 | Chooser 第 3 行 `Use another account`（行为完全不变） |
| Chooser 视觉 | — | 顶部 Google G logo + `Choose an account` + `to continue to OMENX`；账号行 avatar + name + email + hover 高亮；底部 Google 风格分享提示 |

## 3. 身份映射

| Chooser 显示 | 底层 scenario | auth email（凭据） | profile.email | avatar |
|---|---|---|---|---|
| Alex Carter · alex.carter@gmail.com | `matched` | `demo.matched@omenx.dev` | `alex.carter@gmail.com` | dicebear seed=felix bg=b6e3f4 |
| Mia Reyes · mia.reyes@gmail.com | `welcome` | `demo.welcome@omenx.dev` | `mia.reyes@gmail.com` | dicebear seed=mia bg=ffd5dc |

- `profiles.username / email / avatar_url` 已由 PM 手工更新，登录后全站身份显示一致
- `useAirdropPositions` 的 `pickMockByEmail` 依赖的仍是 **auth email**（`demo.*@omenx.dev`），因此空投弹窗行为不变

## 4. 分支行为

- **选 Alex / Mia**：`ensure-demo-user` → `signInWithPassword` → `toast("Welcome back, {name}")` → 直接 `onSuccess()` 关弹窗，**跳过** `createWallet` / `completeProfile` 两步（本质上他们就是老用户）
- **Use another account**：关 Chooser → 回落到现有 `handleDemoLogin("google")` 匿名 3 步流程，行为**完全不变**
- **Wallet / Telegram 两个 tab**：完全没动

## 5. 产品面禁止 demo 字样

- Chooser 组件 (`GoogleAccountChooser.tsx`) 与账号数据 (`FIXED_ACCOUNTS`) 全部使用真人名 / gmail.com 邮箱 / dicebear 头像
- toast 文案 `Welcome back, Alex Carter` / `Welcome back, Mia Reyes`
- 现有 `/style-guide` 的 `Demo accounts (QA only)` `DemoAccountsBlock` 保持不动（QA 直接触发通道），并新增 `GoogleAccountChooser` playground（`previewOnly`，只 toast 不真登录）

## 6. 红线（研发必读）

- `signInAnonymously()` = 🔴 **仅演示**（见 `docs/backend-boundary.md`）
- 本次的 Google 账号选择器 = 🔴 **仿真**，不是真 OAuth；账号选择本质是 `ensure-demo-user` + `signInWithPassword`
- 正式版必须替换为**真实 OAuth**（Google Identity Services / Supabase Managed Google OAuth）+ **OTP / password / passkey** 体系
- 正式版对齐：真 OAuth 选到已注册用户 = 直接进站不重复 onboarding（等价于当前固定账号分支）；新账号才进入 createWallet / completeProfile

## 7. 变更文件

- 新增 `src/components/auth/GoogleAccountChooser.tsx`（组件 + `FIXED_ACCOUNTS` + `GoogleAccountChooserBody`）
- 编辑 `src/components/auth/AuthContent.tsx`：Google 按钮 → 打开 Chooser；固定账号成功 → 直接 `onSuccess()`；匿名分支 → 复用 `handleDemoLogin("google")`
- 编辑 `src/pages/StyleGuide/sections/UserIdentitySection.tsx`：新增 `Google account chooser` SubSection（preview-only）
- 更新 `.lovable/memory/features/demo-accounts-fixed-identities.md`
