/**
 * Settings — the /settings page as its own dictionary node (2026-09-22 Lite
 * reskin, CPO mock v5). 30 cases, every one a production component mounted
 * with display-only fixture props (preview/settingsPreviews.tsx +
 * preview/authPreviews.tsx for the email Sign-in / Password rows). Truth Rule
 * §16.1.1 — no hand-copied markup. Numbering: ST-1… ; `b` = same state,
 * other device.
 */
import { LitePage } from "./shell";
import { SectionWrapper, SubSection } from "../../components/SectionWrapper";
import { SectionFrame, type SectionCase } from "../../components/SectionFrame";

type P = { isMobile: boolean };

/* ---------------- Ⓐ page shell ---------------- */

const PAGE_CASES: SectionCase[] = [
  {
    key: "settings-page-guest",
    label: "ST-1 · 页面 · 未登录门（LiteAuthGate）",
    note: "与 Wallet / Portfolio 同一个门：底层模糊的页面 + lynx + 'Sign in to view your settings'。改版前 /settings 对游客渲染空页。",
    spec: [
      { state: "guest", when: "!user", visual: "LiteAuthGate（page 变体，桌面 400 / 移动 420 高）；标题 'Sign in to view your settings'，说明 'Manage your profile, security and notifications by signing in to your account.'；btn-primary 'Sign in' + 描边 'Create account'", source: "Settings.tsx SETTINGS_GATE_COPY · LiteAuthGate.tsx" },
      { state: "signed in", when: "user", visual: "门消失，页面原地展开；登录向导（注册流）保持打开到 'Start trading'", source: "LiteAuthGate（2026-09-21 修）" },
    ],
  },
  {
    key: "settings-page-loading",
    label: "ST-2 · 页面 · loading",
    spec: [{ state: "loading", when: "useUserProfile().isLoading", visual: "LoadingState 'Loading profile…'（现有）", source: "Settings.tsx" }],
  },
  {
    key: "settings-page-error",
    label: "ST-3 · 页面 · error",
    spec: [{ state: "error", when: "useUserProfile().error", visual: "ErrorState 'Couldn't load your settings' / 'Check your connection and try again.' / 'Try again' → refetchProfile()", source: "Settings.tsx · states/ErrorState" }],
  },
];

/* ---------------- Ⓑ hero ---------------- */

const HERO_CASES: SectionCase[] = [
  {
    key: "settings-hero-default",
    label: "ST-4 · Profile hero · 用户名已设 · desktop",
    note: "Wallet HeroEquityCard 原样：rounded-[18px] p-[34px_36px]，PROFILE 微标签 → 40px font-display 用户名 → 13px meta（ID mono）；右下胶囊 'Edit username'（描边）/ 'Change avatar'（ghost）。hero 底图槽位留空（素材由 CPO 提供，不 CSS 造）。",
    spec: [
      { state: "username set", when: "profile.username", visual: "用户名 40px `font-display font-bold leading-[0.96]`；主胶囊 'Edit username'", source: "ProfileHero.tsx" },
      { state: "avatar", when: "profile.avatar_url", visual: "72px 圆头像 `border-2 border-primary/50`；点头像或 'Change avatar' → 现有头像选择器", source: "ProfileHero.tsx → Settings.tsx avatarDialog" },
      { state: "Edit username", when: "点击", visual: "现有用户名弹窗（3–20 字符，字母数字下划线）", source: "Settings.tsx usernameDialog" },
    ],
  },
  {
    key: "settings-hero-unset",
    label: "ST-5 · Profile hero · 用户名未设 + 头像回退",
    spec: [
      { state: "username not set", when: "!profile.username", visual: "display 位灰色 500 'Set a username'；主胶囊改 'Set username'", source: "ProfileHero.tsx" },
      { state: "avatar fallback", when: "!profile.avatar_url", visual: "`bg-primary/20 text-primary` 首字母圆（用户名或邮箱首字母，都没有则 User 图标）", source: "ProfileHero.tsx" },
    ],
  },
];

const HERO_MOBILE: SectionCase[] = [
  {
    key: "settings-hero-mobile",
    label: "ST-4b · Profile hero · mobile（compact）",
    spec: [{ state: "compact", when: "isMobile", visual: "p-5，56px 头像，22px 用户名，无微标签；下方 2 列 h-11 胶囊 'Edit username' / 'Change avatar'（Wallet compact 变体）", source: "ProfileHero.tsx compact" }],
  },
];

/* ---------------- Ⓒ Sign-in ---------------- */

const SIGNIN_EMAIL: SectionCase[] = [
  {
    key: "settings-linked-email-default",
    label: "ST-6 · Sign-in · 邮箱账号 · 默认",
    note: "原 Linked Account 卡（AU-S3）换皮：卡头 'SIGN-IN · Email & password'，一行 Email / 地址（mono）/ 'Change'。改邮箱三态、弹窗与冷却逻辑不变（AU-S4…S8）。",
    spec: [
      { state: "default", when: "auth_method === 'email' && !user.new_email && cooldown === 0", visual: "描边 sm h-8 'Change' → ChangeLoginEmailDialog；脚注 'You signed in via Email. To change it, we'll send a link to both your current and your new address.'", source: "LinkedEmailAccountCard.tsx" },
    ],
  },
  {
    key: "settings-linked-email-pending",
    label: "ST-7 · Sign-in · 邮箱账号 · pending",
    spec: [
      { state: "pending", when: "user.new_email", visual: "'Email' 旁 PENDING 胶囊（accent）；按钮 'Resend'；脚注 'Changing to {new} — open the link in both inboxes to finish. Links expire in 24 hours.'", source: "LinkedEmailAccountCard.tsx" },
      { state: "done", when: "两封都点 → user.email 变化", visual: "同步 profiles.email → toast 'Email updated to {new}' → 回 ST-6", source: "sync effect" },
    ],
  },
  {
    key: "settings-linked-email-cooldown",
    label: "ST-8 · Sign-in · 邮箱账号 · 冷却",
    spec: [{ state: "cooldown", when: "cooldown > 0", visual: "按钮 disabled '✓ {n}s'，归零后 'Resend'", source: "LinkedEmailAccountCard.tsx" }],
  },
];

const SIGNIN_PROVIDER: SectionCase[] = [
  {
    key: "settings-signin-google",
    label: "ST-9 · Sign-in · Google 账号",
    note: "原 Email 卡 + Linked Account 卡合并为一张：第一行登录方式（无按钮），第二行 Notification email + 'Edit' → 现有通知邮箱弹窗（验证码步不变）。",
    spec: [
      { state: "google", when: "auth_method === 'google'", visual: "右槽 'Google account'；行 1 Google 图标 + 'Google' + 邮箱（mono）；行 2 'Notification email' + 邮箱 + 'Edit'", source: "ProviderSignInCard.tsx" },
      { state: "note", when: "始终", visual: "'You signed in via Google. This cannot be changed. To use a different account, sign out and sign in again.'", source: "ProviderSignInCard.tsx" },
    ],
  },
  {
    key: "settings-signin-wallet",
    label: "ST-10 · Sign-in · Wallet 账号 · 无邮箱",
    spec: [
      { state: "wallet · no email", when: "auth_method === 'wallet' && !profile.email", visual: "右槽 'Wallet'；行 1 'Wallet'（profiles 无地址列 → 值行省略）；行 2 'Notification email' + NOT SET 胶囊 + 'Needed for alerts and account recovery' + 'Add'", source: "ProviderSignInCard.tsx" },
    ],
  },
  {
    key: "settings-signin-telegram",
    label: "ST-11 · Sign-in · Telegram 账号",
    spec: [{ state: "telegram", when: "auth_method === 'telegram'", visual: "右槽 'Telegram'；行 1 Telegram 图标 + 'Telegram'；行 2 通知邮箱 + 'Edit'", source: "ProviderSignInCard.tsx" }],
  },
];

/* ---------------- Ⓓ Account security ---------------- */

const SECURITY_CASES: SectionCase[] = [
  {
    key: "settings-security-email-default",
    label: "ST-12 · Account security · Password 行默认 + Authenticator NOT SET",
    note: "卡头 'ACCOUNT SECURITY' + 说明 'Verification methods linked to your account.'；Password 行仅邮箱账号；逻辑同 AU-S1/S2。",
    spec: [
      { state: "password default", when: "auth_method === 'email' && resetCooldown === 0", visual: "Lock 18px + 'Password' + 'Change it with a link sent to your email' + 描边 'Change' → sendPasswordReset → toast", source: "AccountSecurityCard.tsx" },
      { state: "authenticator not set", when: "!profile.totp_enabled", visual: "'Authenticator app' + NOT SET 胶囊（muted）+ 'Connect Google Authenticator, Authy, or similar' + 描边 'Set up' → Setup2FADialog（现有）", source: "AccountSecurityCard.tsx" },
    ],
  },
  {
    key: "settings-security-email-sent",
    label: "ST-13 · Account security · Password 已发送",
    spec: [{ state: "sent", when: "resetCooldown > 0", visual: "'Reset link sent — check your inbox.'；按钮 disabled '✓ {n}s'", source: "AccountSecurityCard.tsx" }],
  },
  {
    key: "settings-security-totp-enabled",
    label: "ST-14 · Account security · Authenticator 已启用",
    spec: [
      { state: "enabled", when: "profile.totp_enabled", visual: "ENABLED 胶囊（accent）+ 'Codes from your authenticator app' + 描边 'Disable'", source: "AccountSecurityCard.tsx" },
      { state: "Disable", when: "点击", visual: "window.confirm（提现校验依赖 2FA 时提示回落 Email only）→ disableTotp → toast 'Authenticator disabled'（现有逻辑）", source: "AccountSecurityCard.tsx handleDisable" },
    ],
  },
];

/* ---------------- Ⓔ Withdrawal verification ---------------- */

const WITHDRAWAL_CASES: SectionCase[] = [
  {
    key: "settings-withdrawal-default",
    label: "ST-15 · Withdrawal verification · 默认（Email only，2FA 未开）",
    note: "卡头 + 'How we verify a withdrawal request.'；三个选项 = hairline 行 + radio；未就绪选项 opacity-55 + 琥珀 'Requires … to be configured'。点未就绪的 Authenticator 选项仍会就地打开 2FA 设置（现有逻辑）。",
    spec: [
      { state: "email only", when: "withdraw_2fa_mode === 'email' && hasEmail", visual: "第一项选中；后两项 dim + 'Requires authenticator to be configured'", source: "WithdrawalVerificationCard.tsx" },
      { state: "pick totp/both while 2FA off", when: "点击", visual: "Setup2FADialog → 成功后自动切到所选模式 + toast", source: "handleModeChange / handleSetupSuccess" },
    ],
  },
  {
    key: "settings-withdrawal-all-enabled",
    label: "ST-16 · Withdrawal verification · 2FA 已开，Email + Authenticator 选中",
    spec: [{ state: "all ready", when: "hasEmail && totp_enabled", visual: "三项全亮，无琥珀行；选中项 radio 主色", source: "WithdrawalVerificationCard.tsx" }],
  },
  {
    key: "settings-withdrawal-nothing",
    label: "ST-17 · Withdrawal verification · 什么都没配置（Wallet 账号）",
    spec: [{ state: "nothing configured", when: "!hasEmail && !totp_enabled", visual: "琥珀框 'Add an email in Sign-in or set up an authenticator in Account security to enable withdrawal verification.'；三项全部 disabled + dim", source: "WithdrawalVerificationCard.tsx nothingConfigured" }],
  },
];

/* ---------------- Ⓕ Notifications ---------------- */

const NOTIFICATIONS_CASES: SectionCase[] = [
  {
    key: "settings-notifications-default",
    label: "ST-18 · Notifications · 全开（默认）",
    note: "本批仅 email（浏览器推送 / Telegram 后续批次）。四个开关存 profiles.notification_prefs（jsonb）；缺省键读作 true。Lovable 只存偏好不发信。",
    spec: [
      { state: "all on", when: "notification_prefs 每键 !== false", visual: "四行：Settled results / Auto-close warnings / Trade confirmations / Deposits & withdrawals，shadcn Switch 选中 = primary；脚注 'Sent to {email}.'", source: "NotificationsCard.tsx NOTIFICATION_EVENTS" },
      { state: "toggle", when: "切换", visual: "乐观更新即保存；失败回滚 + toast 'Couldn't save that. Try again.'；无保存按钮", source: "useUserProfile.updateNotificationPrefs" },
      { state: "email change pending", when: "user.new_email", visual: "脚注仍显示当前地址 + ' — until your email change is confirmed.'", source: "NotificationsCard.tsx" },
    ],
  },
  {
    key: "settings-notifications-some-off",
    label: "ST-19 · Notifications · 部分关闭",
    spec: [{ state: "some off", when: "某键 === false", visual: "对应 Switch 未选中（muted 轨道）", source: "NotificationsCard.tsx" }],
  },
  {
    key: "settings-notifications-no-email",
    label: "ST-20 · Notifications · 账户无邮箱（空态）",
    spec: [{ state: "no email", when: "!profile.email", visual: "整卡替换为空态：'Add an email to get alerts' + 'Settled results, auto-close warnings, trade confirmations and funds movements.' + 描边 'Add email' → 通知邮箱弹窗", source: "NotificationsCard.tsx" }],
  },
];

/* ---------------- Ⓖ Preferences ---------------- */

const PREFERENCES_CASES: SectionCase[] = [
  {
    key: "settings-preferences-default",
    label: "ST-21 · Preferences · Language chip",
    note: "语言列表与存储和页头切换器共用（src/lib/languages.ts · useLanguage）。本批 7 语：English · 简体中文 · 繁體中文 · 日本語 · 한국어 · Русский · Tiếng Việt；第二批 Español · Bahasa Indonesia · Türkçe 未做。页面文案本轮不翻译。",
    spec: [
      { state: "chip", when: "始终", visual: "Globe 行 'Language' + 'Also changes the language of emails we send you' + 描边 sm chip '{label} ⌄'", source: "PreferencesCard.tsx" },
      { state: "pick", when: "选择", visual: "登录态写 profiles.language（游客写 localStorage）+ toast 'Language set to {label}'；页头 chip 同步", source: "useLanguage.setLanguage" },
    ],
  },
  {
    key: "settings-preferences-open",
    label: "ST-22 · Preferences · 下拉展开（desktop）",
    spec: [{ state: "open", when: "chip 点击", visual: "DropdownMenu 200px，7 项按批次顺序，当前项右侧主色 ✓；移动端为 MobileDrawer 列表（ST-22b）", source: "PreferencesCard.tsx" }],
  },
];

/* ---------------- Ⓗ Sessions ---------------- */

const SESSIONS_CASES: SectionCase[] = [
  {
    key: "settings-sessions-many",
    label: "ST-23 · Sessions · 多设备",
    note: "数据来自 RPC list_my_sessions()（SECURITY DEFINER 读 auth.sessions，按 auth.uid() 过滤）。设备 = user-agent 解析（Chrome · macOS）；地点 = 会话最近 IP（Lovable 无 geo-IP，真平台解析成城市）；时间 = 最近活跃相对时间。",
    spec: [
      { state: "N devices", when: "rows.length > 1", visual: "右槽 '{n} devices'；行：Monitor / Smartphone 18px + '{browser · os}' + 当前会话 THIS DEVICE 胶囊（primary）+ mono '{ip} · {now | n min ago | n h ago | Sep 15}'；底部全宽描边 'Sign out other devices'", source: "SessionsCard.tsx describeUserAgent / relativeTime" },
      { state: "sign out others", when: "点击", visual: "supabase.auth.signOut({ scope: 'others' }) → toast 'Signed out other devices' → 列表收缩为本机", source: "SessionsCard.tsx signOutOthers" },
    ],
  },
  {
    key: "settings-sessions-single",
    label: "ST-24 · Sessions · 仅本机",
    spec: [{ state: "single", when: "rows.length === 1", visual: "右槽 '1 device'；按钮隐藏；脚注 'You're only signed in here.'", source: "SessionsCard.tsx" }],
  },
  {
    key: "settings-sessions-loading",
    label: "ST-25 · Sessions · loading",
    spec: [{ state: "loading", when: "query.isLoading", visual: "右槽空；3 组骨架行（Skeleton 52% / 30%）", source: "SessionsCard.tsx" }],
  },
  {
    key: "settings-sessions-error",
    label: "ST-26 · Sessions · error",
    spec: [{ state: "error", when: "query.error", visual: "AlertCircle 行 'Couldn't load sessions' / 'Check your connection and try again.' + 描边 'Retry' → refetch", source: "SessionsCard.tsx" }],
  },
  {
    key: "settings-sessions-unknown",
    label: "ST-27 · Sessions · 未知设备 / 地点",
    spec: [{ state: "unknown", when: "user_agent 解析不出 / ip 为空", visual: "'Unknown device' / 'Unknown location · {date}'", source: "SessionsCard.tsx" }],
  },
];

/* ---------------- Ⓘ Account ---------------- */

const ACCOUNT_CASES: SectionCase[] = [
  {
    key: "settings-account-default",
    label: "ST-28 · Account · Sign out / Close account 行",
    note: "Close account 行与按钮用 #FF5C5C（DESIGN §5 破坏性；Wallet 删地址先例）。Lovable 止于确认：登出 + toast 'Account closed'，不真正删数据（docs/backend-boundary.md）。",
    spec: [
      { state: "Sign out", when: "点击", visual: "立即 signOut → navigate('/')，无确认", source: "AccountCard.tsx handleSignOut" },
      { state: "Close account", when: "balance + spot_balance > 0", visual: "→ ST-29 余额未清弹窗", source: "AccountCard.tsx openClose" },
      { state: "Close account", when: "余额为 0", visual: "→ ST-30 确认弹窗", source: "AccountCard.tsx openClose" },
    ],
  },
];

const ACCOUNT_DIALOGS: SectionCase[] = [
  {
    key: "settings-account-blocked",
    label: "ST-29 · Close account · 余额未清弹窗",
    spec: [{ state: "blocked", when: "total > 0", visual: "'Withdraw your balance first' / 'You still have {$total} across Standard and Boost. Withdraw it before closing your account.'；描边 'Cancel' + btn-primary 'Go to Wallet' → /wallet；移动端 MobileDrawer", source: "AccountCard.tsx" }],
  },
  {
    key: "settings-account-confirm",
    label: "ST-30 · Close account · 确认弹窗（输入 CLOSE）",
    spec: [
      { state: "confirm", when: "total === 0", visual: "'Close your account?' / 'Your profile, history and API keys are deleted. This cannot be undone.' / 'Type CLOSE to confirm' + 输入框（登录弹窗 Lite 皮）；'Close account' bg-trading-red，输入 ≠ CLOSE 时 disabled", source: "AccountCard.tsx" },
      { state: "done", when: "点击 Close account", visual: "signOut → toast 'Account closed' → /（Lovable 不删数据）", source: "AccountCard.tsx handleClose" },
    ],
  },
];

/* ---------------- Ⓙ More ---------------- */

const MORE_CASES: SectionCase[] = [
  {
    key: "settings-more",
    label: "ST-31 · More · 子页入口",
    spec: [{ state: "static", when: "始终", visual: "两行 + chevron：'Transparency audit · Verify assets, trades and auto-closes on-chain' → /settings/transparency；'API management · API keys for programmatic trading' → /settings/api（'liquidations' 已按 Lite 禁词改 'auto-closes'）", source: "MoreCard.tsx" }],
  },
];

export const LiteSettingsPage = (_: P) => (
  <LitePage
    id="lite-settings"
    title="Settings"
    route="/settings（/settings/transparency · /settings/api 见各自节点）"
    status="done"
    note="本页 = 产品页 /settings 的状态字典（2026-09-22 Lite 改版，ACCOUNT family，Wallet 为参照实现）· 样式与布局看生产页，状态与判定看本页。"
  >
    <div className="mb-6 space-y-1 rounded-lg border border-[#CFFF4A]/30 bg-[#CFFF4A]/5 px-3 py-2 text-[12px] text-foreground">
      <div>
        本页 = 产品页 <code className="font-mono">/settings</code> 的状态字典 · 样式与布局 → 生产页；状态与判定 → 本页；表里没有列出的组合视为不存在
      </div>
      <div>
        字段名 / 文案 / 术语 → <code className="font-mono">docs/copy-dictionary.md</code>「Settings（Lite, 2026-09-22）」+「Auth · Email」
      </div>
      <div>
        流程 / 口径 / 前后端分工 → <code className="font-mono">docs/delivery/email-login-settings-v1.md</code>（总文档）；卡片语法 → <code className="font-mono">DESIGN.md</code> §Addendum 2026-09-22
      </div>
    </div>

    <SectionWrapper
      id="settings-cases"
      title="Settings · 状态字典（ST-1…ST-31 · Ⓐ–Ⓙ 区）"
      platform="shared"
      description="分区序 = 生产页从上到下：Ⓐ页面外壳 · Ⓑhero · ⒸSign-in · ⒹAccount security · ⒺWithdrawal verification · ⒻNotifications · ⒼPreferences · ⒽSessions · ⒾAccount · ⒿMore。每个 case 挂载生产组件（preview* fixture 只定初态，禁运行时 fetch）；移动帧里组件自行切到 compact / MobileDrawer 形态。"
    >
      <div className="space-y-12">
        <SubSection title="Ⓐ 页面外壳（ST-1 … ST-3）" platform="shared">
          <SectionFrame cases={[PAGE_CASES[0]]} device="desktop" minHeight={420} />
          <div className="mt-3">
            <SectionFrame cases={[PAGE_CASES[0]]} device="mobile" minHeight={440} />
          </div>
          <div className="mt-3">
            <SectionFrame cases={PAGE_CASES.slice(1)} device="desktop" minHeight={360} />
          </div>
        </SubSection>

        <SubSection title="Ⓑ Profile hero（ST-4 … ST-5）" platform="shared">
          <SectionFrame cases={HERO_CASES} device="desktop" minHeight={220} />
          <div className="mt-3">
            <SectionFrame cases={HERO_MOBILE} device="mobile" minHeight={240} />
          </div>
        </SubSection>

        <SubSection title="Ⓒ Sign-in（ST-6 … ST-11）" platform="shared">
          <SectionFrame cases={SIGNIN_EMAIL} device="desktop" minHeight={240} />
          <div className="mt-3">
            <SectionFrame cases={SIGNIN_PROVIDER} device="desktop" minHeight={280} />
          </div>
          <div className="mt-3">
            <SectionFrame cases={[SIGNIN_EMAIL[0], SIGNIN_PROVIDER[1]]} device="mobile" minHeight={280} />
          </div>
        </SubSection>

        <SubSection title="Ⓓ Account security（ST-12 … ST-14）" platform="shared">
          <SectionFrame cases={SECURITY_CASES} device="desktop" minHeight={240} />
          <div className="mt-3">
            <SectionFrame cases={[SECURITY_CASES[2]]} device="mobile" minHeight={260} />
          </div>
        </SubSection>

        <SubSection title="Ⓔ Withdrawal verification（ST-15 … ST-17）" platform="shared">
          <SectionFrame cases={WITHDRAWAL_CASES} device="desktop" minHeight={360} />
          <div className="mt-3">
            <SectionFrame cases={[WITHDRAWAL_CASES[2]]} device="mobile" minHeight={420} />
          </div>
        </SubSection>

        <SubSection title="Ⓕ Notifications（ST-18 … ST-20）" platform="shared">
          <SectionFrame cases={NOTIFICATIONS_CASES} device="desktop" minHeight={360} />
          <div className="mt-3">
            <SectionFrame cases={[NOTIFICATIONS_CASES[0], NOTIFICATIONS_CASES[2]]} device="mobile" minHeight={380} />
          </div>
        </SubSection>

        <SubSection title="Ⓖ Preferences（ST-21 … ST-22）" platform="shared">
          <SectionFrame cases={[PREFERENCES_CASES[0]]} device="desktop" minHeight={180} />
          <div className="mt-3">
            <SectionFrame cases={[PREFERENCES_CASES[1]]} device="desktop" minHeight={460} />
          </div>
          <div className="mt-3">
            <SectionFrame cases={[PREFERENCES_CASES[0]]} device="mobile" minHeight={200} />
          </div>
        </SubSection>

        <SubSection title="Ⓗ Sessions（ST-23 … ST-27）" platform="shared">
          <SectionFrame cases={SESSIONS_CASES} device="desktop" minHeight={300} />
          <div className="mt-3">
            <SectionFrame cases={[SESSIONS_CASES[0]]} device="mobile" minHeight={340} />
          </div>
        </SubSection>

        <SubSection title="Ⓘ Account（ST-28 … ST-30）" platform="shared">
          <SectionFrame cases={ACCOUNT_CASES} device="desktop" minHeight={220} />
          {ACCOUNT_DIALOGS.map((c) => (
            <div key={c.key} className="mt-3">
              <SectionFrame cases={[c]} device="desktop" minHeight={440} />
            </div>
          ))}
          <div className="mt-3">
            <SectionFrame cases={[ACCOUNT_DIALOGS[1]]} device="mobile" minHeight={560} />
          </div>
        </SubSection>

        <SubSection title="Ⓙ More（ST-31）" platform="shared">
          <SectionFrame cases={MORE_CASES} device="desktop" minHeight={200} />
        </SubSection>
      </div>
    </SectionWrapper>
  </LitePage>
);
