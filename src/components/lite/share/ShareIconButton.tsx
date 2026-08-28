// ============================================================
// 28px ghost share icon button (SH-b §1/§3). Pure presentation — the caller
// owns the share flow. Never rendered unless a page passes an onShare handler.
// ============================================================
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const ShareIconButton = ({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) => (
  <button
    type="button"
    aria-label="Share"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={cn(
      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-[#33D6FF]",
      className,
    )}
  >
    <Share2 className="h-4 w-4" />
  </button>
);

export default ShareIconButton;
