import type { EventOption, TradingEvent } from "@/hooks/useEvents";

/**
 * 判断一个事件是否为"单 market binary"：
 * 恰好两个 option，且 label 是 Yes/No（大小写无关）。
 * 这种事件本质上是一个 market + 两个对立方向，
 * UI 上应把方向选择收敛到 Trade 面板，顶部 chip 行折叠成一个标签。
 */
export function isSingleMarketBinary(options: { label: string }[]): boolean {
  if (!options || options.length !== 2) return false;
  const labels = options.map((o) => o.label.trim().toLowerCase()).sort();
  return labels[0] === "no" && labels[1] === "yes";
}

/**
 * 获取一个 binary 事件的两端展示别名。
 * 默认 "Yes" / "No"；若事件配置了 sideLabels（如体育类的两个队名），优先使用。
 */
export function getBinarySideLabels(event: TradingEvent | null | undefined): {
  yes: string;
  no: string;
} {
  return {
    yes: event?.sideLabels?.yes ?? "Yes",
    no: event?.sideLabels?.no ?? "No",
  };
}

/**
 * 从 options 中找出 Yes 和 No 两个 option。
 * 仅在 isSingleMarketBinary 为 true 时调用。
 */
export function getYesNoOptions(options: EventOption[]): {
  yes: EventOption | undefined;
  no: EventOption | undefined;
} {
  return {
    yes: options.find((o) => o.label.trim().toLowerCase() === "yes"),
    no: options.find((o) => o.label.trim().toLowerCase() === "no"),
  };
}

/**
 * 把任意 JSON 形状的 side_labels 解析为 { yes, no } 或 undefined。
 * 用于从 DB row（events.side_labels: Json | null）和 UnifiedPosition 等数据层
 * 衍生展示别名时统一入口。
 */
export function parseSideLabels(raw: unknown): { yes: string; no: string } | undefined {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const sl = raw as Record<string, unknown>;
    if (typeof sl.yes === "string" && typeof sl.no === "string") {
      return { yes: sl.yes, no: sl.no };
    }
  }
  return undefined;
}

/**
 * 把一个 option label（"Yes" / "No" / 多 outcome 名）转换成展示文案。
 * - 多 outcome 事件（options 不是 binary）→ 原 label
 * - binary + 无 sideLabels → 仍是 "Yes" / "No"
 * - binary + 有 sideLabels → 返回对应队名/别名
 *
 * 调用方传 options 用来识别 binary，传 sideLabels 用来取别名。
 * 任意一方缺失都安全回退到原 label。
 */
export function getDisplayOptionLabel(
  optionLabel: string,
  options: { label: string }[] | null | undefined,
  sideLabels: { yes: string; no: string } | null | undefined,
): string {
  if (!sideLabels || !options || !isSingleMarketBinary(options)) return optionLabel;
  const lc = optionLabel.trim().toLowerCase();
  if (lc === "yes") return sideLabels.yes;
  if (lc === "no") return sideLabels.no;
  return optionLabel;
}

/**
 * Position 的"outcome"语义：对单 market binary 持仓，Yes/No 来自 option_label
 * （不再用 side 推导）。新模型下 Buy Yes 与 Buy No 是两个独立持仓，side: long
 * 仅表示"开多/持有"，short 表示"被卖出/减仓方向"。
 *
 * - 返回 "yes" / "no" 表示该持仓属于哪一端
 * - 返回 null 表示非 binary outcome（多 outcome 事件如 "Up >5%"），调用方
 *   应回退到原 side-driven 渲染
 */
export function getBinaryOutcome(optionLabel: string | null | undefined): "yes" | "no" | null {
  if (!optionLabel) return null;
  const lc = optionLabel.trim().toLowerCase();
  if (lc === "yes") return "yes";
  if (lc === "no") return "no";
  return null;
}
