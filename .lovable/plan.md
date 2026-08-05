# 时间档位选择器文案统一为 ROUND

同一个控件（5m / 15m / 1h / 4h / 1D）目前在四处出现了三种写法。统一成 `ROUND`。快轮页收藏星标本轮不做。

## 现状盘点

| 位置 | 现在写的 | 改成 |
|---|---|---|
| 快轮交易页 圆盘上方 | `Round` | `ROUND` |
| Intraday 分类视图（桌面）右上 | `WINDOW` | `ROUND` |
| Crypto 分类视图（桌面）筛选行 | `Window` | `ROUND` |
| 移动端 Intraday 模块 | `Round` | `ROUND` |

不在本次范围：`Round #N`、`Round open $X`、`Round opens 09:30` —— 这些指「这一轮」这个对象，语义正确，保持原样。

## 改动内容

1. `LiteIntradayView.tsx` — 头部右侧标签 `WINDOW` → `ROUND`。
2. `LiteCryptoView.tsx` — `DimensionRow label="Window"` → `label="Round"`（该行渲染时自动大写）。
3. `LiteQuickTrade.tsx` / `MobileIntradayModule.tsx` — 档位选择器上方标签统一为 `ROUND`。
4. 组件重命名 `RoundLengthDial` → `RoundDial`（`verticalBlocks.tsx` 及全部引用点），消除「round length」这个已废弃说法在代码里的残留。
5. `docs/copy-dictionary.md` 新增一行：**Round** = 5m/15m/1h/4h/1D 档位选择器，禁用写法 `Window / WINDOW / Round length / Timeframe`。
6. Style guide 中相关注释与说明文案改为与字典一致的措辞。

## 不做

- 快轮交易页（LiteQuickTrade）不加收藏星标，保持线上现状。

## 技术说明

纯文案 + 组件重命名，无逻辑改动。`RoundDial` 保持相同 props（value / onSelect）与像素输出，只换名字与标签文本；桌面与移动两侧同步（CHK-7）。