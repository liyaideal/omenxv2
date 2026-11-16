/**
 * 对外可分享的站点地址（分享链接、海报二维码、邀请链接统一走这里）。
 *
 * 优先取环境变量 VITE_SITE_URL；没设时回落到当前访问域名，这样蓝图站/预览站
 * 分享出去的链接始终是活的。真平台部署时设 VITE_SITE_URL=https://omenx.com。
 * 末尾不带斜杠，拼接时自己写 `/`。
 */
const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "");

export const SITE_URL =
  fromEnv || (typeof window !== "undefined" ? window.location.origin : "https://omenx.com");

/**
 * 帮助中心（CPO 2026-09-28）：About / FAQ / Methodology 不再做站内页，全部跳
 * help.omenxfoundation.org；Glossary 留站内 /glossary。页脚、Help & Support
 * 入口、旧路由重定向统一从这里取。
 */
export const HELP_CENTER_URL = "https://help.omenxfoundation.org/";
export const HELP_FAQ_URL = "https://help.omenxfoundation.org/faq";
export const HELP_GUIDE_URL = "https://help.omenxfoundation.org/guide";
/**
 * Live chat (Sobot customer service), CPO 2026-11-16. Opens in a new tab from the desktop avatar
 * menu, the mobile Me drawer and the footer. No user identity is passed yet: that needs Sobot's
 * Sign verification with a server-side secret (pending), so support asks for UID / email in chat.
 */
export const SUPPORT_CHAT_URL =
  "https://sg.sobot.io/chat/pc/v7/index.html?sysnum=4f8d76dd446647548997f624fe6e2114&channelid=2";
export const openSupportChat = () => window.open(SUPPORT_CHAT_URL, "_blank", "noopener,noreferrer");
