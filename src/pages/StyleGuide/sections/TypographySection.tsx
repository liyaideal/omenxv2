import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Check, X, Zap } from "lucide-react";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { CodePreview } from "../components/CodePreview";
import { PriceText, PercentText, AmountText, LabelText, AddressText, MonoText } from "@/components/typography";

interface TypographySectionProps {
  isMobile: boolean;
}

export const TypographySection = ({ isMobile }: TypographySectionProps) => {
  // Playground states
  const [typoPriceValue, setTypoPriceValue] = useState(1234.56);
  const [typoPricePrefix, setTypoPricePrefix] = useState("$");
  const [typoPriceDecimals, setTypoPriceDecimals] = useState(2);
  const [typoPriceShowSign, setTypoPriceShowSign] = useState(false);
  const [typoPriceColorByValue, setTypoPriceColorByValue] = useState(false);
  
  const [typoPercentValue, setTypoPercentValue] = useState(12.34);
  const [typoPercentDecimals, setTypoPercentDecimals] = useState(2);
  const [typoPercentShowSign, setTypoPercentShowSign] = useState(true);
  const [typoPercentColorByValue, setTypoPercentColorByValue] = useState(true);
  
  const [typoAmountValue, setTypoAmountValue] = useState(500);
  const [typoAmountDecimals, setTypoAmountDecimals] = useState(0);
  const [typoAmountSuffix, setTypoAmountSuffix] = useState(" contracts");
  
  const [typoLabelText, setTypoLabelText] = useState("Option Label");
  const [typoLabelSize, setTypoLabelSize] = useState<"xs" | "sm" | "base" | "lg">("base");
  const [typoLabelWeight, setTypoLabelWeight] = useState<"normal" | "medium" | "semibold" | "bold">("medium");
  const [typoLabelMuted, setTypoLabelMuted] = useState(false);
  
  const [typoAddress, setTypoAddress] = useState("0x1234567890abcdef1234567890abcdef12345678");
  const [typoAddressTruncate, setTypoAddressTruncate] = useState(true);
  const [typoAddressTruncateLength, setTypoAddressTruncateLength] = useState(6);

  return (
    <div className="space-y-12">
      {/* Font Families */}
      <SectionWrapper
        id="typography-fonts"
        title="Font Families"
        platform="shared"
        description="Inter for text labels and headlines, JetBrains Mono for numerical data"
      >
        <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg">Font Families</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sans (Inter) — primary text</p>
                <p className="text-2xl font-sans">The quick brown fox jumps</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mono (JetBrains Mono) — numbers, addresses</p>
                <p className="text-2xl font-mono">$1,234.56 (+12.34%)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Display (Space Grotesk) — marketing headlines only
                </p>
                <p className="font-display font-bold tracking-[-0.02em] text-3xl">
                  Trade outcome markets from code.
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">
                  Restricted to marketing surfaces (developer portal, landing). Never in product or
                  trading UI.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg">Marketing h1 · Inter vs Space Grotesk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Inter (product default)</p>
                <p className="text-3xl font-bold tracking-tight">Trade outcome markets from code.</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Space Grotesk (marketing)</p>
                <p className="font-display font-bold tracking-[-0.02em] text-3xl">
                  Trade outcome markets from code.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg">Type Scale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">text-xs (12px)</p>
              <p className="text-sm text-muted-foreground">text-sm (14px)</p>
              <p className="text-base">text-base (16px)</p>
              <p className="text-lg">text-lg (18px)</p>
              <p className="text-xl font-semibold">text-xl (20px)</p>
              <p className="text-2xl font-semibold">text-2xl (24px)</p>
              <p className="text-3xl font-bold">text-3xl (30px)</p>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>

      {/* Font Usage Guidelines - Detailed */}
      <SectionWrapper
        id="font-guidelines"
        title="Font Usage Guidelines"
        platform="shared"
        description="Detailed rules for when to use font-mono vs font-sans"
      >
        <Card className="trading-card border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Quick Reference Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Content Type</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Font</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Class / Component</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td className="py-2">Prices & Currency</td>
                    <td className="py-2 font-mono">JetBrains Mono</td>
                    <td className="py-2"><code className="text-primary text-[10px]">&lt;PriceText /&gt;</code></td>
                    <td className="py-2"><PriceText value={1234.56} prefix="$" /></td>
                  </tr>
                  <tr>
                    <td className="py-2">Percentages & ROI</td>
                    <td className="py-2 font-mono">JetBrains Mono</td>
                    <td className="py-2"><code className="text-primary text-[10px]">&lt;PercentText /&gt;</code></td>
                    <td className="py-2"><PercentText value={12.34} showSign colorByValue /></td>
                  </tr>
                  <tr>
                    <td className="py-2">Quantities & Amounts</td>
                    <td className="py-2 font-mono">JetBrains Mono</td>
                    <td className="py-2"><code className="text-primary text-[10px]">&lt;AmountText /&gt;</code></td>
                    <td className="py-2"><AmountText value={100} suffix=" contracts" /></td>
                  </tr>
                  <tr>
                    <td className="py-2">Wallet Addresses</td>
                    <td className="py-2 font-mono">JetBrains Mono</td>
                    <td className="py-2"><code className="text-primary text-[10px]">&lt;AddressText /&gt;</code></td>
                    <td className="py-2"><AddressText address="0x1234...5678" /></td>
                  </tr>
                  <tr>
                    <td className="py-2">Titles & Headlines</td>
                    <td className="py-2">Inter</td>
                    <td className="py-2"><code className="text-muted-foreground text-[10px]">(default)</code></td>
                    <td className="py-2 font-sans">Event Title</td>
                  </tr>
                  <tr>
                    <td className="py-2">Labels & Options</td>
                    <td className="py-2">Inter</td>
                    <td className="py-2"><code className="text-primary text-[10px]">&lt;LabelText /&gt;</code></td>
                    <td className="py-2"><LabelText>Yes / No</LabelText></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Correct vs Incorrect Examples */}
        <div className={`grid gap-6 mt-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
          <Card className="trading-card border-trading-green/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-trading-green">
                <Check className="h-4 w-4" />
                Correct Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-trading-green/5 rounded-lg">
                <span className="text-muted-foreground">Price</span>
                <PriceText value={0.45} prefix="$" className="text-lg" />
              </div>
              <div className="flex items-center justify-between p-3 bg-trading-green/5 rounded-lg">
                <span className="text-muted-foreground">PnL</span>
                <PercentText value={12.5} showSign colorByValue className="text-lg" />
              </div>
              <div className="flex items-center justify-between p-3 bg-trading-green/5 rounded-lg">
                <span className="text-muted-foreground">Option</span>
                <LabelText weight="semibold" className="text-lg">Yes</LabelText>
              </div>
              <div className="flex items-center justify-between p-3 bg-trading-green/5 rounded-lg">
                <span className="text-muted-foreground">Address</span>
                <AddressText address="0x1234567890abcdef" truncate />
              </div>
            </CardContent>
          </Card>

          <Card className="trading-card border-trading-red/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-trading-red">
                <X className="h-4 w-4" />
                Incorrect Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-trading-red/5 rounded-lg">
                <span className="text-muted-foreground">Price (sans)</span>
                <span className="font-sans text-lg line-through opacity-50">$0.45</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-trading-red/5 rounded-lg">
                <span className="text-muted-foreground">PnL (sans)</span>
                <span className="font-sans text-lg line-through opacity-50">+12.5%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-trading-red/5 rounded-lg">
                <span className="text-muted-foreground">Option (mono)</span>
                <span className="font-mono text-lg line-through opacity-50">Yes</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-trading-red/5 rounded-lg">
                <span className="text-muted-foreground">Address (sans)</span>
                <span className="font-sans text-sm line-through opacity-50">0x1234...cdef</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Decision Flowchart */}
        <Card className="trading-card mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-4 w-4 text-trading-yellow" />
              Decision Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <span className="font-mono text-primary shrink-0">1.</span>
                <div>
                  <p className="font-medium">Is it a number that changes dynamically?</p>
                  <p className="text-muted-foreground text-xs mt-1">Prices, percentages, quantities, balances → Use <code className="text-primary">font-mono</code></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <span className="font-mono text-primary shrink-0">2.</span>
                <div>
                  <p className="font-medium">Is it a technical identifier?</p>
                  <p className="text-muted-foreground text-xs mt-1">Wallet addresses, tx hashes, IDs → Use <code className="text-primary">font-mono</code></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <span className="font-mono text-primary shrink-0">3.</span>
                <div>
                  <p className="font-medium">Is it human-readable text?</p>
                  <p className="text-muted-foreground text-xs mt-1">Labels, titles, descriptions, option names → Use <code className="text-muted-foreground">font-sans</code> (default)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Typography Components */}
      <SectionWrapper
        id="typography-components"
        title="Typography Components Playground"
        platform="shared"
        description="Interactive playgrounds for semantic typography components from @/components/typography"
      >
        <div className="space-y-6">
          {/* PriceText */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-trading-green" />
                PriceText
              </CardTitle>
              <CardDescription>Display prices and currency values with automatic formatting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div className="bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] gap-4">
                  <span className="text-xs text-muted-foreground">Live Preview</span>
                  <div className="text-2xl">
                    <PriceText 
                      value={typoPriceValue} 
                      prefix={typoPricePrefix}
                      decimals={typoPriceDecimals}
                      showSign={typoPriceShowSign}
                      colorByValue={typoPriceColorByValue}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Value</Label>
                      <Input type="number" value={typoPriceValue} onChange={(e) => setTypoPriceValue(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Prefix</Label>
                      <Input value={typoPricePrefix} onChange={(e) => setTypoPricePrefix(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Decimals</Label>
                    <Select value={String(typoPriceDecimals)} onValueChange={(v) => setTypoPriceDecimals(parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4].map(d => (
                          <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Sign (+/-)</Label>
                    <Switch checked={typoPriceShowSign} onCheckedChange={setTypoPriceShowSign} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Color by Value</Label>
                    <Switch checked={typoPriceColorByValue} onCheckedChange={setTypoPriceColorByValue} />
                  </div>
                </div>
              </div>
              <CodePreview 
                code={`<PriceText 
  value={${typoPriceValue}} 
  prefix="${typoPricePrefix}"
  decimals={${typoPriceDecimals}}${typoPriceShowSign ? "\n  showSign" : ""}${typoPriceColorByValue ? "\n  colorByValue" : ""} 
/>`}
              />
            </CardContent>
          </Card>

          {/* PercentText */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-trading-purple" />
                PercentText
              </CardTitle>
              <CardDescription>Display percentages with automatic sign and color formatting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div className="bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] gap-4">
                  <span className="text-xs text-muted-foreground">Live Preview</span>
                  <div className="text-2xl">
                    <PercentText 
                      value={typoPercentValue} 
                      decimals={typoPercentDecimals}
                      showSign={typoPercentShowSign}
                      colorByValue={typoPercentColorByValue}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Value</Label>
                      <Input type="number" value={typoPercentValue} onChange={(e) => setTypoPercentValue(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Decimals</Label>
                      <Select value={String(typoPercentDecimals)} onValueChange={(v) => setTypoPercentDecimals(parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3].map(d => (
                            <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Sign</Label>
                    <Switch checked={typoPercentShowSign} onCheckedChange={setTypoPercentShowSign} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Color by Value</Label>
                    <Switch checked={typoPercentColorByValue} onCheckedChange={setTypoPercentColorByValue} />
                  </div>
                </div>
              </div>
              <CodePreview 
                code={`<PercentText 
  value={${typoPercentValue}}
  decimals={${typoPercentDecimals}}${typoPercentShowSign ? "\n  showSign" : ""}${typoPercentColorByValue ? "\n  colorByValue" : ""} 
/>`}
              />
            </CardContent>
          </Card>

          {/* AmountText */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                AmountText
              </CardTitle>
              <CardDescription>Display quantities with optional suffix</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div className="bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] gap-4">
                  <span className="text-xs text-muted-foreground">Live Preview</span>
                  <div className="text-2xl">
                    <AmountText 
                      value={typoAmountValue} 
                      decimals={typoAmountDecimals}
                      suffix={typoAmountSuffix}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Value</Label>
                      <Input type="number" value={typoAmountValue} onChange={(e) => setTypoAmountValue(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Decimals</Label>
                      <Select value={String(typoAmountDecimals)} onValueChange={(v) => setTypoAmountDecimals(parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3].map(d => (
                            <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Suffix</Label>
                    <Input value={typoAmountSuffix} onChange={(e) => setTypoAmountSuffix(e.target.value)} />
                  </div>
                </div>
              </div>
              <CodePreview 
                code={`<AmountText 
  value={${typoAmountValue}}
  decimals={${typoAmountDecimals}}
  suffix="${typoAmountSuffix}" 
/>`}
              />
            </CardContent>
          </Card>

          {/* LabelText */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-trading-yellow" />
                LabelText
              </CardTitle>
              <CardDescription>Display labels and option names with consistent styling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div className="bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] gap-4">
                  <span className="text-xs text-muted-foreground">Live Preview</span>
                  <div className="text-2xl">
                    <LabelText 
                      size={typoLabelSize}
                      weight={typoLabelWeight}
                      muted={typoLabelMuted}
                    >
                      {typoLabelText}
                    </LabelText>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Text</Label>
                    <Input value={typoLabelText} onChange={(e) => setTypoLabelText(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Size</Label>
                      <Select value={typoLabelSize} onValueChange={(v) => setTypoLabelSize(v as typeof typoLabelSize)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["xs", "sm", "base", "lg"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Weight</Label>
                      <Select value={typoLabelWeight} onValueChange={(v) => setTypoLabelWeight(v as typeof typoLabelWeight)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["normal", "medium", "semibold", "bold"].map(w => (
                            <SelectItem key={w} value={w}>{w}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Muted</Label>
                    <Switch checked={typoLabelMuted} onCheckedChange={setTypoLabelMuted} />
                  </div>
                </div>
              </div>
              <CodePreview 
                code={`<LabelText 
  size="${typoLabelSize}"
  weight="${typoLabelWeight}"${typoLabelMuted ? "\n  muted" : ""}
>
  ${typoLabelText}
</LabelText>`}
              />
            </CardContent>
          </Card>

          {/* AddressText */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-trading-yellow" />
                AddressText
              </CardTitle>
              <CardDescription>Display wallet/contract addresses with optional truncation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                <div className="bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px] gap-4">
                  <span className="text-xs text-muted-foreground">Live Preview</span>
                  <div className="text-lg">
                    <AddressText 
                      address={typoAddress}
                      truncate={typoAddressTruncate}
                      truncateLength={typoAddressTruncateLength}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Address</Label>
                    <Input value={typoAddress} onChange={(e) => setTypoAddress(e.target.value)} className="font-mono text-xs" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Truncate</Label>
                    <Switch checked={typoAddressTruncate} onCheckedChange={setTypoAddressTruncate} />
                  </div>
                  {typoAddressTruncate && (
                    <div className="space-y-2">
                      <Label className="text-xs">Truncate Length</Label>
                      <Select value={String(typoAddressTruncateLength)} onValueChange={(v) => setTypoAddressTruncateLength(parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[4, 6, 8, 10].map(l => (
                            <SelectItem key={l} value={String(l)}>{l} chars</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              <CodePreview 
                code={`<AddressText 
  address="${typoAddress.slice(0, 20)}..."${typoAddressTruncate ? `\n  truncate\n  truncateLength={${typoAddressTruncateLength}}` : ""} 
/>`}
              />
            </CardContent>
          </Card>

          {/* MonoText - Generic */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                MonoText
              </CardTitle>
              <CardDescription>Generic monospace wrapper for any numerical content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-xl p-6">
                <div className="flex flex-wrap gap-4 justify-center">
                  <MonoText className="text-lg">12345</MonoText>
                  <MonoText className="text-lg text-trading-green">+$500</MonoText>
                  <MonoText className="text-lg text-trading-red">-2.5%</MonoText>
                  <MonoText className="text-sm text-muted-foreground">0xabc...123</MonoText>
                </div>
              </div>
              <CodePreview 
                code={`<MonoText>12345</MonoText>
<MonoText className="text-trading-green">+$500</MonoText>
<MonoText className="text-trading-red">-2.5%</MonoText>`}
              />
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
    </div>
  );
};
