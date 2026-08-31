# 批量平仓抽屉排版合规修正（DESIGN.md §5.1）

修正 `BatchCashOutConfirm` 移动端抽屉（及共用 `ConfirmBody` 的桌面 Dialog），对照 DESIGN.md §5.1 MobileDrawer 内容规范的偏差：

## 发现的偏差

1. **主按钮样式**：平仓属不可逆操作，规范要求 Destructive 红 `bg-trading-red text-white hover:bg-trading-red/90`，当前是默认 primary。
2. **MobileDrawerActions**：规范锁定写法 `className="flex gap-2 space-y-0"`，当前是 `mt-4`。
3. **内容根容器间距**：规范要求根容器 `space-y-4`（16px 区块距），当前 disclaim­er 用 `mt-2` 紧贴卡片。
4. **卡内行间距**：规范 `space-y-1.5`，当前用 `divide-y + py-2`。
5. **硬编码颜色**：`text-[#6B7280]` 多处，规范/主题要求用 `text-muted-foreground` token。
6. **合计行**："You get about" 改为规范的 key-value 行（`text-xs`，value `font-mono text-right`），保持现有文案不变。

## 改动范围

- `src/components/portfolio/lite/BatchCashOut.tsx`：仅 `ConfirmBody` / `Actions` / `BatchCashOutConfirm` 三个块的 className 与按钮 variant，逻辑、文案、数据不动。
  - `ConfirmBody` 根包 `space-y-4`；行列表改 `space-y-1.5` 去掉 divide/py；卡片保持 `rounded-lg border bg-muted/30 p-3`（已合规）。
  - `Actions` 主按钮改 `className="h-11 flex-1 bg-trading-red text-white hover:bg-trading-red/90"`；Cancel 保持 outline h-11 flex-1。
  - 移动端 `MobileDrawerActions className="flex gap-2 space-y-0"`；桌面 Dialog footer 保持 `mt-4 flex gap-2`（CHK-7：桌面沿用同一 Actions 组件，同样变红）。
- 灰色文本统一 `text-muted-foreground`。

## 不动

- 选择工具栏、sticky action bar、平仓执行逻辑、单行 Cash out、Pro 页面。
- 文案（"Cash out"、"You get about"、disclaimer）不变。

## 验证

- Typecheck。
- Playwright 390px 打开 Style Guide `portfolio-lite-live-select` 预览（或 mock 打开确认抽屉），截图核对：红色主按钮、间距、token 颜色。
- 同步更新 `docs/delivery/lite-portfolio-spec-v2.md` 对应描述与 `docs/changelog/STATUS.md`。
