import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TerminalTab {
  label: string;
  lang: "bash" | "python" | "ts";
  code: string;
}

interface Props {
  tabs: TerminalTab[];
  caption?: string;
  className?: string;
  showCursor?: boolean;
}

// Very lightweight syntax highlighter — no heavy deps
const highlight = (code: string, lang: TerminalTab["lang"]) => {
  const lines = code.split("\n");
  return lines.map((raw, i) => {
    // comments
    if (/^\s*#/.test(raw) || /^\s*\/\//.test(raw)) {
      return (
        <div key={i} className="text-muted-foreground">
          {raw || "\u00A0"}
        </div>
      );
    }
    // Tokenize by regex: strings, keywords, methods, numbers
    const parts: Array<{ t: string; c?: string }> = [];
    const kw =
      lang === "python"
        ? /\b(import|from|def|return|if|else|for|in|await|async|True|False|None)\b/
        : lang === "ts"
        ? /\b(const|let|var|function|await|async|import|from|export|return|if|else|new)\b/
        : /\b(curl|export|if|then|fi|echo)\b/;
    const method = /\b(GET|POST|DELETE|PUT|PATCH)\b/;
    const str = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/;
    const num = /\b\d+(\.\d+)?\b/;

    let rest = raw;
    let guard = 0;
    while (rest.length && guard++ < 200) {
      const matches = [
        { r: str, c: "text-trading-green" },
        { r: method, c: "text-trading-purple font-semibold" },
        { r: kw, c: "text-trading-purple" },
        { r: num, c: "text-primary" },
      ]
        .map((m) => {
          const mm = rest.match(m.r);
          return mm ? { idx: mm.index ?? -1, len: mm[0].length, text: mm[0], c: m.c } : null;
        })
        .filter((m): m is { idx: number; len: number; text: string; c: string } => !!m && m.idx >= 0)
        .sort((a, b) => a.idx - b.idx);

      if (!matches.length) {
        parts.push({ t: rest });
        break;
      }
      const first = matches[0];
      if (first.idx > 0) parts.push({ t: rest.slice(0, first.idx) });
      parts.push({ t: first.text, c: first.c });
      rest = rest.slice(first.idx + first.len);
    }

    return (
      <div key={i}>
        {parts.length ? (
          parts.map((p, j) => (
            <span key={j} className={p.c ?? "text-foreground/90"}>
              {p.t}
            </span>
          ))
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    );
  });
};

export const ApiTerminal = ({ tabs, caption, className, showCursor = true }: Props) => {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const tab = tabs[active];

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(tab.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-2xl overflow-hidden",
        className
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-trading-red/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-trading-yellow/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-trading-green/70" />
        </div>
        {caption && (
          <span className="ml-2 text-[11px] font-mono text-muted-foreground truncate">
            {caption}
          </span>
        )}
        <button
          onClick={onCopy}
          className="ml-auto flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3 h-3 text-trading-green" /> : <Copy className="w-3 h-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex border-b border-border/40 bg-background/40">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setActive(i)}
              className={cn(
                "px-3 py-1.5 text-[11px] font-mono border-r border-border/40 transition-colors",
                i === active
                  ? "text-foreground bg-card"
                  : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {/* Code */}
      <pre className="p-4 text-[11px] md:text-xs font-mono leading-relaxed overflow-x-auto">
        <code>
          {highlight(tab.code, tab.lang)}
          {showCursor && (
            <span className="inline-block w-1.5 h-3.5 bg-primary/80 animate-pulse align-middle ml-0.5" />
          )}
        </code>
      </pre>
    </div>
  );
};
