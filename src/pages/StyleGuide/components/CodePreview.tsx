import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CodePreviewProps {
  code: string;
  language?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export const CodePreview = ({
  code,
  language = "tsx",
  collapsible = false,
  defaultExpanded = true,
  className,
}: CodePreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");
  const isMultiline = lines.length > 1;
  const shouldCollapse = collapsible && lines.length > 5;

  return (
    <div
      className={cn(
        "mt-4 rounded-lg border border-border bg-background overflow-hidden relative group",
        className
      )}
    >
      {/* Header */}
      {(shouldCollapse || language) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/50">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {language}
          </span>
          {shouldCollapse && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-xs text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Expand ({lines.length} lines)
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Code Content */}
      <div className={cn("p-3 overflow-x-auto", shouldCollapse && !expanded && "max-h-[100px] overflow-hidden relative")}>
        <pre className="text-xs text-muted-foreground font-mono">
          <code>{code}</code>
        </pre>
        
        {/* Fade overlay when collapsed */}
        {shouldCollapse && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>

      {/* Copy Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-trading-green" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
};

interface InlineCodeProps {
  children: React.ReactNode;
  copyable?: boolean;
}

export const InlineCode = ({ children, copyable = false }: InlineCodeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof children === "string") {
      navigator.clipboard.writeText(children);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <code
      className={cn(
        "text-xs bg-muted px-1.5 py-0.5 rounded font-mono",
        copyable && "cursor-pointer hover:bg-muted/80"
      )}
      onClick={copyable ? handleCopy : undefined}
    >
      {children}
      {copyable && copied && (
        <Check className="inline-block ml-1 h-3 w-3 text-trading-green" />
      )}
    </code>
  );
};
