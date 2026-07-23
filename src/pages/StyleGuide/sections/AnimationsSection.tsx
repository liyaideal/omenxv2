import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { SectionWrapper } from "../components/SectionWrapper";
import { CodePreview } from "../components/CodePreview";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AnimationsSectionProps {
  isMobile: boolean;
}

export const AnimationsSection = ({ isMobile }: AnimationsSectionProps) => {
  // Keys to force re-render and replay animations
  const [fadeKey, setFadeKey] = useState(0);
  const [scaleKey, setScaleKey] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [enterKey, setEnterKey] = useState(0);

  const replayFade = useCallback(() => setFadeKey(k => k + 1), []);
  const replayScale = useCallback(() => setScaleKey(k => k + 1), []);
  const replaySlide = useCallback(() => setSlideKey(k => k + 1), []);
  const replayEnter = useCallback(() => setEnterKey(k => k + 1), []);
  const replayAll = useCallback(() => {
    setFadeKey(k => k + 1);
    setScaleKey(k => k + 1);
    setSlideKey(k => k + 1);
    setEnterKey(k => k + 1);
  }, []);

  return (
    <SectionWrapper 
      id="animations" 
      title="Animations" 
      platform="shared"
      description="CSS keyframe animations defined in tailwind.config.ts"
    >
      <div className="flex justify-end mb-4">
        <Button variant="ghost" size="sm" onClick={replayAll} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Replay All
        </Button>
      </div>

      <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
        {/* Fade Animations */}
        <Card className="trading-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg">Fade Animations</CardTitle>
              <CardDescription>Smooth opacity + transform transitions</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={replayFade} className="h-8 w-8">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <div 
                  key={`fade-${fadeKey}`}
                  className="w-12 h-12 bg-primary rounded-lg mx-auto mb-2 animate-fade-in" 
                />
                <code className="text-xs">animate-fade-in</code>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-2 animate-pulse-soft" />
                <code className="text-xs">animate-pulse-soft</code>
              </div>
            </div>
            <CodePreview 
              code={`// Fade in with upward motion
<div className="animate-fade-in">Content</div>

// Custom duration
<div className="animate-[fade-in_0.5s_ease-out]">Content</div>

// Soft pulsing (continuous)
<div className="animate-pulse-soft">Pulsing</div>`}
            />
          </CardContent>
        </Card>

        {/* Scale Animations */}
        <Card className="trading-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg">Scale Animations</CardTitle>
              <CardDescription>Scale + opacity for emphasis</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={replayScale} className="h-8 w-8">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <div 
                  key={`scale-${scaleKey}`}
                  className="w-12 h-12 bg-trading-purple rounded-lg mx-auto mb-2 animate-scale-in" 
                />
                <code className="text-xs">animate-scale-in</code>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <div 
                  key={`enter-${enterKey}`}
                  className="w-12 h-12 bg-trading-purple rounded-lg mx-auto mb-2 animate-enter" 
                />
                <code className="text-xs">animate-enter</code>
              </div>
            </div>
            <CodePreview 
              code={`// Scale in (e.g., modals)
<div className="animate-scale-in">Modal</div>

// Combined fade+scale (enter)
<div className="animate-enter">Combined</div>`}
            />
          </CardContent>
        </Card>

        {/* Slide Animations */}
        <Card className="trading-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg">Slide Animations</CardTitle>
              <CardDescription>For sidebars, drawers, sheets</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={replaySlide} className="h-8 w-8">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg overflow-hidden">
              <div 
                key={`slide-${slideKey}`}
                className="w-16 h-16 bg-trading-green rounded-lg animate-slide-up" 
              />
            </div>
            <CodePreview 
              code={`<Sheet>
  <SheetContent className="animate-slide-in-right">
    Sidebar content
  </SheetContent>
</Sheet>

// Slide up animation
<div className="animate-slide-up">Content</div>`}
            />
          </CardContent>
        </Card>

        {/* Accordion Animations */}
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-lg">Accordion Animations</CardTitle>
            <CardDescription>Height + opacity for expandable content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs text-muted-foreground mb-2">
              Click to see the animation in action
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="demo" className="border-border/50">
                <AccordionTrigger className="text-sm">Click to expand/collapse</AccordionTrigger>
                <AccordionContent>
                  <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                    This content animates with <code className="text-xs bg-muted px-1 py-0.5 rounded">accordion-down</code> and <code className="text-xs bg-muted px-1 py-0.5 rounded">accordion-up</code> keyframes.
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <CodePreview 
              code={`// Applied automatically by shadcn Accordion
<AccordionContent>
  Animates with accordion-down/up
</AccordionContent>

// Keyframes in tailwind.config.ts
"accordion-down": {
  from: { height: "0" },
  to: { height: "var(--radix-accordion-content-height)" }
}`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Animation Reference Table */}
      <Card className="trading-card mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Animation Reference</CardTitle>
          <CardDescription>All available animation utilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Class</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Duration</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Effect</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Use Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr>
                  <td className="py-2 font-mono text-primary">animate-fade-in</td>
                  <td className="py-2">0.3s</td>
                  <td className="py-2">Opacity 0→1, translateY 10px→0</td>
                  <td className="py-2 text-muted-foreground">Page content, cards</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-primary">animate-slide-up</td>
                  <td className="py-2">0.4s</td>
                  <td className="py-2">Opacity 0→1, translateY 20px→0</td>
                  <td className="py-2 text-muted-foreground">Modals, staggered lists</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-primary">animate-scale-in</td>
                  <td className="py-2">0.2s</td>
                  <td className="py-2">Scale 0.95→1, opacity</td>
                  <td className="py-2 text-muted-foreground">Modals, popovers</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-primary">animate-enter</td>
                  <td className="py-2">0.3s</td>
                  <td className="py-2">Combined fade + scale</td>
                  <td className="py-2 text-muted-foreground">Dialogs, dropdowns</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-primary">animate-pulse-soft</td>
                  <td className="py-2">2s loop</td>
                  <td className="py-2">Subtle opacity pulse</td>
                  <td className="py-2 text-muted-foreground">Loading, attention</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-primary">animate-accordion-down</td>
                  <td className="py-2">0.2s</td>
                  <td className="py-2">Height expansion</td>
                  <td className="py-2 text-muted-foreground">Accordions (auto)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
};
