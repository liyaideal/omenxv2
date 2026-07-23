import { useState } from 'react';
import { Settings2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrossChainSettingsProps {
  slippage: number;
  onSlippageChange: (v: number) => void;
}

const SLIPPAGE_PRESETS = [
  { value: -1, label: 'Suggested' },
  { value: 0.5, label: '0.5%' },
  { value: 1.0, label: '1%' },
];

export const SettingsPanel = ({
  open,
  onClose,
  slippage,
  onSlippageChange,
}: CrossChainSettingsProps & { open: boolean; onClose: () => void }) => {
  const [customSlippage, setCustomSlippage] = useState('');
  const isSuggested = slippage === -1;

  if (!open) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Bridge Settings</h4>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Slippage */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Slippage</p>
          <span className="text-xs text-muted-foreground">
            {isSuggested ? 'Suggested' : `${slippage}%`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {SLIPPAGE_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { onSlippageChange(p.value); setCustomSlippage(''); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                (p.value === slippage || (p.value === -1 && isSuggested)) && !customSlippage
                  ? "border border-primary text-primary bg-card"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
              )}
            >
              {p.label}
            </button>
          ))}
          <div className="relative flex-1">
            <input
              type="number"
              placeholder="Custom %"
              value={customSlippage}
              onChange={(e) => {
                setCustomSlippage(e.target.value);
                const val = parseFloat(e.target.value);
                if (val > 0 && val <= 50) onSlippageChange(val);
              }}
              className="w-full h-8 px-2 pr-6 rounded-lg bg-muted/40 border border-border/30 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
        </div>
        {isSuggested && (
          <p className="text-xs text-muted-foreground">
            We'll find the best slippage for a successful swap.
          </p>
        )}
        {!isSuggested && slippage > 3 && (
          <p className="text-xs text-yellow-500 flex items-center gap-1">
            ⚠️ High slippage may result in unfavorable rates
          </p>
        )}
      </div>
    </div>
  );
};

export const SettingsButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors">
    <Settings2 className="w-4 h-4" />
  </button>
);
