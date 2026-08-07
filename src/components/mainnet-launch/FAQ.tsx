import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionShell, SectionTitle } from "./SectionShell";
import { trackMainnetLaunch } from "@/lib/mainnetLaunch";

const faqs = [
  { id: "volume", q: "What counts as trading volume?", a: "Trading volume = Open position amount + Close position amount. Only contract trading counts. Spot trading and fiat deposits are not included." },
  { id: "reward-time", q: "When do I get my reward?", a: "We pay out every day by 18:00 (UTC+8), covering trades from the previous day. USDC shows up directly in your trading account." },
  { id: "both-events", q: "Can I get both the bonus and the rebate?", a: "Yes. Your first $5K of volume unlocks the bonus and starts counting toward the rebate ladder at the same time. One trade path, two payouts." },
  { id: "cumulative", q: "Do the tier rewards stack?", a: "No. You get paid for the highest tier you hit. If you reach $100K in volume, you get $20 — not $5 + $10 + $20." },
  { id: "deposit", q: "Do I need to deposit $5,000?", a: "No. $5,000 is trading volume, not deposit amount. With leverage, you can reach this volume with a much smaller deposit. For example, 10x leverage on a $500 position can create $5,000 volume when you open and close it." },
  { id: "catch", q: "What's the catch?", a: "We just launched mainnet and want traders on the platform. The rewards come from our marketing budget. Trade, earn your bonus, and if you like the platform, stick around. That's the whole plan." },
];

export const FAQ = () => (
  <SectionShell>
    <SectionTitle eyebrow="FAQ" title="Questions traders actually ask." desc="Quick answers before you start." />
    <Accordion
      type="single"
      collapsible
      className="border-y border-border/50"
      onValueChange={(value) => value && trackMainnetLaunch("mainnet_launch_faq_expand", { question_id: value })}
    >
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id} className="border-border/40">
          <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline md:py-5 md:text-base">
            <span className="pr-6">{faq.q}</span>
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-sm leading-6 text-muted-foreground md:pb-5 md:text-base">
            {faq.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </SectionShell>
);
