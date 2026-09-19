/**
 * 登录 / 注册 — the auth layer as its own page node (2026-08-27 audit round).
 *
 * 16 cases, every one a production component mounted with display-only fixture
 * props (see preview/authPreviews.tsx). Truth Rule §16.1.1 — no hand-copied markup.
 */
import { LitePage } from "./shell";
import { SectionWrapper, SubSection } from "../../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";

const LOGIN_DESKTOP: SectionCase[] = [
  {
    key: "auth-login-google",
    label: "AU-L1 · login · Google tab（默认）· desktop",
    note: "AuthDialog 内的默认落地态：lynx 图 + 'Trade what happens next' + 三 tab 选择器。",
    spec: [
      {
        state: "login · google",
        when: "step === 'login' && authMethod === 'google'",
        visual: "Google 按钮为主 CTA；tab active = bg-[#F2F3F5] text-[#090A0C]",
        source: "AuthContent.tsx isLite 分支",
      },
    ],
  },
  {
    key: "auth-login-wallet",
    label: "AU-L2 · login · Wallet tab · desktop",
    spec: [
      {
        state: "login · wallet",
        when: "authMethod === 'wallet'",
        visual: "钱包签名入口替换 Google 按钮，其余版式不变",
        source: "AuthContent.tsx authMethod 分支",
      },
    ],
  },
  {
    key: "auth-login-telegram",
    label: "AU-L3 · login · Telegram tab · desktop",
    spec: [
      {
        state: "login · telegram",
        when: "authMethod === 'telegram'",
        visual: "Telegram 入口按钮",
        source: "AuthContent.tsx authMethod 分支",
      },
    ],
  },
  {
    key: "auth-login-loading",
    label: "AU-L4 · login · isLoading",
    spec: [
      {
        state: "loading",
        when: "isLoading === true",
        visual: "主 CTA 内 Loader2 自旋并禁用；其余控件不可点",
        source: "AuthContent isLoading",
      },
    ],
  },
];

const LOGIN_MOBILE: SectionCase[] = [
  {
    key: "auth-login-mobile",
    label: "AU-L5 · login · mobile（AuthSheet 抽屉内）",
    note: "AuthSheet = MobileDrawer（max-h-[85vh]，无关闭按钮，VisuallyHidden SheetTitle 'Sign in'）。",
    spec: [
      {
        state: "login · mobile",
        when: "variant === 'mobile'",
        visual: "同 desktop 文案，容器为底部抽屉，顶部 grabber + Logo",
        source: "AuthSheet.tsx + AuthContent.tsx",
      },
    ],
  },
];

const CREATE_CASES: SectionCase[] = [
  {
    key: "auth-create-desktop",
    label: "AU-W1 · createWallet · desktop",
    spec: [
      {
        state: "createWallet",
        when: "step === 'createWallet'",
        visual: "三行 volt 勾价值点 + Turnstile 占位块 + btn-primary 'Create wallet'",
        source: "AuthContent.tsx isLite 分支",
      },
    ],
  },
  {
    key: "auth-create-mobile",
    label: "AU-W2 · createWallet · mobile",
    spec: [
      {
        state: "createWallet · mobile",
        when: "variant === 'mobile'",
        visual: "三行 volt 勾 + Turnstile 占位块（静态，非真实校验）",
        source: "AuthContent.tsx",
      },
    ],
  },
];

const PROFILE_CASES: SectionCase[] = [
  {
    key: "auth-profile-default",
    label: "AU-P1 · completeProfile · 默认 · desktop",
    spec: [
      {
        state: "completeProfile",
        when: "step === 'completeProfile'",
        visual: "volt 横幅 + bg-muted/30 rounded-lg 卡片（username / email）+ btn-primary 'Start trading →'",
        source: "AuthContent.tsx isLite 分支",
      },
    ],
  },
  {
    key: "auth-profile-email-error",
    label: "AU-P2 · completeProfile · email 非法",
    spec: [
      {
        state: "emailError",
        when: "emailError !== ''",
        visual: "email 输入下方红色错误行，提交拦截",
        source: "AuthContent emailError",
      },
    ],
  },
  {
    key: "auth-profile-referral-open",
    label: "AU-P3 · completeProfile · 推荐码输入展开（空）",
    spec: [
      {
        state: "referral open",
        when: "showReferralInput === true && referralCode === ''",
        visual: "折叠链接展开为输入框，placeholder 态",
        source: "AuthContent showReferralInput",
      },
    ],
  },
  {
    key: "auth-profile-referral-prefilled",
    label: "AU-P4 · completeProfile · 推荐码已填（6 位）",
    spec: [
      {
        state: "referral filled",
        when: "referralCode === 'ABCDEF'",
        visual: "6 位大写字母数字码，font-mono",
        source: "AuthContent referralCode",
      },
    ],
  },
  {
    key: "auth-profile-loading",
    label: "AU-P5 · completeProfile · 提交 loading",
    spec: [
      {
        state: "loading",
        when: "isLoading === true",
        visual: "CTA 内 Loader2 自旋 + disabled",
        source: "AuthContent isLoading",
      },
    ],
  },
  {
    key: "auth-profile-mobile",
    label: "AU-P6 · completeProfile · mobile",
    spec: [
      {
        state: "completeProfile · mobile",
        when: "variant === 'mobile'",
        visual: "抽屉内同版式",
        source: "AuthContent.tsx",
      },
    ],
  },
];

const GATE_CASES: SectionCase[] = [
  {
    key: "auth-gate-lite-out",
    label: "AU-G1 · LiteAuthGate · signed-out",
    note: "全局 Lite 未登录门规范、应用判定与四页文案表。",
    spec: [
      {
        state: "规范 · 组件路径",
        when: "src/components/auth/LiteAuthGate.tsx（2026-09-04 自 portfolio 目录迁出）",
        visual: "全局组件；页面只传 title / description 两个文案 props",
        source: "LiteAuthGate.tsx",
      },
      {
        state: "规范 · 底层与门体",
        when: "!user",
        visual: "底层 children 渲染后 blur-[3px] opacity-70 select-none pointer-events-none aria-hidden；门体 absolute inset-0 z-10 flex items-center justify-center bg-background/40",
        source: "LiteAuthGate.tsx",
      },
      {
        state: "规范 · 插画",
        when: "门体渲染",
        visual: "auth-gate-lynx 120×120 object-contain；desktop /assets/desktop/auth-gate-lynx.png，mobile /assets/mobile/auth-gate-lynx.png；aria-hidden / pointer-events-none / select-none；onError 静默隐藏",
        source: "LiteAuthGate.tsx img",
      },
      {
        state: "规范 · 标题",
        when: "门体渲染",
        visual: "font-display font-semibold text-[19px] tracking-[-0.475px] text-white text-center mt-[18px]",
        source: "LiteAuthGate.tsx h2",
      },
      {
        state: "规范 · 描述",
        when: "门体渲染",
        visual: "text-[13.5px] leading-[1.625] text-[#9CA2AB] text-center max-w-[320px] mx-auto pt-[8px]",
        source: "LiteAuthGate.tsx p",
      },
      {
        state: "规范 · Sign in 主钮",
        when: "门体渲染",
        visual: "linear-gradient(147deg, #D5FF4D 7.7%, #33D6FF 92.3%) 渐变胶囊；rounded-[12px] px-[24px] py-[12px]；font-semibold text-[14px] text-[#090A0B]；drop-shadow-[0_4px_7.5px_rgba(51,214,255,0.3)]；LogIn icon 16px",
        source: "LiteAuthGate.tsx primary button",
      },
      {
        state: "规范 · Create account 副钮",
        when: "门体渲染",
        visual: "h-[44px] rounded-[12px] px-[18px] border-[1.5px] border-[#1C1F26] bg-transparent text-[13px] text-white/80 transition-colors hover:text-white",
        source: "LiteAuthGate.tsx secondary button",
      },
      {
        state: "规范 · 按钮行",
        when: "门体渲染",
        visual: "pt-[22px] flex items-center justify-center gap-[12px]",
        source: "LiteAuthGate.tsx button row",
      },
      {
        state: "应用判定 · Lite 全屏门",
        when: "Lite 页面需要全屏未登录门",
        visual: "必用 LiteAuthGate；禁止自造门样式",
        source: "DESIGN.md Guest gate rule",
      },
      {
        state: "应用判定 · Pro 面",
        when: "Pro 页面需要未登录门",
        visual: "使用 AuthGateOverlay；本组件仅限 Lite 面",
        source: "DESIGN.md Guest gate rule",
      },
      {
        state: "应用判定 · 行内提示",
        when: "局部功能需要登录提示",
        visual: "SignInPromptCard 类行内提示是另一形态，不适用本门",
        source: "DESIGN.md Guest gate rule",
      },
      {
        state: "文案 · portfolio",
        when: "LitePortfolio 页",
        visual: "title: Sign in to view your portfolio；description: Track your live calls and settled results by signing in to your account.",
        source: "LitePortfolio.tsx / default props",
      },
      {
        state: "文案 · wallet",
        when: "Wallet 页",
        visual: "title: Sign in to view your wallet；description: Deposit, withdraw and move funds between your accounts by signing in.",
        source: "Wallet.tsx WalletAuthGate",
      },
      {
        state: "文案 · recovery",
        when: "RecoveryRequest & RecoveryRequestDetail 页",
        visual: "title: Sign in to view your recovery requests；description: Submit or view your recovery requests by signing in to your account.",
        source: "RecoveryRequest.tsx / RecoveryRequestDetail.tsx",
      },
      {
        state: "文案 · API",
        when: "ApiManagement 页",
        visual: "title: Sign in to manage API keys；description: Create and revoke signed keys for programmatic access after signing in.",
        source: "ApiManagement.tsx",
      },
      {
        state: "来源注",
        when: "规则归档",
        visual: "规则原文见 DESIGN.md「Guest gate（Lite 未登录门）— 2026-09-04」",
        source: "DESIGN.md §Guest gate",
      },
    ],
  },
  {
    key: "auth-gate-lite-in",
    label: "AU-G2 · LiteAuthGate · signed-in 透传",
    spec: [
      {
        state: "signed in",
        when: "forceSignedIn === true",
        visual: "children 原样、零覆盖层（真渲染）",
        source: "LiteAuthGate forceSignedIn fixture",
      },
    ],
  },
];

const DIALOG_CASES: SectionCase[] = [
  {
    key: "auth-demo-google-chooser",
    label: "AU-D1 · GoogleAccountChooser（账号选择弹层）",
    note: "DEMO ONLY · 演示设施，不入产品规范",
    spec: [
      {
        state: "chooser open",
        when: "googleChooserOpen === true",
        visual: "'Choose an account / to continue to OMENX' + Alex Carter / Mia Reyes / Use another account",
        source: "GoogleAccountChooser.tsx",
      },
    ],
  },
];

/* ---------------- AU-E · "Other email" step (CPO 2026-09-19) ---------------- */

const EMAIL_DESKTOP: SectionCase[] = [
  {
    key: "auth-email-signin",
    label: "AU-E1 · email · Sign in（默认）· desktop",
    note: "入口：login 步 Google 页签 → 'Other email' 描边副钮（LiteAuthGate Create account 同语法）。本步走向导步语法：顶左 ← Back + 居中 20px 标题 + 13px 副标题；无山猫、无页签。",
    spec: [
      { state: "entry · Other email", when: "step === 'login' && authMethod === 'google'", visual: "Sign in with Google 之下：w-full h-[44px] rounded-[12px] border-[1.5px] border-[#1C1F26] bg-transparent text-[13px] text-white/80 hover:text-white，Mail 16px + 'Other email'；点击 setStep('email')", source: "AuthContent.tsx Google tab" },
      { state: "signin · default", when: "step === 'email' && mode === 'signin'", visual: "标题 'Sign in with email'；副标 'Use the email and password you registered with.'；Email / Password（眼睛显隐）两输入 h-[48px] rounded-[12px] bg-[#14161A] border-[#23262D]，focus border-[#33D6FF]；右对齐 'Forgot password?'（#33D6FF 12px）；btn-primary 'Sign in'；脚注 'New to OMENX? Create account'；条款行", source: "EmailAuthPanel.tsx signin" },
      { state: "Back", when: "signin / signup", visual: "回 login 步（onBack）；verify → signup；forgot / sent → signin", source: "EmailAuthPanel.tsx renderBack" },
      { state: "成功", when: "signInWithPassword ok", visual: "toast 'Welcome back!' → onSuccess 直接关弹窗，不走 createWallet / completeProfile（老用户）", source: "EmailAuthPanel.tsx handleSignIn" },
    ],
  },
  {
    key: "auth-email-signin-error",
    label: "AU-E2 · email · Sign in · 邮箱或密码错误",
    spec: [
      { state: "invalid_credentials", when: "Supabase 'Invalid login credentials'", visual: "两输入框 border-trading-red；Password 下行内红字 'Email or password is incorrect.'（12px text-trading-red）；不用 toast", source: "emailAuth.ts mapAuthError → EMAIL_AUTH_COPY.invalid_credentials" },
      { state: "邮箱格式错", when: "!isValidEmail(email)", visual: "Email 下 'Please enter a valid email address'（与 completeProfile 同句）", source: "EMAIL_AUTH_COPY.invalid_email" },
      { state: "网络等其他错误", when: "code === 'unknown' | 'rate_limited'", visual: "toast.error（唯一走 toast 的错误类）", source: "EmailAuthPanel.tsx" },
    ],
  },
  {
    key: "auth-email-signup",
    label: "AU-E3 · email · Create account（默认）",
    spec: [
      { state: "signup · default", when: "mode === 'signup'", visual: "标题 'Create your account'；副标 'We'll send a 6-digit code to verify your email.'；Email + Password（hint 'At least 8 characters' 12px #6B7280）；btn-primary 'Continue'；脚注 'Already have an account? Sign in'；条款行", source: "EmailAuthPanel.tsx signup" },
      { state: "Continue", when: "isValidEmail && password.length >= 8", visual: "不建号，只进 verify 步并起 60s 重发倒计时；账号在验证码通过后才创建", source: "EmailAuthPanel.tsx handleSignUpContinue" },
    ],
  },
  {
    key: "auth-email-signup-exists",
    label: "AU-E4 · email · Create account · 邮箱已注册",
    spec: [
      { state: "email_exists", when: "signUp 返回 already registered（蓝图站只能在验证码通过后得知；真平台应在发码前查）", visual: "退回 signup 表单；Email 框红边；下行 'This email is already registered.' + 行内 'Sign in' 链接一键切换到 signin", source: "EmailAuthPanel.tsx handleVerify → email_exists" },
    ],
  },
  {
    key: "auth-email-signup-short",
    label: "AU-E5 · email · Create account · 密码过短",
    spec: [
      { state: "weak_password", when: "password.length < 8", visual: "Password 框红边；hint 位置换成红字 'Use at least 8 characters.'", source: "EMAIL_AUTH_COPY.weak_password" },
    ],
  },
  {
    key: "auth-email-verify",
    label: "AU-E6 · email · Verify your email（6 格验证码）",
    note: "🔴 蓝图站固定验证码 111111（DEMO_VERIFY_CODE），界面不露；真平台须发真实验证码。",
    spec: [
      { state: "verify · default", when: "mode === 'verify'", visual: "标题 'Verify your email'；副标 'Enter the 6-digit code we sent to {email}'（邮箱白字）；OTPInput 6 格 w-12 h-12 rounded-[12px] bg-[#14161A] border-[#23262D]，active 格 border-[#33D6FF]，font-display 20px；btn-primary 'Verify & create account'；脚注 'Didn't get it? Resend in {n}s'（#6B7280）→ 0s 后 'Resend code'（#33D6FF）", source: "EmailAuthPanel.tsx verify · input-otp OTPInput" },
      { state: "Resend", when: "cooldown === 0", visual: "重起 60s；toast 'Code sent to {email}'（蓝图站不真发）", source: "EmailAuthPanel.tsx handleResend" },
      { state: "成功", when: "code === DEMO_VERIFY_CODE && signUp ok", visual: "upsertStarterProfile(auth_method='email', email) → toast 'Email verified — welcome to OMENX!' → setStep('createWallet')（新用户走完整 onboarding）", source: "EmailAuthPanel.tsx handleVerify" },
    ],
  },
  {
    key: "auth-email-verify-error",
    label: "AU-E7 · email · Verify · 验证码错误",
    spec: [
      { state: "incorrect_code", when: "code.length !== 6 || code !== DEMO_VERIFY_CODE", visual: "6 格全部 border-trading-red；格下居中红字 'Incorrect code. Try again.'", source: "EMAIL_AUTH_COPY.incorrect_code" },
    ],
  },
  {
    key: "auth-email-forgot",
    label: "AU-E8 · email · Reset your password（忘记密码）",
    spec: [
      { state: "forgot", when: "mode === 'forgot'", visual: "标题 'Reset your password'；副标 'We'll email you a link to set a new password.'；Email 一框；btn-primary 'Send reset link'；无脚注（Back 回 signin）", source: "EmailAuthPanel.tsx forgot" },
      { state: "发送", when: "isValidEmail", visual: "resetPasswordForEmail(redirectTo = origin + '/reset-password')；不论邮箱是否存在都进 sent（不泄露账号存在性）", source: "emailAuth.ts sendPasswordReset" },
    ],
  },
  {
    key: "auth-email-sent",
    label: "AU-E9 · email · Check your inbox（重置链接已发）",
    spec: [
      { state: "sent", when: "mode === 'sent'", visual: "volt 圆形 ✓（w-10 h-10 bg volt/10 border volt/30）+ 标题 'Check your inbox' + 副标 'If an account exists for {email}, we've sent a link to reset your password.'；描边副钮 'Back to sign in'", source: "EmailAuthPanel.tsx sent" },
    ],
  },
];

const EMAIL_MOBILE: SectionCase[] = [
  {
    key: "auth-email-signin-mobile",
    label: "AU-E10 · email · Sign in · mobile",
    spec: [{ state: "signin · mobile", when: "variant === 'mobile'", visual: "AuthSheet 抽屉内同版式，容器 space-y-5；键盘弹起靠抽屉 overflow-y-auto 滚动", source: "EmailAuthPanel.tsx" }],
  },
  {
    key: "auth-email-verify-mobile",
    label: "AU-E11 · email · Verify · mobile",
    spec: [{ state: "verify · mobile", when: "variant === 'mobile'", visual: "6 格 48px + gap 8 = 328px，343px 内容区放得下", source: "EmailAuthPanel.tsx" }],
  },
];

/* ---------------- AU-R · /reset-password ---------------- */

const RESET_DESKTOP: SectionCase[] = [
  {
    key: "auth-reset-form",
    label: "AU-R1 · /reset-password · 填写新密码 · desktop",
    note: "邮件链接落地页。'Forgot password?' 与 Settings › Account security › Password › Change 共用这一页（一条线）。",
    spec: [
      { state: "loading", when: "等待 Supabase recovery session（最多 4s）", visual: "LoadingState 'Checking your reset link…'", source: "ResetPassword.tsx RECOVERY_WAIT_MS" },
      { state: "form", when: "session 到位", visual: "弹窗同款壳（448 / rounded-[16px] / 品牌渐变）居中；Logo modal；标题 'Set a new password' + 'for {email}'；New password（hint 'At least 8 characters'）/ Confirm new password；btn-primary 'Update password'", source: "ResetPassword.tsx form" },
      { state: "success", when: "updateUser ok", visual: "volt ✓ + 'Password updated' + 'You're signed in. Use your new password next time.'；btn-primary 'Go to markets' → /events", source: "ResetPassword.tsx success" },
    ],
  },
  {
    key: "auth-reset-mismatch",
    label: "AU-R2 · /reset-password · 两次密码不一致",
    spec: [{ state: "mismatch", when: "confirm !== password", visual: "Confirm 框红边 + 'Passwords don't match.'", source: "EMAIL_AUTH_COPY.passwords_mismatch" }],
  },
  {
    key: "auth-reset-short",
    label: "AU-R3 · /reset-password · 密码过短",
    spec: [{ state: "short", when: "password.length < 8", visual: "New password 框红边 + 'Use at least 8 characters.'", source: "EMAIL_AUTH_COPY.weak_password" }],
  },
  {
    key: "auth-reset-success",
    label: "AU-R4 · /reset-password · 已更新",
    spec: [{ state: "success", when: "state === 'success'", visual: "见 AU-R1 success 行", source: "ResetPassword.tsx" }],
  },
  {
    key: "auth-reset-expired",
    label: "AU-R5 · /reset-password · 链接失效",
    spec: [{ state: "expired", when: "4s 内无 session", visual: "'This link has expired' + 说明（一次性、1 小时）+ 描边副钮 'Back to markets'", source: "ResetPassword.tsx expired" }],
  },
];

const RESET_MOBILE: SectionCase[] = [
  {
    key: "auth-reset-form-mobile",
    label: "AU-R6 · /reset-password · mobile",
    spec: [{ state: "form · mobile", when: "isMobile", visual: "MobileHeader 'Reset password'（无返回）+ 全出血 px-4，无卡片边框/渐变", source: "ResetPassword.tsx ResetPasswordShell mobile" }],
  },
];

/* ---------------- AU-S · Settings › Account security · Password ---------------- */

const SECURITY_CASES: SectionCase[] = [
  {
    key: "settings-security-email-default",
    label: "AU-S1 · Account security · Password 行（邮箱账号）· 默认",
    note: "只在 profile.auth_method === 'email' 时渲染；Google / Wallet / Telegram 账号不出现这一行。",
    spec: [
      { state: "default", when: "isEmailUser && resetCooldown === 0", visual: "与 Authenticator 行同骨架：Lock 20px + 'Password' + 'Change it with a link sent to your email' + 描边小钮 'Change'（h-8）", source: "AccountSecurityCard.tsx" },
      { state: "Change", when: "点击", visual: "sendPasswordReset(profile.email) → toast 'Reset link sent to {email}' → 进 sent 态 60s", source: "AccountSecurityCard.tsx handleSendReset" },
    ],
  },
  {
    key: "settings-security-email-sent",
    label: "AU-S2 · Account security · Password 行 · 已发送",
    spec: [
      { state: "sent", when: "resetCooldown > 0", visual: "说明改 'Reset link sent — check your inbox.'；按钮 disabled '✓ {n}s'，倒计时归零回 'Change'", source: "AccountSecurityCard.tsx" },
    ],
  },
];

export const AuthPage = ({ isMobile }: { isMobile: boolean }) => (
  <LitePage
    id="auth"
    title="登录 / 注册"
    route="AuthDialog（desktop）· AuthSheet（mobile）· 未登录门"
    status="done"
    note="四步流程（login → email → createWallet → completeProfile）、两种未登录门、Google 账号选择弹层、/reset-password 与 Settings 密码行，共 35 个真实渲染 case。"
  >
    <SectionWrapper
      id="auth-cases"
      title="登录 / 注册 · 状态字典"
      platform="shared"
      description="每个 case 都挂载生产组件（AuthContent / LiteAuthGate / AuthGateOverlay / GoogleAccountChooser），仅以 fixture prop 设定初始态。"
    >
      {/* 每个 case 一帧：AuthDialog / AuthSheet 是生产 Radix 弹层，portal 到 document.body
          并 fixed 居中；同一 iframe 内多挂会互相重叠，故按 case 拆帧。 */}
      <SubSection title="1 · login · desktop" platform="desktop">
        {LOGIN_DESKTOP.map((c, i) => (
          <div key={c.key} className={i ? "mt-3" : undefined}>
            <SectionFrame cases={[c]} device="desktop" minHeight={720} />
          </div>
        ))}
      </SubSection>

      <SubSection title="1 · login · mobile" platform="mobile">
        <SectionFrame cases={LOGIN_MOBILE} device="mobile" minHeight={812} />
      </SubSection>

      <SubSection title="2 · createWallet" platform="shared">
        <SectionFrame cases={[CREATE_CASES[0]]} device="desktop" minHeight={720} />
        <div className="mt-3">
          <SectionFrame cases={[CREATE_CASES[1]]} device="mobile" minHeight={812} />
        </div>
      </SubSection>

      <SubSection title="3 · completeProfile" platform="shared">
        {PROFILE_CASES.slice(0, 5).map((c, i) => (
          <div key={c.key} className={i ? "mt-3" : undefined}>
            <SectionFrame cases={[c]} device="desktop" minHeight={720} />
          </div>
        ))}
        <div className="mt-3">
          <SectionFrame cases={[PROFILE_CASES[5]]} device="mobile" minHeight={812} />
        </div>
      </SubSection>

      <SubSection title="4 · 未登录门" platform="shared">
        <SectionFrame cases={GATE_CASES} device="desktop" minHeight={520} />
        <div className="mt-3">
          <SectionFrame cases={GATE_CASES} device="mobile" minHeight={640} />
        </div>
      </SubSection>

      <SubSection title="5 · Google 账号选择弹层" platform="shared">
        <SectionFrame cases={DIALOG_CASES} device="desktop" minHeight={520} />
      </SubSection>

      <SubSection title="6 · email · Other email（邮箱 + 密码）· desktop" platform="desktop">
        {EMAIL_DESKTOP.map((c, i) => (
          <div key={c.key} className={i ? "mt-3" : undefined}>
            <SectionFrame cases={[c]} device="desktop" minHeight={720} />
          </div>
        ))}
      </SubSection>

      <SubSection title="6 · email · mobile" platform="mobile">
        {EMAIL_MOBILE.map((c, i) => (
          <div key={c.key} className={i ? "mt-3" : undefined}>
            <SectionFrame cases={[c]} device="mobile" minHeight={812} />
          </div>
        ))}
      </SubSection>

      <SubSection title="7 · /reset-password（重置链接落地页）" platform="shared">
        {RESET_DESKTOP.map((c, i) => (
          <div key={c.key} className={i ? "mt-3" : undefined}>
            <SectionFrame cases={[c]} device="desktop" minHeight={560} />
          </div>
        ))}
        <div className="mt-3">
          <SectionFrame cases={RESET_MOBILE} device="mobile" minHeight={640} />
        </div>
      </SubSection>

      <SubSection title="8 · Settings › Account security · Password 行" platform="shared">
        <SectionFrame cases={SECURITY_CASES} device="desktop" minHeight={260} />
        <div className="mt-3">
          <SectionFrame cases={SECURITY_CASES} device="mobile" minHeight={320} />
        </div>
      </SubSection>
    </SectionWrapper>
  </LitePage>
);
