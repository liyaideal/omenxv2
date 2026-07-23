# 后端参考边界说明（Backend Reference Boundary）— 交付说明

> 本仓库 Supabase 定位为**演示引擎（Demo Engine）**，不是正式后端。发布《后端参考边界说明》，逐个标注 35 张表 + 16 个 Edge Functions 的参考边界：🟢 规则照抄 / 🟡 规则在此实现自选 / 🔴 仅演示禁止参考实现，附 6 条通用红线与 5 条治理规则。研发评审需求时先查本文档，再看代码。

## 全文

见 [`docs/backend-boundary.md`](../backend-boundary.md)。

## 关键点

- **通用红线**：模拟数据不进正式系统 / long-short ↔ Yes-No 只在前端渲染 / 无 orders 表是原型缺口 / 出入金正式走 Cobo+Banxa+Socket / 新演示函数一律 `sim-` 前缀
- **治理规则**：状态走库内容走 mock / 单一演示引擎（主站/Sports/Pro/Lite 共用）/ schema 仅在本项目变更 / `sim-` 前缀 / 文档 append-only
- **扩张预告**：Pro 与 Lite 双前端 surface；现货产品线（新增 `product_line` 维度）；Sports 接入本引擎

## 落地要求

见 [`STATUS.md`](./STATUS.md) 顶部 BB1 / BB2 两条。
