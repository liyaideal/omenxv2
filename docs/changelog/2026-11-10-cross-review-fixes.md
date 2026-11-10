# 2026-11-10 · 首页 / Sports / 现货页 · 三方交叉验收修复

起因：CPO 发现 style-guide 整页上 HA-15 的登录框盖住 HA-2 … HA-5（单帧网址看不出来）。改为三方交叉验收：我自己（整页爬 35 个页面找遮挡）+ 设计师帽子（整页逐张截图）+ 没看过需求的研发冷读（只用交付文档 + 字典还原需求）。

**修了什么**
- 字典：会弹登录框 / 弹窗的状态单独一个 iframe（`SectionCase.isolate`）：HA-15、HA-21c、SH-7、提现验证 ×4、现货撤单确认。`#home-all` 深链落到 Events 页。
- 首页：股票价钮进 `/spot`（原来进了合约页）；Editor's Desk / Sports 品类页精选的价钮带上 `side`（原来点 Down 打开是 Up）；「+N more」减去未开赛的舞台那场；舞台标签截断时只缩联赛名、时钟不丢；768–1279 宽度 Stocks 改一列、More 档位区放到标题下面（R7）；Traded today 只算 BTC（C3）；首屏骨架按各段最终高度占位（R6）。
- 现货页：页头倒计时徽章和「Closes in」对同一个时刻（交易截止）；图表横轴每个点一个本地时间，不再重复、不再写死美股时段；手机上图表里不再叠「Price to beat」字（页头已有）；金额快捷钮「win $x.xx」与主数字同公式同格式；右栏 More stocks 用和首页一样的头像，代码不再挤进 36px 小框。
- 快轮交易页时间改成看的人本地时间（原来是 UTC）。
- Sports：两队徽重叠从 10px 改 4px，前一个队的缩写不再被盖住；NFL / MLB 全部队伍的方块队徽取色入库（NFL 新球队原来画成方块）；网球缩写名首字母后用不换行空格。
- 字典 fixture：股票帧每轮按真实收盘时间（closes / opens / settles 不再自相矛盾）；新增 HA-10b 韩股帧；EV-20 NBA / NFL 不再写成 FOOTBALL；Desk 比赛精选队名顺序与主网一致；手机卡片骨架两颗钮不再溢出卡片。
- 文档：K4 / MB5 / R7 改写，新增 R9（只写在代码里的小规则成文）；home-all §4 字段、§5 Traded today / 资金比例条、§6 Korea；copy-dictionary 旧首页节标「已被 All 视图取代」，ST-1 `Settling` 禁令注明首页 `settling now` 例外。
