import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { FAQ } from "./affiliateContent";

/**
 * /affiliate FAQ — shadcn Accordion (single, collapsible) over the frozen FAQ copy.
 * `defaultOpen` picks the item open on mount (page default: first item);
 * pass `null` for the all-collapsed state.
 * Visual spec: Figma Omenx_Affiliate 42:12394 (`lg`, desktop) / 46:13149 (`md`, mobile).
 */
export const AffiliateFaq = ({
  defaultOpen = "faq-0",
  size = "lg",
  className,
}: {
  defaultOpen?: string | null;
  size?: "lg" | "md";
  className?: string;
}) => (
  <Accordion
    type="single"
    collapsible
    defaultValue={defaultOpen ?? undefined}
    className={cn(size === "md" && "border-t border-border/40", className)}
  >
    {FAQ.map((f, i) => (
      <AccordionItem
        key={f.q}
        value={`faq-${i}`}
        className={cn(size === "lg" ? "border-foreground/10 last:border-b-0" : "border-border/40")}
      >
        <AccordionTrigger
          className={cn(
            "text-left font-display font-medium text-foreground hover:no-underline",
            size === "lg"
              ? "py-6 text-lg leading-7 [&>svg]:h-[18px] [&>svg]:w-[18px]"
              : "py-5 text-[17px] leading-[25.5px] tracking-[-0.34px] [&>svg]:h-4 [&>svg]:w-4",
          )}
        >
          {f.q}
        </AccordionTrigger>
        <AccordionContent
          className={cn(
            "font-sans text-sm text-muted-foreground",
            size === "lg" ? "max-w-[672px] pb-6 leading-6" : "pb-6 leading-[1.4]",
          )}
        >
          {f.a}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);
