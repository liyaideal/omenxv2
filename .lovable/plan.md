# Recovery 空态漂移修正 + 钱包预览「复刻件」整体对账

你截图里 Style Guide 的 recovery 空态仍然带一个 Inbox 收件箱图标，生产页早在 R-W3-FIX2 就把它撤掉了。原因和上一轮 W-10 一样：这块预览是**手抄的生产 chrome**，生产改了、抄件没跟。

## 已核实的漂移

| 位置 | 现状 | 生产真相 |
| --- | --- | --- |
| `fundingPreviews.tsx` W-31 空态 | `<Inbox>` 图标 + lynx 插画 | 生产 `RecoveryRequest.tsx` 只有 lynx 插画 |
| `WalletStatesSection.tsx` 字典 W-31 行 | 写着「Inbox 图标 + lynx 插画」 | 应只写 lynx 插画 |
| W-31 「New request」按钮 | `h-9` | 生产移动端 `h-8`，桌面走 DSH 头部按钮槽 |

（W-3 / W-4 / W-10 / Recovery 插画来源本身都已对齐，本轮不动。）

## 修法：不再手抄，抽成生产件

1. 在 `src/pages/RecoveryRequest.tsx` 旁新建 `src/components/wallet/RecoveryEmptyState.tsx`，把生产那段空态（lynx 插画 + 两行文案 + 容器类名）原样搬进去并导出。
2. `RecoveryRequest.tsx` 改为渲染该组件，视觉零变化。
3. `fundingPreviews.tsx` 的 W-31 删掉 `Inbox` 与手抄空态，直接挂 `RecoveryEmptyState`；按钮高度对齐生产 `h-8`。
4. `WalletStatesSection.tsx` W-31 字典行去掉「Inbox 图标」措辞。

## 其余复刻件对账（同轮做，只改真错的）

逐项比对 W-30（intro card + Sign in required）与 W-32（recovery detail 三态）跟生产 `RecoveryRequest.tsx` / `RecoveryRequestDetail.tsx` 的文案、费率、字段名。发现不一致就按生产为准修预览；一致则在报告里逐条列出「已核对无差异」。

## 验证

Playwright 1280×1800 抓 W-31 预览与生产 `/wallet/recovery` 空态对照截图（确认无 Inbox），加 `bunx tsgo --noEmit` 与 `bun run build`。移动端与 FROZEN 组件零改动。
