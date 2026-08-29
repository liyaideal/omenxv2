# 修复主页模块上方空白过大

## 问题
`/events` 主页内容区（chips 通栏条下方）到首个模块（Intraday / Sports 等）之间的空白过大，在桌面与移动端均显松散。

## 改动
1. `src/pages/lite/LiteEventsPage.tsx`
   - 主内容容器顶部内边距收紧：
     - 桌面：`py-6` → `pt-4 pb-6`
     - 移动端：`py-4` → `pt-3 pb-4`
2. `src/components/lite/home/HomeStage.tsx`
   - 舞台区顶部外边距收紧：
     - 桌面：`marginTop: 28` → `16`
     - 移动端：`marginTop: 18` → `10`
3. 验证
   - Playwright 截图确认 1280px 与 390px 下模块与 chips 条间距明显缩小且视觉紧凑。
   - TypeScript 检查通过。

## 零改动红线
- chips 行语义、顺序、点击行为不变。
- `LiteEventCard`、badges、目录排序不变。
- Footer 三行合规文案逐字节不动。
- 不新增页面/路由/交易页。
