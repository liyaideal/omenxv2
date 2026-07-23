import { cn } from "@/lib/utils";

interface AmountTextProps {
  value: number | string;
  decimals?: number;
  className?: string;
  suffix?: string;
}

/**
 * AmountText - 用于显示数量值（如合约数量、份额等）
 * 自动应用 font-mono 样式
 * 
 * @example
 * <AmountText value={100} />
 * <AmountText value={50.5} suffix=" contracts" />
 */
export const AmountText = ({
  value,
  decimals = 0,
  className,
  suffix = "",
}: AmountTextProps) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  const formattedValue = numValue.toFixed(decimals);

  return (
    <span className={cn("font-mono", className)}>
      {formattedValue}{suffix}
    </span>
  );
};
