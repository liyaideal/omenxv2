import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface LabelTextProps {
  children: ReactNode;
  className?: string;
  muted?: boolean;
  size?: "xs" | "sm" | "base" | "lg";
  weight?: "normal" | "medium" | "semibold" | "bold";
}

/**
 * LabelText - 用于显示标签、选项名称、事件标题等文本内容
 * 自动应用 font-sans (Inter) 样式
 * 
 * @example
 * <LabelText>Yes</LabelText>
 * <LabelText muted size="sm">Option Label</LabelText>
 */
export const LabelText = ({
  children,
  className,
  muted = false,
  size = "base",
  weight = "normal",
}: LabelTextProps) => {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  };

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  return (
    <span
      className={cn(
        "font-sans",
        sizeClasses[size],
        weightClasses[weight],
        muted && "text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
};
