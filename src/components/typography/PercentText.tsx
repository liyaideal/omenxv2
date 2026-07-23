import { cn } from "@/lib/utils";

interface PercentTextProps {
  value: number | string;
  decimals?: number;
  className?: string;
  showSign?: boolean;
  colorByValue?: boolean;
}

/**
 * PercentText - 用于显示百分比值
 * 自动应用 font-mono 样式
 * 
 * @example
 * <PercentText value={12.5} />
 * <PercentText value={-5.2} colorByValue showSign />
 */
export const PercentText = ({
  value,
  decimals = 2,
  className,
  showSign = false,
  colorByValue = false,
}: PercentTextProps) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  const isPositive = numValue > 0;
  const isNegative = numValue < 0;
  
  const formattedValue = Math.abs(numValue).toFixed(decimals);
  const sign = showSign ? (isPositive ? "+" : isNegative ? "-" : "") : (isNegative ? "-" : "");
  
  const colorClass = colorByValue
    ? isPositive
      ? "text-trading-green"
      : isNegative
      ? "text-trading-red"
      : ""
    : "";

  return (
    <span className={cn("font-mono", colorClass, className)}>
      {sign}{formattedValue}%
    </span>
  );
};
