import { cn } from "@/lib/utils";

interface AddressTextProps {
  address: string;
  truncate?: boolean;
  truncateLength?: number;
  className?: string;
}

/**
 * AddressText - 用于显示钱包地址、交易哈希等
 * 自动应用 font-mono 样式，支持截断显示
 * 
 * @example
 * <AddressText address="0x1234567890abcdef1234567890abcdef12345678" truncate />
 * <AddressText address="0x1234...5678" />
 */
export const AddressText = ({
  address,
  truncate = false,
  truncateLength = 6,
  className,
}: AddressTextProps) => {
  const displayAddress = truncate && address.length > truncateLength * 2 + 3
    ? `${address.slice(0, truncateLength)}...${address.slice(-truncateLength)}`
    : address;

  return (
    <span className={cn("font-mono", className)}>
      {displayAddress}
    </span>
  );
};
