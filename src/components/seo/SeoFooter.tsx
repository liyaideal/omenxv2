import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/Logo";

const footerLinks = {
  Platform: [
    { label: "Events", path: "/events" },
    { label: "Resolved", path: "/resolved" },
    { label: "Leaderboard", path: "/leaderboard" },
    { label: "Insights", path: "/insights" },
  ],
  "Learn More": [
    { label: "About", path: "/about" },
    { label: "FAQ", path: "/faq" },
    { label: "Glossary", path: "/glossary" },
    { label: "Methodology", path: "/methodology" },
    { label: "Developers", path: "/developers" },
    { label: "On-Chain Transparency", path: "/settings/transparency" },
  ],
  Legal: [
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "Terms of Service", path: "/terms-of-service" },
  ],
};

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

const FooterAccordion = ({ heading, links, navigate }: { heading: string; links: { label: string; path: string }[]; navigate: (path: string) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-sm font-semibold text-foreground"
      >
        {heading}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-40 pb-3" : "max-h-0"}`}>
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.path}>
              <button
                onClick={() => navigate(link.path)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const SeoFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border/30 bg-card/50 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Desktop layout */}
        <div className="hidden md:grid grid-cols-5 gap-8">
          {/* Brand */}
          <div>
            <button onClick={() => navigate("/")} className="mb-3">
              <Logo size="xl" />
            </button>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
              Trade on real-world event outcomes with transparent pricing and instant settlement.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-foreground mb-3">{heading}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.path}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Connect column */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Connect</h4>
            <div className="flex items-center gap-3 mb-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
            <a
              href="mailto:support@omenx.com"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              support@omenx.com
            </a>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          {/* Brand */}
          <div className="mb-6">
            <button onClick={() => navigate("/")} className="mb-2">
              <Logo size="lg" />
            </button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Trade on real-world event outcomes with transparent pricing and instant settlement.
            </p>
          </div>

          {/* Accordion links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <FooterAccordion key={heading} heading={heading} links={links} navigate={navigate} />
          ))}

          {/* Connect - always visible */}
          <div className="pt-4">
            <div className="flex items-center gap-4">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {s.icon}
                </a>
              ))}
              <a
                href="mailto:support@omenx.com"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                support@omenx.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/20 mt-8 pt-6 flex flex-col items-center gap-1.5 text-center">
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
