import { GraduationCap, Users, LayoutGrid, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/home/SectionHeader";

export const HomeMore = () => {
  const items = [
    {
      icon: GraduationCap,
      title: "Learning Center",
      desc: "Tutorials & guides",
      tone: "bg-primary/10 text-primary",
      onClick: () => toast("Learning Center coming soon!"),
    },
    {
      icon: Users,
      title: "Invite friends",
      desc: "Earn USDC rewards",
      tone: "bg-trading-green/10 text-trading-green",
      onClick: () => toast("Referral program coming soon!"),
    },
  ];

  return (
    <section aria-label="More">
      <SectionHeader icon={LayoutGrid} tone="muted" eyebrow="Explore" title="More" />
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ icon: Icon, title, desc, tone, onClick }) => (
          <button
            key={title}
            onClick={onClick}
            className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3.5 text-left transition-colors hover:bg-card-hover"
          >
            <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground truncate">{title}</div>
              <div className="text-[11px] text-muted-foreground truncate">{desc}</div>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </section>
  );
};
