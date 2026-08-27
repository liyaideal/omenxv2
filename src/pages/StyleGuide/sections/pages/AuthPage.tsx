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
    spec: [
      {
        state: "Lite gate",
        when: "surface === 'lite' && !user",
        visual:
          "底层 blur-[3px] opacity-70；覆盖层 LynxFigure 100 + 标题 + 描述 + btn-primary Sign in / 描边 Create account",
        source: "LiteAuthGate.tsx",
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
];

export const AuthPage = ({ isMobile }: { isMobile: boolean }) => (
  <LitePage
    id="auth"
    title="登录 / 注册"
    route="AuthDialog（desktop）· AuthSheet（mobile）· 未登录门"
    status="done"
    note="三步流程（login → createWallet → completeProfile）、两种未登录门与 Google 账号选择弹层，共 16 个真实渲染 case。"
  >
    <SectionWrapper
      id="auth-cases"
      title="登录 / 注册 · 状态字典"
      platform="shared"
      description="每个 case 都挂载生产组件（AuthContent / LiteAuthGate / AuthGateOverlay / GoogleAccountChooser），仅以 fixture prop 设定初始态。"
    >
      <SubSection title="1 · login · desktop" platform="desktop">
        <SectionFrame cases={LOGIN_DESKTOP} device="desktop" minHeight={640} />
      </SubSection>

      <SubSection title="1 · login · mobile" platform="mobile">
        <SectionFrame cases={LOGIN_MOBILE} device="mobile" minHeight={640} />
      </SubSection>

      <SubSection title="2 · createWallet" platform="shared">
        <SectionFrame cases={[CREATE_CASES[0]]} device="desktop" minHeight={560} />
        <div className="mt-3">
          <SectionFrame cases={[CREATE_CASES[1]]} device="mobile" minHeight={560} />
        </div>
      </SubSection>

      <SubSection title="3 · completeProfile" platform="shared">
        <SectionFrame cases={PROFILE_CASES.slice(0, 5)} device="desktop" minHeight={620} />
        <div className="mt-3">
          <SectionFrame cases={[PROFILE_CASES[5]]} device="mobile" minHeight={620} />
        </div>
      </SubSection>

      <SubSection title="4 · 未登录门" platform="shared">
        <SectionFrame cases={GATE_CASES} device={isMobile ? "mobile" : "desktop"} minHeight={460} />
      </SubSection>

      <SubSection title="5 · Google 账号选择弹层" platform="shared">
        <SectionFrame cases={DIALOG_CASES} device="desktop" minHeight={520} />
      </SubSection>
    </SectionWrapper>
  </LitePage>
);
