import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MonoTextProps {
  children: ReactNode;
  className?: string;
}

/**
 * MonoText - 通用等宽字体组件，用于任何需要 font-mono 的场景
 * 仅用于数值类内容！
 * 
 * @example
 * <MonoText>123.45</MonoText>
 * <MonoText className="text-lg">500</MonoText>
 */
export const MonoText = ({ children, className }: MonoTextProps) => {
  return <span className={cn("font-mono", className)}>{children}</span>;
};
