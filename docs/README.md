# OmenX 产品文档目录

本目录承载 **产品需求 / 设计规范 / 交付说明**，是研发对齐需求的唯一可信来源。

> 背景：Lovable 端只负责产出需求原型 + 设计规范，研发团队基于另一套工程实现。Lovable push 到 GitHub 的代码仅用于"参考实现"，**真正的需求事实以本目录文档为准**。

---

## 目录结构

```
docs/
├── README.md                    ← 你正在看的文件
└── changelog/                   ← 每次需求/迭代的交付说明
    ├── INDEX.md                 ← 按时间倒序的全量索引
    └── YYYY-MM-DD-{slug}.md     ← 单次交付文档
```

此外，长效规范在仓库根目录：

| 文件 | 内容 |
|---|---|
| `DESIGN.md` | 产品端设计系统（typography / spacing / overlay / drawer / card 等长效规范） |
| `CAMPAIGN_DESIGN.md` | 活动落地页设计系统（独立于产品端） |
| `.lovable/memory/` | Lovable agent 的项目记忆（核心规则、feature 决策），可作参考 |

---

## 研发使用方式

每次 pull Lovable 仓库后：

1. **先看 `docs/changelog/INDEX.md`**，确认自上次同步以来新增哪几份交付文档
2. 逐份阅读对应 `YYYY-MM-DD-{slug}.md`，每份文档已用统一骨架写清"做了什么 / 没动什么 / 已废弃什么"
3. 再到你们自己的工程里实施改动；遇到规范类问题（颜色、字号、组件用法）查 `DESIGN.md`
4. 建议在你们仓库内对同步点打 tag：`spec/YYYY-MM-DD-{slug}`，便于后续追溯某个需求版本对应的代码状态
5. **追踪实施进度**：见 [`docs/changelog/STATUS.md`](./changelog/STATUS.md)。研发每完成一项请改对应状态标记，PM 每周回顾未完成项

**不要**直接 diff Lovable 仓库的 commit 来反推需求 —— commit 颗粒度很碎，且 Lovable 改动会包含许多与本次需求无关的样式调整。

---

## 交付文档结构（写作骨架）

每份 `docs/changelog/*.md` 遵循以下骨架（按需取舍）：

| 章节 | 内容 |
|---|---|
| 顶部 quote block | 一句话定位：版本、覆盖范围、是否替代旧文档 |
| §1 功能目标 | 做什么、给谁用、关键约束（3–6 行） |
| §2 状态机 / 数据模型 | 有状态流转就放这里，表格化 |
| §3 数据库 | 表结构 + RLS + Trigger |
| §4 用户端流程 | 按页面/步骤分小节，每节给入口 + 模块顺序 |
| §5 Admin 端 | 若有 |
| §6 已删除 / 已废弃 | 表格列出，研发据此清理代码 |
| §7 Style Guide | `/style-guide` 中的 playground 位置 |
| §8 涉及文件 | 前端 / 后端 / 数据库 分组列路径 |
| §9 未变更项 | 明确哪些没动，避免 QA 误测 |

**文件命名：** `YYYY-MM-DD-{slug}.md`，slug 用短横线，例如 `2026-05-20-recovery-v2.md`。

---

## 反馈

若发现某份交付文档与实现不一致、或漏写关键字段，直接在 Lovable 聊天里提出，PM 会重新产出修订版（命名加 `-v2`、`-v3` 后缀，旧版本不删除，保留历史）。
