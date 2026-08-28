import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useSurface } from "@/contexts/SurfaceContext";

type FooterLink = { label: string; path: string };

const socialLinks = [
  {
    label: "X",
    href: "https://x.com/OmenX_Official",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Discord",
    href: "https://discord.gg/qXssm2crf9",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.8733.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
      </svg>
    ),
  },
];

const COLUMN_HEADING =
  "font-display text-[13px] font-bold uppercase tracking-[0.10em] text-foreground mb-3";
const LINK_CLASS = "text-xs text-muted-foreground hover:text-foreground transition-colors";
const SOCIAL_CLASS =
  "w-[34px] h-[34px] inline-flex items-center justify-center rounded-full border border-border/30 text-muted-foreground hover:text-foreground hover:border-border transition-colors";

const FooterAccordion = ({ heading, links }: { heading: string; links: FooterLink[] }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 font-display text-[13px] font-bold uppercase tracking-[0.10em] text-foreground"
      >
        {heading}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-40 pb-3" : "max-h-0"}`}>
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.path}>
              <Link to={link.path} className={LINK_CLASS}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const SeoFooter = () => {
  const { surface } = useSurface();
  const isLite = surface === "lite";

  const platformLinks: FooterLink[] = [
    { label: "Events", path: "/events" },
    // Lite has no Resolved page — the route bounces back to /events, so keep it Pro-only.
    ...(isLite ? [] : [{ label: "Resolved", path: "/resolved" }]),
    { label: "Leaderboard", path: "/leaderboard" },
    { label: "Insights", path: "/insights" },
  ];

  const columns: { heading: string; links: FooterLink[] }[] = [
    { heading: "Platform", links: platformLinks },
    {
      heading: "Learn",
      links: [
        { label: "About", path: "/about" },
        { label: "FAQ", path: "/faq" },
        { label: "Glossary", path: "/glossary" },
        { label: "Methodology", path: "/methodology" },
      ],
    },
    {
      heading: "Resources",
      links: [
        { label: "Developers", path: "/developers" },
        { label: "On-Chain Transparency", path: "/settings/transparency" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy Policy", path: "/privacy-policy" },
        { label: "Terms of Service", path: "/terms-of-service" },
      ],
    },
  ];

  const socialRow = (
    <div className="flex items-center gap-3">
      {socialLinks.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className={SOCIAL_CLASS}
        >
          {s.icon}
        </a>
      ))}
    </div>
  );

  return (
    <footer className="border-t border-border/30 bg-card/50 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Desktop layout */}
        <div className="hidden md:grid grid-cols-12 gap-8">
          {/* Brand + Connect */}
          <div className="col-span-4">
            <Link to="/" className="inline-block mb-3">
              <Logo size="xl" showMainnetBadge={false} />
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
              Trade on real-world event outcomes with transparent pricing and instant settlement.
            </p>
            <div className="mt-4">{socialRow}</div>
            <a href="mailto:support@omenx.com" className={`${LINK_CLASS} mt-3 inline-block`}>
              support@omenx.com
            </a>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading} className="col-span-2">
              <h4 className={COLUMN_HEADING}>{col.heading}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className={LINK_CLASS}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          {/* Brand */}
          <div className="mb-6">
            <Link to="/" className="inline-block mb-2">
              <Logo size="lg" showMainnetBadge={false} />
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Trade on real-world event outcomes with transparent pricing and instant settlement.
            </p>
            <div className="mt-4 flex items-center gap-4">
              {socialRow}
              <a href="mailto:support@omenx.com" className={LINK_CLASS}>
                support@omenx.com
              </a>
            </div>
          </div>

          {/* Accordion links */}
          {columns.map((col) => (
            <FooterAccordion key={col.heading} heading={col.heading} links={col.links} />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/20 mt-8 pt-6 flex flex-col items-center gap-1.5 text-center">
          <p className="text-xs text-muted-foreground">
            OmenX is operated by Nuvion Holdings Ltd., a company incorporated in the Cayman Islands.
          </p>
          <p className="text-xs text-muted-foreground">
            © 2026 OmenX. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            For informational purposes only. Not financial advice. Trading involves risk of loss.
          </p>
        </div>
      </div>
    </footer>
  );
};
