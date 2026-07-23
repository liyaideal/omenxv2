import { useRef, useEffect } from "react";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { MobileHeader } from "@/components/MobileHeader";
import { SeoFooter } from "@/components/seo/SeoFooter";
import { useIsMobile } from "@/hooks/use-mobile";
import { HedgeHero } from "@/components/hedge/HedgeHero";
import { HedgeUpsetsStrip } from "@/components/hedge/HedgeUpsetsStrip";
import { HedgeHowItWorks } from "@/components/hedge/HedgeHowItWorks";
import { HedgeKeyRules } from "@/components/hedge/HedgeKeyRules";

import { HedgeFAQ } from "@/components/hedge/HedgeFAQ";
import { HedgeFinalCTA } from "@/components/hedge/HedgeFinalCTA";
import { HedgeMobileFloatingCTA } from "@/components/hedge/HedgeMobileFloatingCTA";

const HedgeLanding = () => {
  const isMobile = useIsMobile();
  const heroRef = useRef<HTMLDivElement>(null);

  const seoData = {
    title: "Hedge Your Polymarket World Cup Pick | OMENX — Redeem up to 500U",
    description: "World Cup upsets wiping out your Polymarket picks? Connect your wallet on OMENX, open a hedge, and redeem rewards up to 500U if it closes in profit. Not guaranteed.",
    ogTitle: "World Cup chaos? Hedge your Polymarket pick on OMENX.",
    ogDescription: "Open a hedge that moves opposite your pick — redeem up to 500U if it closes in profit. Not guaranteed, see campaign rules.",
    keywords: "leveraged prediction market, Polymarket hedge, hedge Polymarket position, World Cup prediction trading, Polymarket alternative",
    canonical: "https://omenx.lovable.app/campaign/world-cup-polymarket-hedge"
  };

  useEffect(() => {
    document.title = seoData.title;
    
    const metaTags = [
      { name: "description", content: seoData.description },
      { name: "keywords", content: seoData.keywords },
      { property: "og:title", content: seoData.ogTitle },
      { property: "og:description", content: seoData.ogDescription },
      { property: "og:url", content: seoData.canonical },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: seoData.ogTitle },
      { name: "twitter:description", content: seoData.ogDescription }
    ];

    metaTags.forEach(tag => {
      const selector = tag.name 
        ? `meta[name="${tag.name}"]` 
        : `meta[property="${tag.property}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        if (tag.name) element.setAttribute("name", tag.name);
        if (tag.property) element.setAttribute("property", tag.property);
        document.head.appendChild(element);
      }
      element.setAttribute("content", tag.content);
    });

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", seoData.canonical);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCF0] text-[#0E0E0E]">
      {isMobile ? (
        <MobileHeader title="World Cup H2E" showLogo={false} showBack={true} />
      ) : (
        <EventsDesktopHeader />
      )}

      <main className="flex-1">
        <div ref={heroRef}>
          <HedgeHero />
        </div>
        <HedgeUpsetsStrip />
        <HedgeHowItWorks />
        <HedgeKeyRules />
        
        <HedgeFAQ />
        <HedgeFinalCTA />
      </main>

      <div className="bg-background text-foreground">
        <SeoFooter />
      </div>
      <HedgeMobileFloatingCTA triggerRef={heroRef} />
    </div>
  );
};

export default HedgeLanding;