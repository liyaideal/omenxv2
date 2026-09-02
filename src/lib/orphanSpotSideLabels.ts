// 兜底只服务「事件行已被清理的存量结算仓」。真平台应让结算展示词随仓位存档、
// 不依赖事件行存活。
//
// 触发条件（三条同时满足才兜底）：
//   1. product_line === 'spot'
//   2. 事件行缺失（join 不到 events 行，sideLabels 为 undefined）
//   3. option_label ∈ {'Up', 'Down', 'Not Up'}
// 兜底值（保证腿自己的 option 能命中一侧）：
//   'Up' / 'Down' → { yes: 'Up', no: 'Down' }
//   'Not Up'      → { yes: 'Up', no: 'Not Up' }（Not Up 由展示层 liteSideName
//                    既有规则改写为 Down，这里不做二次改写）
// 不满足三条的孤儿腿不兜底，维持现状渲染。
// sideLabels 语义：undefined = 事件行缺失（可兜底）；null = 有事件行但无
// side_labels（非孤儿腿，原样透传为 undefined）；对象 = 原样透传。
export function orphanSpotSideLabels(
  productLine: unknown,
  sideLabels: { yes: string; no: string } | null | undefined,
  optionLabel: unknown,
): { yes: string; no: string } | undefined {
  if (productLine !== "spot") return sideLabels ?? undefined;
  if (sideLabels !== undefined) return sideLabels ?? undefined;
  const opt = typeof optionLabel === "string" ? optionLabel.trim() : "";
  if (opt === "Up" || opt === "Down") return { yes: "Up", no: "Down" };
  if (opt === "Not Up") return { yes: "Up", no: "Not Up" };
  return sideLabels;
}
