import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is this free money?",
    a: "No. A Trial Position Voucher is not cash and is not withdrawable. It's used to open a hedge position on OmenX. If that position closes in profit, you can redeem rewards under the campaign rules.",
  },
  {
    q: "What if my hedge loses?",
    a: "Losses on the trial position won't be deducted from your main account balance.",
  },
  {
    q: "Is the 500U reward guaranteed?",
    a: "No. The max redeemable reward depends on your hedge position's performance, the entry price, and the campaign reward cap.",
  },
  {
    q: "Why connect my Polymarket wallet?",
    a: "So OmenX can read your on-chain World Cup exposure and match it with the right hedge. We only read positions — connecting does not move your funds.",
  },
];

const RULE_SECTIONS = [
  {
    title: "I. Eligibility",
    items: [
      "This campaign is open only to invited users in designated regions. Users from restricted regions are not eligible to participate.",
    ],
  },
  {
    title: "II. Reward Distribution Rules",
    items: [
      "Airdrop positions are simulated positions used only to track profit performance. They do not require or use any real user funds. Airdrop positions cannot be traded, closed, increased, or manually adjusted.",
      "The direction of the airdrop position will be opposite to the user's original Polymarket position. For example, if a user holds a LONG position on Polymarket for BTC > $100K, the user will receive a corresponding SHORT airdrop position.",
      "Each Polymarket event can only receive one airdrop position reward.",
      "After a Polymarket account is successfully connected, the system will scan eligible positions every 15 minutes. Airdrop positions will only be issued after the scan confirms that all requirements are met. Please refer to the actual arrival time in your account.",
      "Once an airdrop position is issued, users must claim it within 72 hours. Unclaimed airdrop positions will automatically expire.",
    ],
    subSections: [
      {
        subtitle: "Airdrop position settlement rules",
        items: [],
        nested: [
          {
            title: "Settlement conditions",
            items: [
              "Event settlement: The corresponding Polymarket event has ended.",
              "Original position closure: If the system detects that the user has reduced the original Polymarket position by 80% or more, the profit will be calculated based on the market price at that time. After settlement, positive profit, if any, will be credited to the user's trading account balance.",
            ],
          },
          {
            title: "Settlement amount rules",
            items: [
              "The total settlement profit from airdrop positions is subject to a per-account cap of 500U.",
              "Settlement rewards must meet the corresponding valid trading volume requirements before they can be unlocked in stages and used for trading or withdrawal.",
            ],
          },
          {
            title: "Valid trading volume",
            items: [
              "Only trading volume with an actual fee rate of 0.04% or higher will be counted.",
              "Trading volume below this threshold will not count toward the unlocking progress.",
            ],
          },
          {
            title: "Airdrop position limits",
            items: [
              "The daily platform-wide limit for airdrop positions is 500 positions. Once the daily limit is reached, no additional airdrop positions will be issued that day.",
              "The total prize pool for this airdrop position campaign is 150,000U. Once the prize pool limit is reached, the campaign will end early, and any unsettled or locked reward amounts will no longer be available for continued use.",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "III. Risk Control and Disclaimer",
    items: [
      "Users identified by the platform's risk control system as engaging in abnormal activity will be disqualified from participating and receiving rewards.",
      "If the platform determines that a user has engaged in cheating, abuse, or any other violation, OMENX reserves the right to cancel the user's campaign eligibility and reclaim any rewards already issued, without prior notice.",
      "If users have any dispute regarding campaign rewards, they must contact customer support via Discord within 7 days after the campaign ends: https://discord.com/invite/qXssm2crf9. Any claim submitted after this period will be deemed as a voluntary waiver of the relevant rights.",
      "OMENX reserves the right to adjust or amend these campaign rules without prior notice.",
      "OMENX reserves the final right of interpretation for this campaign.",
    ],
  },
];

export const HedgeFAQ = () => {
  return (
    <section className="bg-[#FDFCF0] py-12 md:py-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="mb-8 md:mb-10">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1D4ED8]">
            FAQ
          </p>
          <h2 className="mt-2 font-poster text-3xl uppercase leading-tight tracking-tight text-[#0E0E0E] md:text-5xl">
            Quick answers.
          </h2>
        </div>

        <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-3">
          {FAQS.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="overflow-hidden border-2 border-[#0E0E0E] bg-white px-5"
            >
              <AccordionTrigger className="text-left font-poster text-base uppercase tracking-tight text-[#0E0E0E] hover:no-underline md:text-lg">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-[#0E0E0E]/80 md:text-base">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
          <AccordionItem
            value="faq-rules"
            className="overflow-hidden border-2 border-[#0E0E0E] bg-white px-5"
          >
            <AccordionTrigger className="text-left font-poster text-base uppercase tracking-tight text-[#0E0E0E] hover:no-underline md:text-lg">
              What are the campaign rules?
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-[#0E0E0E]/80 md:text-base">
              <div className="space-y-5 pb-2">
                {RULE_SECTIONS.map((section, idx) => (
                  <div key={idx}>
                    <h3 className="font-poster text-sm font-bold uppercase tracking-tight text-[#0E0E0E] md:text-base">
                      {section.title}
                    </h3>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5">
                      {section.items.map((item, j) => (
                        <li key={j} className="text-sm leading-relaxed md:text-base">
                          {item}
                        </li>
                      ))}
                    </ul>
                    {section.subSections?.map((sub, k) => (
                      <div key={k} className="mt-3 pl-2">
                        <h4 className="text-sm font-semibold text-[#0E0E0E] md:text-base">
                          {sub.subtitle}
                        </h4>
                        {sub.items && sub.items.length > 0 && (
                          <ul className="mt-1.5 list-disc space-y-1 pl-5">
                            {sub.items.map((item, j) => (
                              <li key={j} className="text-sm leading-relaxed md:text-base">
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                        {sub.nested?.map((nest, m) => (
                          <div key={m} className="mt-2.5">
                            <h5 className="text-xs font-semibold uppercase tracking-wide text-[#0E0E0E]/70 md:text-sm">
                              {nest.title}
                            </h5>
                            <ul className="mt-1.5 list-disc space-y-1 pl-5">
                              {nest.items.map((item, j) => (
                                <li key={j} className="text-sm leading-relaxed md:text-base">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};
