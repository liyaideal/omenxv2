# 2026-11-09 · 首页 All 视图终验四项（CPO「4件事都批了」）+ 字典侧栏可收起

- **① 状态④ Remind me（S4）**：最大一场有直播、还没开赛且 48 小时内开赛 → `☆ Remind me`，点了 `★ Reminder set`（橙），再点取消；和 Sports 品类页直播预告是同一条提醒（`stream_reminders`，开赛发通知）；游客点 → 站内登录框，登录后再点一次。其他情况 → `Open match →`。字典 HA-5 改写、新增 HA-21a / b / c（桌面 + 375）。
- **② 价钮预选（G3）**：首页所有价钮进交易页时带 `&option=` / `&side=yes|no`（`tradeLink()`）：Sports 队、Crypto / Stocks Up·Down、Desk 的钮、More 多档 Yes / No 与二元。交易页（合约 / 现货 / 快轮）进页读一次，选中那一档、下单区切到那一边；找不到这一档就照常打开。行 / 瓷砖 / Open match 不预选。顺带：Sports 品类页、Editor's Desk 原来就带 `option`，但交易页一直没读，现在真的会预选。
- **③ 7 语（R8）**：首页五段的眉行、问句、按钮、底注、图表标签全部走 i18n，新 key 74 条 × 7 语（英文含单复数 81 条），`events` 命名空间 `screen.simple.home_all.*`，Lovable 2026-11-09 新增、要回写平台 i18n 表；复用 Yes / No / Up / Down / Vol / Remind me 等已有 key。星期、日期跟用户语言，时间 24 小时；赛事名 / 事件标题 / 品类名 / 推荐语不翻。简中由我起草、其余 5 语 AI 初译（待审）。
- **④ 首屏骨架（R6）**：`LiteAllStageSkeleton` / `LiteMobileStageSkeleton` 改成五段按最终尺寸占位；字典新增 HA-22，EV-24 文字跟改。
- **字典侧栏**：`/style-guide` 页头左上新增收起 / 展开目录按钮（桌面，记在本浏览器），收起后样张占满整宽；舞台标签行、`Stream i / N`、`▶ Live stream` 不再折行。
- **文档**：home-all-v1（§2 从台账重新生成、§0.1、§3、§6 验收表 8–10、§7、§8 改为拍板记录）、copy-dictionary 首页节、DESIGN §Addendum 2026-11-09 第 8 条。
- **没动**：数据同步、交易页布局、Sports 品类页组件。
