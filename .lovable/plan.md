# Portfolio 交付物缺口盘点 + 补遗文档

三件交付物（生产页 + style-guide 状态表 + `lite-portfolio-spec.md` 流程/口径）覆盖了「长什么样」「什么时候变」「怎么流转」。后端接口由后端团队自行设计，所以补遗文档**不写接口字段表**，只写「前端需要后端保证什么」以及「前端自己算什么」。剩余缺口集中在**异步态、规模与性能、非功能项**。

## 已核实的缺口

### A. 前端需要后端保证的语义（不规定接口形态）

- **Live 列表**：前端需要每个持仓的 `cost`、`size`、`entryPrice`、`markPrice`、`pnl`、`leverage`、`productLine`、`airdropSource`、`event`、`option`、`sideLabels`；实时价与风险指标通过独立通道提供
- **Settled 列表**：按时间倒序、按 event 名可聚合为 series；前端需要 `pnlValue`、`fees`、`cost`、`closedAt`、`closeReason`、`option`、`sideLabels`、`leverage`、`productLine`
- **系列详情**：前端做「各轮 net 相加等于 Net」的对账契约，需要后端保证系列内各行 `pnl − fees` 可精确加总
- **挂单**：本仓库无真实 orders 表，挂单在前端 store；正式系统必须有真实订单账本，且前端需要 Pending / Partial Filled 状态与 event 关联
- **实时通道**：价格、mark price、账户级 `imTotal` / `equity` 的推送；断线后前端如何回落到本地快照

### B. 前端自己算的部分（必须保持）

| 计算 | 位置 | 原因 |
|---|---|---|
| `nowWorth = max(0, cost + profit)` 逐仓 clamp 后求和 | 前端 | 展示层语义，后端无需 |
| `autoClosePrice` 账户级求解（排除本仓） | 前端 | 依赖实时账户快照，展示层估算 |
| `hot`、KPI、profitPercent | 前端 | 派生展示 |
| 月分组 / series 聚合 | 当前前端；建议大账户时后端聚合 | — |

### C. 异步与失败态

- Lite portfolio **没有骨架屏**：`isLoading` 只用于滚动复位，首帧空列表会闪。需要定义 loading / error / 空数据 三态（LiteEventsPage 已有 `#171A1F / #15181C` 骨架色板可复用）
- 请求失败（非渲染异常）目前无 UI；`PortfolioErrorBoundary` 只兜渲染崩溃
- 详情页 `Not found` 文案已有，但无重试入口

### D. 规模与性能

- `useSettlements` **无分页无上限**，按 `closed_at` 倒序全量拉。老账户几百上千条会拖垮月分组渲染。需要定义分页或「加载更多」口径
- 系列聚合按 **event 名**在前端做，规模上去后应下沉服务端
- Live 列表逐仓做账户级 auto-close 求解，仓位多时是 O(n) 重算；需要给出可接受的仓位上限

### E. 实时刷新口径

- 价格多久刷一次、KPI 是否跟着每 tick 重算、tab 不可见时是否降频，文档里都没写死

### F. 数据边界与本地化

- 金额精度与舍入（分位、负零 `< $0.005`）已写，但**时区**没有：`settledDayLabel` / 月分组按什么时区切天与切月，跨时区用户会看到不同分组
- 多币种 / 非 USD 显示不在范围内需要明确声明

### G. 权限与安全

- 谁能读哪些结算记录（RLS 口径）、详情页 URL 被换成他人 id 时的行为，文档未定义

### H. 非功能项

- 埋点：tab 切换、segment 切换、详情打开、View event 点击、Cash out 点击，事件名与参数未定义
- 无障碍：tab / chips 的键盘与 aria 语义、blur 门下内容对读屏是否 `aria-hidden`（当前已设，但未写进文档）
- 验收标准：文档全是描述，没有一条可勾选的 QA checklist

## 做法

写 **`/mnt/documents/lite-portfolio-spec-appendix.md`（补遗 v1）**，与主文档同一 delivery-doc 风格，章节：

```
## 1. 前后端分工表（前端算什么 vs 后端必须提供什么，不定义接口字段）
## 2. 异步态规范（loading 骨架 / error / 空态 三态表，含色值与重试）
## 3. 规模与分页（settled 分页口径、系列聚合下沉建议、仓位规模上限）
## 4. 实时刷新口径（刷新频率、可见性降频、断线回落）
## 5. 时区与格式（切天/切月时区、金额精度、负零）
## 6. 权限（结算记录可见性与越权 URL 行为）
## 7. 埋点事件表
## 8. 无障碍要点
## 9. QA 验收 checklist（按流程逐条可勾选）
## 10. 待研发决策项（列出需要后端/QA 拍板的开放问题）
```

原则：**不改任何生产代码**，缺口中属于「原型没做」的（骨架屏、分页）在文档里标为待实现项而不是现状描述，避免误导。

