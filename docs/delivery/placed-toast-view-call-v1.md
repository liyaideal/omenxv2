# 下单成功提示 + View your call（Placed toast）— 交付说明 v1

> 这是 Lite 的三种交易页：Boost 事件页 `/trade?event=…`、Standard 事件页 `/spot?event=…`、加密涨跌轮页。用户在这些页面买入成功后，顶部提示从一行字变成「买了什么 + 一个 View your call 按钮」，点按钮页面会滚到这笔单的持仓卡并把它描边 1.5 秒。平仓提示、下单卡、持仓卡本身的内容都没动，Pro 终端不在范围内。先看「改前改后」，再看 §0 和 §2 的规则表；数值都标了代码文件。

## 改前改后

这一节给所有人看；后面的章节是给研发和测试的细则。

| 排 | 位置 | 改前 | 改后 |
|---|---|---|---|
| ① | 买入成功后页面顶部的提示 | 一行字，没有按钮，约 4 秒消失 | 标题 + 副行 + `View your call` 按钮，6 秒消失 |
| ② | 点了提示上的按钮之后 | 没有这个按钮；持仓卡在首屏以外，要自己往下滚着找 | 页面自动滚到这笔单的持仓卡，卡片描边 1.5 秒 |

**① 买入成功提示**

| 行 | 改前 | 改后 |
|---|---|---|
| Boost 2× 及以上 | `Bought Spirit · $20.00 at 2× Boost · $40.00 position`（一行） | 标题 `Bought Spirit · $20.00`，副行 `2× Boost · $40.00 position` |
| Boost 1× | `Bought Spirit · $20.00` | 不变（多了按钮） |
| Standard（新开 / 加仓） | `Bought 48 shares · Up` | `Bought Up · $24.60`（金额 = 实际扣掉的钱） |
| Standard 反向买入（把手里的持仓冲掉） | `Bought 48 shares · Down` | 不变，没有按钮 |
| 按钮 | 没有 | `View your call` |
| 停留时间 | 约 4 秒 | 6 秒 |
| 样式 | 页面同色底 + 细边框 + 白色对勾 | 不变；按钮是全站提示现有的白底黑字小按钮 |
| 平仓提示 `Cashed out …` | 没有按钮 | 不变 |

**② 点 View your call 之后**

| 行 | 改前 | 改后 |
|---|---|---|
| 页面 | 停在原处 | 平滑滚动，把持仓卡滚到视窗中间 |
| 持仓卡 | 普通样式 | 主色描边 + 一圈淡光，1.5 秒后淡出 |
| 多盘口页（体育等） | — | 滚到刚买的那一条 |
| 持仓卡内容 | — | 不变 |

改前这两种情况在字典里没有样张（提示以前没画进字典），所以只有改后的截图。

## 0. 读者须知

查什么去哪儿：
- 长什么样 → 生产页 `/trade?event=…`、`/spot?event=…`（登录后买一笔就能看到）
- 什么时候变成什么样 → `/style-guide` → Lite → Trade 状态字典，小节「③b 下单成功提示 + 定位到持仓卡」
- 字段名、文案、术语 → `docs/copy-dictionary.md`（顶部有「Lite 术语对照表」），搜 `View your call`
- 设计法则 → `DESIGN.md` §Addendum 2026-11-18 · Lite 买入成功提示 + View your call

提问前先按上面顺序查一遍；查不到再提，提问时写明"我查了 X 没有"。

## 0.1 字典怎么看

1. 打开 `/style-guide`（不用登录），左栏点 **Lite › Trade 状态**。
2. 节点顶部「本页目录」里找 **③b 下单成功提示 + 定位到持仓卡（TR-35 / TR-36）**，点了滚过去。
3. 每张样张 = `编号 · 状态名` + 一个装着真组件的框（左桌面、右手机 375）。
4. 样张下面的表固定四列「状态 / 触发条件 / 视觉 / 数据来源」，触发条件就是判定表达式。
5. 页头搜索框敲 `TR-35` 或 `View your call` 可以直接跳到样张。
6. 单张查看 / 截图：`/style-guide/preview?c=trade-tr35`、`trade-tr35b`、`trade-tr36`；加 `&lang=ru` 之类看其他语言。

编号规则：`TR-` = Lite 交易页；带 `b` 的是同一件东西的另一个变体。

只在字典可见、生产凑不出条件的态：TR-36 的描边在生产里只停留 1.5 秒，字典里用 fixture 让它一直亮着，是既定状态不是 bug。TR-35 / 35b 是提示的静态还原（生产里是 sonner 弹出的，6 秒后消失）。

## 1. 功能目标

用户买入后能立刻知道「买成了什么」并且一步找到这笔单。范围只有 Lite 的买入成功提示和「定位到持仓卡」这一个动作；不改持仓卡内容、不改下单流程、不做首单庆祝弹窗。

## 2. 规则

| # | 规则 | 判定 / 数值 | 代码 |
|---|---|---|---|
| 1 | 买入成功提示 = 标题 + 可选副行 + 按钮 | 标题 `Bought {side} · {投入}`；副行 `{N}× Boost · {仓位} position` 仅当 `boost > 1`；Standard 无副行 | `showPlacedToast`（`src/components/lite/shared/placedToast.tsx`） |
| 2 | 投入金额口径 | Boost = 输入的金额（保证金，不含手续费，和持仓卡 PUT IN 一致）；Standard = 实际从余额扣掉的钱（份数取整，可能比输入少几分；含手续费） | `LiteContractOrderPanel` / `LiteOrderPanel` |
| 3 | 停留 6 秒 | `PLACED_TOAST_MS = 6000`；点按钮即关闭 | 同上 |
| 4 | 点按钮：滚动 + 描边 | 持仓卡滚到视窗中间；加 `lite-call-flash`，1.5 秒后去掉（`YOUR_CALL_FLASH_MS = 1500`，另留约 0.4 秒给滚动） | `focusYourCall` |
| 5 | 怎么找到那张卡 | 持仓卡根节点带 `data-lite-your-call="<optionId>"`；按下单时的 option id 匹配；等约 2 秒还匹配不到才取页面上第一张 | `LitePositionCard` / `SpotYourPosition` 的 `anchorKey` |
| 6 | 卡片还没渲染出来 | 每 150ms 重试一次，最多约 2 秒；页面上一张持仓卡都没有就不动。系统设了「减少动态效果」时直接跳过去、不做平滑滚动 | `focusYourCall` |
| 7 | 平仓 / 反向买入把持仓冲掉 | Boost：提示仍是 `Cashed out …`，没有按钮。Standard：提示仍是 `Bought N shares · {side}`，没有按钮 | 两个下单卡的 reduce / close 分支 |
| 8 | 手机 | 下单抽屉先收起，提示出现在页面顶部；其余同桌面 | 页面 `onFilled` |

## 3. 多语言

新增两条 key（`trade` 命名空间），7 种语言都有：

| key | en | zh-CN | zh-TW | ja | ko | ru | vi |
|---|---|---|---|---|---|---|---|
| `screen.lite.winloss.toast_boost_line` | {{boost}}× Boost · {{position}} position | {{boost}}× Boost · 仓位 {{position}} | {{boost}}× Boost · 倉位 {{position}} | {{boost}}× Boost · ポジション {{position}} | {{boost}}× Boost · 포지션 {{position}} | {{boost}}× Boost · позиция {{position}} | {{boost}}× Boost · vị thế {{position}} |
| `screen.lite.winloss.toast_view_call` | View your call | 查看我的预测 | 查看我的預測 | 予測を見る | 내 콜 보기 | Моя ставка | Xem lựa chọn |

标题沿用已有的 `toast_bought`。`toast_bought_boost`（一行写完的旧写法）不再使用，key 保留。

## 4. 已删除 / 已废弃

| 项 | 说明 |
|---|---|
| Boost 一行提示 `Bought … at N× Boost · … position` | 拆成标题 + 副行 |
| Standard 新开 / 加仓的提示 `Bought N shares · {side}` | 改成和 Boost 同一句标题；反向买入时这句仍在用 |

## 5. 状态索引

| 模块 | 字典编号 |
|---|---|
| 买入成功提示（Boost ≥ 2×） | TR-35 |
| 买入成功提示（1× / Standard） | TR-35b |
| 持仓卡描边 | TR-36 |

## 6. Lovable / 正式版边界

Lovable 里提示由 sonner 弹出，正式版用自己的提示组件即可，内容、按钮、6 秒、滚动与描边的规则照本文。Lovable 的成交是即时的，提示在成交后弹；正式版如果成交有延迟，提示同样在成交后弹（不是提交时），「卡片还没出来就等一会儿」那条（规则 6）的等待时间按实际情况调。Boost 档位在 Lovable 里都是整数；持仓卡上合并后的倍数可以是小数，但提示只写这一笔下单选的档位。西班牙语目前没有这批文案，显示英文。

## 7. 涉及文件

- 新增：`src/components/lite/shared/placedToast.tsx`
- 下单卡：`src/components/lite/contract/LiteContractOrderPanel.tsx`、`src/components/lite/trade/LiteOrderPanel.tsx`
- 持仓卡：`src/components/lite/contract/LitePositionCard.tsx`、`src/components/lite/trade/SpotBlocks.tsx`
- 页面：`src/pages/lite/LiteContractTrade.tsx`、`LiteSpotTrade.tsx`、`LiteQuickTrade.tsx`
- 样式：`src/index.css`（`.lite-call-flash`）
- 文案：`src/locales/*.json`

## 8. 未变更项

持仓卡的字段与数字、Cash out 流程、下单卡、平仓提示、Pro 终端、Quick Play 机柜与百家乐桌面模式、全站其他提示的样式与停留时间。
