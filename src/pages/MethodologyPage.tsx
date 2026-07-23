import { SeoPageLayout } from "@/components/seo";
import { FlaskConical } from "lucide-react";

const MethodologyPage = () => {
  return (
    <SeoPageLayout
      title="Methodology"
      description="How OmenX creates, prices, and settles event markets."
    >
      <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
        <div className="text-6xl md:text-8xl mb-6">🧪</div>
        <h2 className="text-lg md:text-2xl font-bold text-foreground mb-3">
          The lab hamster is still on its wheel…
        </h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-md leading-relaxed">
          Our methodology docs are being powered by a very hard-working hamster.<br />
          It needs a few more laps to finish 🐹💨
        </p>
        <div className="mt-8 px-4 py-2 rounded-full bg-muted/50 border border-border/30">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" />
            Content coming soon, stay tuned
          </span>
        </div>
      </div>
    </SeoPageLayout>
  );
};

export default MethodologyPage;
