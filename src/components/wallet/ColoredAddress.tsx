/**
 * ColoredAddress — DESIGN.md §6 address coloring.
 * Digits render in Pulse Blue (text-primary), letters in text-foreground, so the eye can
 * scan an address without reading it. Mono, xs, break-all safe.
 *
 * Mounted by: /wallet saved-address rows, /deposit full address block.
 */
import { cn } from "@/lib/utils";

interface ColoredAddressProps {
  address: string;
  className?: string;
}

export const ColoredAddress = ({ address, className }: ColoredAddressProps) => (
  <span className={cn("font-mono text-xs", className)}>
    {address.split("").map((ch, i) =>
      /\d/.test(ch) ? (
        <span key={i} className="text-primary">{ch}</span>
      ) : (
        <span key={i} className="text-foreground">{ch}</span>
      )
    )}
  </span>
);
