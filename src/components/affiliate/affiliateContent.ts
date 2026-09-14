/**
 * /affiliate — single source of copy & data for the Affiliate Program marketing page.
 * Copy is frozen from the approved program page (2026-09-14). Visual layer lives in
 * AffiliatePage / AffiliatePageMobile; do not paraphrase strings here.
 */
import ucl from "@/assets/affiliate/ucl.webp";
import nba from "@/assets/affiliate/nba.webp";
import nfl from "@/assets/affiliate/nfl.webp";
import ufc from "@/assets/affiliate/ufc.webp";
import btc from "@/assets/affiliate/btc.webp";
import eth from "@/assets/affiliate/eth.webp";
import sol from "@/assets/affiliate/sol.webp";
import pons from "@/assets/affiliate/pons.webp";
import nvda from "@/assets/affiliate/nvda.webp";
import hood from "@/assets/affiliate/hood.webp";
import sandisk from "@/assets/affiliate/sandisk.webp";
import mstr from "@/assets/affiliate/mstr.webp";
import binance from "@/assets/affiliate/binance.webp";
import bybit from "@/assets/affiliate/bybit.webp";
import okx from "@/assets/affiliate/okx.webp";
import coinbase from "@/assets/affiliate/coinbase.webp";
import partnerCryptoBanter from "@/assets/affiliate/partner-crypto-banter.webp";
import partnerBaseApac from "@/assets/affiliate/partner-base-apac.webp";

export const APPLY_URL = "https://ljp9k446231p.jp.larksuite.com/wiki/RQgiw4cQqi4KXKkb4MQjWCncp4g";
export const CONTACT_EMAIL = "affiliates@omenx.com";
export const INSIGHTS_URL = "https://www.omenx.com/insights";

export const HERO = {
  eyebrow: "OmenX Affiliate Program",
  titleLines: ["Bring your", "community."],
  titleAccent: "Build with OmenX.",
  intro:
    "Partner with a prediction market built for daily trading. Give your community fresh opportunities to trade and earn lifetime commissions as they grow.",
  primaryCta: "Become an affiliate",
  secondaryCta: "Explore the program",
  note: "For creators, key opinion leaders and trading networks.",
  artCaption: "Sports / Crypto / Finance",
  bottomLine: ["A growing platform.", "A new opportunity for your community."],
  snapshotLabel: "Platform snapshot.",
  snapshotLink: "Latest insights",
};

export const METRICS = [
  { value: "$2.7B", label: "Total trading volume" },
  { value: "17.6K", label: "Unique traders" },
  { value: "730+", label: "Active markets" },
];

/** In-page jump rail (replaces the original page's own nav). */
export const JUMP_LINKS = [
  { n: "01", label: "Benefits", href: "#benefits" },
  { n: "02", label: "How you earn", href: "#earnings" },
  { n: "03", label: "Get started", href: "#how-it-works" },
  { n: "04", label: "Markets", href: "#markets" },
  { n: "05", label: "Partnerships", href: "#partners" },
  { n: "06", label: "FAQ", href: "#faq" },
];

export const BENEFITS_HEAD = {
  eyebrow: "Why partner with us",
  title: ["A community you build.", "A partnership that lasts."],
  sub: "From your first referral to your next campaign, we help you grow with OmenX.",
};

export const BENEFITS = [
  { n: "01", title: "Lifetime commissions", body: "Earn continuously from your invitees’ eligible trading activity." },
  {
    n: "02",
    title: "Community rewards",
    body: "Offer trading fee rebates and tailored incentives to help attract and retain your audience.",
  },
  {
    n: "03",
    title: "Affiliate referral rewards",
    body: "Introduce other affiliates and earn additional rewards through the network they build.",
  },
  {
    n: "04",
    title: "Exclusive campaigns",
    body: "Access paid-content opportunities, performance rewards and campaigns shaped for your community.",
  },
  { n: "05", title: "Daily commission claims", body: "Eligible commissions become available to claim on T+1, subject to review." },
  {
    n: "06",
    title: "Dedicated BD support",
    body: "Get help with onboarding, promotional resources, community offers and campaign coordination.",
  },
];

export const EARNINGS_HEAD = {
  eyebrow: "Why partner with us",
  title: ["A closer look at", "what you can earn."],
  sub: "Explore the income streams behind your partnership, then see how the trading-fee base makes a difference.",
};

export type LedgerRow = { label: string; value: string; kind?: "input" | "formula" | "result" };
export type LedgerColumn = {
  who: string;
  title: string;
  desc: string;
  rows: LedgerRow[];
  resultLabel: string;
  resultValue: string;
};

export const HOW_YOU_EARN = {
  title: "How you earn with OmenX",
  intro: "Illustrative monthly example. A 50% commission rate is assumed for you and the affiliate you refer.",
  columns: [
    {
      who: "You",
      title: "Self-rebate",
      desc: "A rebate on your own eligible trading fees.",
      rows: [
        { label: "Eligible trading volume", value: "$10,000,000", kind: "input" },
        { label: "Trading fees at 0.4%", value: "$40,000" },
        { label: "Self-rebate assumed", value: "20%", kind: "input" },
        { label: "$40,000 × 20%", value: "$8,000", kind: "formula" },
      ],
      resultLabel: "Your self-rebate",
      resultValue: "$8,000",
    },
    {
      who: "Your invitees",
      title: "Trading-fee commission",
      desc: "Earn from the traders you bring to OmenX.",
      rows: [
        { label: "Opening trade volume", value: "$10,000,000", kind: "input" },
        { label: "Active-close volume", value: "$5,000,000", kind: "input" },
        { label: "Total eligible volume", value: "$15,000,000" },
        { label: "Trading fees at 0.4%", value: "$60,000" },
        { label: "$60,000 × 50% assumed commission", value: "$30,000", kind: "formula" },
      ],
      resultLabel: "Your invitee commissions",
      resultValue: "$30,000",
    },
    {
      who: "Affiliates you refer",
      title: "Affiliate referral reward",
      desc: "Earn a share of the referred affiliate’s commissions.",
      rows: [
        { label: "Their invitees’ volume", value: "$10,000,000", kind: "input" },
        { label: "Trading fees at 0.4%", value: "$40,000" },
        { label: "Their commission at 50%", value: "$20,000" },
        { label: "Your reward assumed", value: "10%", kind: "input" },
        { label: "$20,000 × 10%", value: "$2,000", kind: "formula" },
      ],
      resultLabel: "Your affiliate referral reward",
      resultValue: "$2,000",
    },
  ] as LedgerColumn[],
  totalLabel: "Total rewards & rebates",
  totalValue: "$40,000",
  totalBreakdown: "$32,000 commissions + $8,000 self-rebate",
  note: "Illustration only, using the stated rates and eligible taker trades at 0.4%, with no discounts or community rebates. Referral rewards are based on the referred affiliate’s eligible commission. Actual rates follow your agreement; earnings depend on eligible trading activity.",
};

export const FEE_BASE = {
  title: "The fee base makes a difference.",
  intro: "A separate comparison using $10 million of eligible taker trading volume and the same assumed 50% commission rate.",
  headline: { over: "Over", multiple: "6.6×", tail: "More Commission" },
  rows: [
    { name: "CEX benchmark", volume: "$10M", fee: "0.06%", rate: "50%", commission: "$3,000", highlight: false },
    { name: "OmenX", volume: "$10M", fee: "0.40%", rate: "50%", commission: "$20,000", highlight: true },
  ],
  columns: { volume: "Trading volume", fee: "Trading fee", rate: "Commission rate", commission: "Your commission" },
  caption: "Same volume. Same assumed commission rate.",
  note: "Illustrative benchmark, not a claim about every CEX program. Both examples assume the same 50% commission rate, all volume paying the stated taker fee, and no discounts or community rebate allocations. $20,000 ÷ $3,000 = approximately 6.67. Actual earnings depend on eligible activity and your agreement.",
};

export const EARNINGS_END = { line: "Build a partnership around your community.", cta: "Apply now" };

export const STEPS_HEAD = {
  eyebrow: "How it works",
  title: ["Your next partnership", "starts here."],
  cta: "Apply to join",
};

export const STEPS = [
  { n: "01", title: "Tell us about your audience", body: "Share your channels, your community and how you would like to work with OmenX." },
  { n: "02", title: "Build your partnership", body: "Our team reviews your application and discusses the right terms and support for you." },
  {
    n: "03",
    title: "Launch and keep growing",
    body: "Once approved, get your affiliate link and resources. Bring your community in and earn as they trade.",
  },
];

export const MARKETS_HEAD = {
  eyebrow: "Give them a reason to return",
  title: ["Topics they follow.", "Markets they can trade."],
  sub: "Short cycles and recurring events give you fresh ideas for content and community conversations.",
};

export const MARKETS = [
  {
    category: "Live sports",
    title: ["Every game.", "A fresh perspective."],
    body: "Trade changing outcomes as the action unfolds, from soccer and basketball to the biggest live sporting events.",
    logos: [
      { src: ucl, label: "UCL" },
      { src: nba, label: "NBA" },
      { src: nfl, label: "NFL" },
      { src: ufc, label: "UFC" },
    ],
  },
  {
    category: "Intraday crypto",
    title: ["The market", "never stands still."],
    body: "Up/Down markets on BTC, mainstream coins and more, across 5-minute, 15-minute, hourly and daily cycles.",
    logos: [
      { src: btc, label: "BTC" },
      { src: eth, label: "ETH" },
      { src: sol, label: "SOL" },
      { src: pons, label: "PONS" },
    ],
  },
  {
    category: "Daily finance",
    title: ["Familiar names.", "New ways to trade."],
    body: "Up/Down markets on globally followed stocks and equities, bringing prediction trading to daily market moves.",
    logos: [
      { src: nvda, label: "NVDA" },
      { src: hood, label: "HOOD" },
      { src: sandisk, label: "SanDisk" },
      { src: mstr, label: "MSTR" },
    ],
  },
];

export const MARKETS_NOTE = {
  strong: "More flexibility for active traders.",
  body: "Cross margin and position management before settlement.",
  chip: "Up to 5x leverage on eligible markets",
};

export const TEAM_PROOF = {
  line: ["Built by trading veterans", "with experience at"],
  ariaLabel: "Team experience: Binance, Bybit, OKX and Coinbase",
  logos: [
    { src: binance, alt: "Binance", wordmark: "Binance", primary: true },
    { src: bybit, alt: "Bybit" },
    { src: okx, alt: "OKX" },
    { src: coinbase, alt: "Coinbase" },
  ],
};

export const PARTNERS_HEAD = {
  eyebrow: "Partnerships in action",
  title: ["Connecting trading", "with real communities."],
};

export const PARTNERS = [
  {
    src: partnerCryptoBanter,
    alt: "OmenX World Cup livestream with Crypto Banter and football legends",
    label: "Sports & community",
    title: "Crypto Banter × Football Legends",
    body: "A World Cup livestream collaboration connecting live sports and prediction trading.",
  },
  {
    src: partnerBaseApac,
    alt: "OmenX featured on stage in Base APAC’s ecosystem showcase",
    label: "Ecosystem spotlight",
    title: "Part of the Base ecosystem",
    body: "Featured in Base APAC’s ecosystem showcase, alongside fellow builders.",
  },
];

export const BASE_LINE = { pre: "Built on", post: "One of its actively supported projects." };

export const FAQ_HEAD = { eyebrow: "A few things to know", title: "Questions?", help: "Our team is here to help." };

export const FAQ = [
  {
    q: "Who can apply?",
    a: "Content creators, community leaders, publishers and trading networks with an audience interested in sports, crypto or finance. Tell us about the community you have built and how you would like to introduce OmenX.",
  },
  {
    q: "How do I earn as an affiliate?",
    a: "Approved affiliates earn lifetime commissions on their invitees’ eligible trading activity. Additional referral rewards and campaign opportunities may also be available. Your partnership terms are discussed with our team during onboarding.",
  },
  {
    q: "What support will I receive?",
    a: "A dedicated BD contact can help with onboarding, promotional resources, community offers and campaign coordination.",
  },
  {
    q: "When can I claim commissions?",
    a: "Eligible commissions become available to claim on T+1, subject to review and the applicable program terms.",
  },
  {
    q: "What happens after I apply?",
    a: "Our team reviews your channels and community, then contacts you to discuss the partnership. Once approved, you can start sharing your affiliate link and introducing your audience to OmenX.",
  },
];

export const APPLY = {
  eyebrow: "Become an OmenX affiliate",
  title: "Your community.",
  titleAccent: "Our next chapter.",
  body: "Tell us about your community. Our team will get in touch to discuss your OmenX partnership.",
  cta: "Apply now",
  contactLead: "Prefer to get in touch directly?",
};

export const DISCLAIMER =
  "Affiliate approval, eligibility and program terms apply. Leverage is available on eligible markets and amplifies gains and losses. Trading involves risk.";
