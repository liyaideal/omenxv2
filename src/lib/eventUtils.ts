import type { EventOption, TradingEvent } from "@/hooks/useEvents";
import { liteSideName } from "@/lib/liteSideName";

const norm = (s: string) => liteSideName(s.trim()).trim().toLowerCase();

/**
 * 判断一个事件是否为"单 market binary"：
 * 恰好两个 option，且两端是 Yes/No 的一对（字面量，或通过 side_labels 别名
 * 解析出的队名/盘口/Up-Down）。
 *
 * 第二参数 `event` 可选：只有传入时才做别名解析。不传时保持历史行为
 * （只认字面 yes/no），因为 Yes/No 取值/取 option 的调用方依赖字面模型。
 * 市场 chip 行（多 market 专属）必须传 event，binary 别名事件不显示 chips。
 */
export function isSingleMarketBinary(
  options: { label: string }[],
  event?: { sideLabels?: { yes: string; no: string }; side_labels?: unknown; name?: string } | null,
): boolean {
  if (!options || options.length !== 2) return false;
  const labels = options.map((o) => o.label.trim().toLowerCase()).sort();
  if (labels[0] === "no" && labels[1] === "yes") return true;
  if (!event) return false;

  const sl =
    event.sideLabels ??
    parseSideLabels((event as { side_labels?: unknown }).side_labels);
  const pair = options.map((o) => norm(o.label)).sort();
  if (sl) {
    const alias = [norm(sl.yes), norm(sl.no)].sort();
    if (pair[0] === alias[0] && pair[1] === alias[1]) return true;
  }
  // Up / Down（liteSideName 把 "Not Up" 归一成 Down）
  if (pair[0] === "down" && pair[1] === "up") return true;
  // 2-outcome 对阵 / 决斗事件："X vs Y"
  if (event.name && /\bvs\.?\b/i.test(event.name)) return true;
  return false;
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
