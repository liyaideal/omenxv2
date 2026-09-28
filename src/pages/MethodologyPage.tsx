import { t } from "@/i18n";
import { SeoPageLayout } from "@/components/seo";
import { FlaskConical } from "lucide-react";

const MethodologyPage = () => {
  return (
    <SeoPageLayout
      title={t("legal.methodology.title")}
      description={t("legal.methodology.description")}
    >
      <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
        <div className="text-6xl md:text-8xl mb-6">🧪</div>
        <h2 className="text-lg md:text-2xl font-bold text-foreground mb-3">
          {t("legal.methodology.heading")}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-md leading-relaxed">
          {t("legal.methodology.body_line_1")}<br />
          {t("legal.methodology.body_line_2")}
        </p>
        <div className="mt-8 px-4 py-2 rounded-full bg-muted/50 border border-border/30">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" />
            {t("legal.pages.faq.badge")}
          </span>
        </div>
      </div>
    </SeoPageLayout>
  );
};

export default MethodologyPage;
