import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { SeoFooter } from "./SeoFooter";
import { useIsMobile } from "@/hooks/use-mobile";

interface SeoPageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export const SeoPageLayout = ({ children, title, description }: SeoPageLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {isMobile ? (
        <MobileHeader title={title} showLogo={false} showBack={true} />
      ) : (
        <EventsDesktopHeader />
      )}

      {/* Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-5 md:px-8 py-6 md:py-12">
        {description && (
          <div className="mb-6 md:mb-8 pb-6 border-b border-border/30">
            <h1 className="text-xl md:text-3xl font-bold text-foreground mb-1.5">{title}</h1>
            <p className="text-muted-foreground text-xs md:text-base">{description}</p>
          </div>
        )}
        {!description && (
          <h1 className="text-xl md:text-3xl font-bold text-foreground mb-6 md:mb-8">{title}</h1>
        )}
        <div className="legal-prose">
          {children}
        </div>
      </main>

      {/* Footer */}
      <SeoFooter />
    </div>
  );
};
