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
