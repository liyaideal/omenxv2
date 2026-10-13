/**
 * MarkdownBody — renders the markdownLite AST with the Lite prose tokens
 * (DESIGN §Addendum 2026-10-13 · Announcements). Desktop 15/24, mobile 14/22;
 * h3 15/22 600; lists with muted markers; links primary underlined; images
 * bordered 10px; GFM tables in a bordered scroll wrapper.
 */
import { Fragment, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { parseMarkdown, type Block, type Inline } from "@/lib/markdownLite";

const renderInline = (nodes: Inline[]): ReactNode =>
  nodes.map((n, i) => {
    switch (n.kind) {
      case "text":
        return <Fragment key={i}>{n.text}</Fragment>;
      case "strong":
        return (
          <strong key={i} className="font-semibold text-foreground">
            {renderInline(n.children)}
          </strong>
        );
      case "em":
        return <em key={i}>{renderInline(n.children)}</em>;
      case "code":
        return (
          <code key={i} className="rounded border border-border bg-muted/60 px-1 py-px font-mono text-[13px] text-foreground">
            {n.text}
          </code>
        );
      case "link":
        return (
          <a
            key={i}
            href={n.href}
            target={n.href.startsWith("/") ? undefined : "_blank"}
            rel={n.href.startsWith("/") ? undefined : "noopener noreferrer"}
            className="text-primary underline decoration-primary/40 underline-offset-[3px] transition-colors hover:decoration-primary"
          >
            {renderInline(n.children)}
          </a>
        );
      case "image":
        return <img key={i} src={n.src} alt={n.alt} loading="lazy" className="my-4 h-auto max-w-full rounded-[10px] border border-border" />;
    }
  });

const alignClass = (a: "left" | "center" | "right" | null) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

const renderBlock = (b: Block, i: number): ReactNode => {
  switch (b.kind) {
    case "p":
      return (
        <p key={i} className="mb-3.5 last:mb-0">
          {renderInline(b.children)}
        </p>
      );
    case "h":
      return b.level === 2 ? (
        <h2 key={i} className="mb-2 mt-6 font-display text-lg font-semibold leading-6 text-foreground first:mt-0">
          {renderInline(b.children)}
        </h2>
      ) : (
        <h3 key={i} className="mb-2 mt-[22px] text-[15px] font-semibold leading-[22px] text-foreground first:mt-0">
          {renderInline(b.children)}
        </h3>
      );
    case "ul":
    case "ol":
      return b.kind === "ul" ? (
        <ul key={i} className="mb-3.5 ml-[18px] list-disc space-y-1 marker:text-muted-foreground">
          {b.items.map((it, j) => (
            <li key={j}>{renderInline(it)}</li>
          ))}
        </ul>
      ) : (
        <ol key={i} className="mb-3.5 ml-[18px] list-decimal space-y-1 marker:text-muted-foreground">
          {b.items.map((it, j) => (
            <li key={j}>{renderInline(it)}</li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote key={i} className="mb-3.5 border-l-2 border-border pl-3 text-muted-foreground">
          {renderInline(b.children)}
        </blockquote>
      );
    case "hr":
      return <hr key={i} className="my-5 border-border" />;
    case "image":
      return (
        <figure key={i} className="my-4">
          <img src={b.src} alt={b.alt} loading="lazy" className="h-auto max-w-full rounded-[10px] border border-border" />
          {b.alt && <figcaption className="mt-1.5 text-xs text-muted-foreground">{b.alt}</figcaption>}
        </figure>
      );
    case "table":
      return (
        <div key={i} className="my-4 overflow-x-auto rounded-[10px] border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {b.header.map((c, j) => (
                  <th
                    key={j}
                    className={cn(
                      "border-b border-border bg-muted/30 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground",
                      alignClass(b.align[j] ?? null),
                    )}
                  >
                    {renderInline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, ri) => (
                <tr key={ri} className="border-b border-border/60 last:border-b-0">
                  {b.header.map((_, j) => (
                    <td key={j} className={cn("px-3 py-2 align-top tabular-nums", alignClass(b.align[j] ?? null))}>
                      {r[j] ? renderInline(r[j]) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
};

export const MarkdownBody = ({ source, className }: { source: string; className?: string }) => {
  const blocks = useMemo(() => parseMarkdown(source), [source]);
  return (
    <div className={cn("text-sm leading-[22px] text-foreground/[0.86] md:text-[15px] md:leading-6", className)}>
      {blocks.map(renderBlock)}
    </div>
  );
};
