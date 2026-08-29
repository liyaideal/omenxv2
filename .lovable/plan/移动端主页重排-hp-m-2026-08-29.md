# 移动端主页重排（HP-M）

只改 Lite 主页 `/` 的移动分支：`HomeHero` / `HomeStage` / `HomeCryptoCard` / `HomeStocksCard` / `HomeSportsCard` / `HomeDeskCard` / `HomeTape` / `LiteEventsPage` 移动分支。桌面分支逐像素不动，Footer 三行 FROZEN，chips 行语义/顺序/行为不动，`LiteEventCard`、badges、排序、数据源不动，单交易页纪律不变。图片一律走 `public/assets/mobile/`。

## 实测到的移动端问题（393px）

1. Hero：山猫插画只有 240px 缩在右下角、被文字挤到边缘，标题 `maxWidth:280` 造成两行折断不自然。
2. Intraday 卡：`Round open $60,954` 与 `Last 8` 两段文字撞在一起没有换行；ETH/SOL 紧凑卡的 Up/Down 价格被卡片右边缘裁切（`46¢` / `54¢` 溢出）。
3. Stocks 卡：一次铺 10 行，纵向占了整屏，移动端没有收敛。
4. Sports 卡：日期胶囊栏 `TODAY / MON 31 / TUE 1` 相互粘连无间距；三向盘口 `Mars…` 被截断。
5. 各卡片内边距、卡间距沿用近似桌面的节奏，移动端偏松散。

## 要做的调整

### Hero（移动）
- 改为「插画在上、文案在下」的移动版式：`/assets/mobile/hero-lynx.png` 作为顶部通栏出血图（高度约 150–170px，`object-cover`，底部渐变收进背景），文案压在图下方，去掉 `maxWidth` 截断。
- badge/标题/副标题字号与行距按移动节奏收紧（标题 26–28px，副标题 13px），左右 16px 安全边。
- `<390px` 时插画降高而不是整块隐藏，避免小屏出现"半个 hero"。

### Intraday 卡（移动）
- `Round open …` 与 `Last 8` 拆成上下两行（或 `flex-wrap` + 至少 8px 间距），不再同行相撞。
- ETH/SOL 紧凑卡按钮：`min-width:0` + `flex:1` + 文本 `truncate`，价格右对齐不裁切；必要时价格字号降到 12px。
- 图表高度移动端下调，主卡与紧凑卡整体高度收紧。

### Stocks 卡（移动）
- 默认只展示前 5 行，底部一行 `Show all 10 →` 展开（或链接到既有股票视图，走现有路由，不新增页面）。
- 行高与图标尺寸按移动紧凑规格（行高 44px，头像 30px）。

### Sports 卡（移动）
- 日期胶囊栏改为横滑 rail：胶囊之间 8px gap、`flex-shrink:0`、隐藏滚动条，消除粘连。
- 三向盘口在移动端改为两行布局（主队/客队一行、Draw 单独一行）或等分三列 + 队名 `truncate`，不再出现 `Mars…` 与价格挤压。

### Editor's Desk 卡（移动）
- 引用文案行数收敛（3 行 clamp），序号与标题基线对齐，Yes/No 按钮沿用现有间距规则。

### 版面节奏
- `HomeStage` 移动端卡间距 18 → 14，卡内 padding 统一 `16px`。
- 目录区身份卡继续用 `/assets/mobile/will-it-happen.png`（已是移动资源，保持）。

## 技术说明

全部为展示层改动（布局、间距、字号、`truncate`/`flex` 约束、移动资源路径），不动数据 hook、路由与业务逻辑。改完在 390 / 393 / 430 三个宽度用 Playwright 截图核对：无横向溢出、无文字粘连、无价格裁切，Footer 仍通栏（`left===0 && right===innerWidth`）。

## 需要确认

Stocks 卡移动端默认展示 5 行 + 展开，如果希望保持全量 10 行直接说，我改为全量但收紧行高。
