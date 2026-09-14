import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { FAQ } from "./affiliateContent";

/**
 * /affiliate FAQ — shadcn Accordion (single, collapsible) over the frozen FAQ copy.
 * `defaultOpen` picks the item open on mount (page default: first item);
 * pass `null` for the all-collapsed state.
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
  <Accordion type="single" collapsible defaultValue={defaultOpen ?? undefined} className={cn("border-t border-border/40", className)}>
    {FAQ.map((f, i) => (
      <AccordionItem key={f.q} value={`faq-${i}`} className="border-border/40">
        <AccordionTrigger
          className={cn(
            "text-left font-display font-medium text-foreground hover:no-underline",
            size === "lg" ? "text-lg py-6" : "text-[17px] py-5",
          )}
        >
          {f.q}
        </AccordionTrigger>
        <AccordionContent className={cn("text-[15px] text-muted-foreground leading-relaxed", size === "lg" ? "pb-7 max-w-2xl" : "pb-6")}>
          {f.a}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);
