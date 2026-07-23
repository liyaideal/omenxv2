import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  SupportedToken, 
  TokenConfig, 
  AssetCategory, 
  SUPPORTED_TOKENS,
  filterTokensByCategory 
} from '@/types/deposit';
import { cn } from '@/lib/utils';

interface AssetSelectProps {
  onSelectToken: (token: SupportedToken) => void;
  showBalance?: boolean;
  balanceLabel?: string;
}

const CATEGORIES: { id: AssetCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'stablecoins', label: 'Stablecoins' },
  { id: 'crypto', label: 'Crypto' },
];

export const AssetSelect = ({ onSelectToken, showBalance = true, balanceLabel = 'Available Balance' }: AssetSelectProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('all');

  const filteredTokens = useMemo(() => {
    let tokens = filterTokensByCategory(activeCategory);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tokens = tokens.filter(
        token => 
          token.symbol.toLowerCase().includes(query) ||
          token.name.toLowerCase().includes(query)
      );
    }
    
    return tokens;
  }, [activeCategory, searchQuery]);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-muted/50 border-border/50 h-11 rounded-xl"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeCategory === category.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Assets Header */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Assets
        </span>
        {showBalance && (
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {balanceLabel}
          </span>
        )}
      </div>

      {/* Token List */}
      <div className="space-y-1">
        {filteredTokens.map((token) => (
          <TokenListItem 
            key={token.symbol} 
            token={token} 
            onClick={() => onSelectToken(token.symbol)} 
          />
        ))}

        {filteredTokens.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No assets found</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface TokenListItemProps {
  token: TokenConfig;
  onClick: () => void;
}

const TokenListItem = ({ token, onClick }: TokenListItemProps) => {
  const formattedBalance = token.balance?.toFixed(token.decimals > 8 ? 4 : 2) ?? '0.00';
  const formattedBalanceUsd = token.balanceUsd?.toFixed(2) ?? '0.00';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        {/* Token Icon */}
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
          {token.icon}
        </div>
        
        {/* Token Info */}
        <div className="text-left">
          <div className="font-medium group-hover:text-primary transition-colors">
            {token.symbol}
          </div>
          <div className="text-xs text-muted-foreground">
            {token.name}
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="text-right">
        <div className="font-mono font-medium">
          {formattedBalance} <span className="text-muted-foreground">{token.symbol}</span>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {formattedBalanceUsd} USD
        </div>
      </div>
    </button>
  );
};
