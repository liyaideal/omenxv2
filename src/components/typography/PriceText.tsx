import { cn } from "@/lib/utils";

interface PriceTextProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  showSign?: boolean;
  colorByValue?: boolean;
}

/**
 * PriceText - 用于显示价格/货币值
 * 自动应用 font-mono 样式
 * 
 * @example
 * <PriceText value={0.45} prefix="$" />
 * <PriceText value={1234.56} prefix="$" decimals={2} />
 * <PriceText value={-50} prefix="$" colorByValue showSign />
 */
export const PriceText = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  className,
  showSign = false,
  colorByValue = false,
}: PriceTextProps) => {
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
      {sign}{prefix}{formattedValue}{suffix}
    </span>
  );
};
