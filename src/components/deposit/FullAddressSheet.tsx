import { useState } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { toast } from 'sonner';
import { getTokenConfig, SupportedToken } from '@/types/deposit';
import { SharePosterSheet } from './SharePosterSheet';

interface FullAddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  tokenSymbol: string;
}

// Format address with character-type based coloring
// Digits (0-9): purple/blue
// Letters (a-f): white/foreground
const formatAddressWithColors = (address: string) => {
  const hasPrefix = address.startsWith('0x');
  const cleanAddress = hasPrefix ? address.slice(2) : address;
  
  // Split into chunks of 4 characters for spacing
  const chunks: { char: string; isDigit: boolean }[][] = [];
  let currentChunk: { char: string; isDigit: boolean }[] = [];
  
  for (let i = 0; i < cleanAddress.length; i++) {
    const char = cleanAddress[i];
    const isDigit = /[0-9]/.test(char);
    currentChunk.push({ char, isDigit });
    
    if (currentChunk.length === 4 || i === cleanAddress.length - 1) {
      chunks.push(currentChunk);
      currentChunk = [];
    }
  }
  
  return { hasPrefix, chunks };
};

export const FullAddressSheet = ({
  open,
  onOpenChange,
  address,
  tokenSymbol,
}: FullAddressSheetProps) => {
  const { hasPrefix, chunks } = formatAddressWithColors(address);
  const [showSharePoster, setShowSharePoster] = useState(false);
  const token = getTokenConfig(tokenSymbol as SupportedToken);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
    onOpenChange(false);
  };

  const handleShare = () => {
    setShowSharePoster(true);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle>{tokenSymbol} deposit address</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-6 pb-6 space-y-6">
            {/* Formatted Address Display */}
            <div className="p-6 bg-card/50 border border-border/50 rounded-2xl">
              <div className="font-mono text-xl leading-relaxed text-center flex flex-wrap justify-center gap-x-3 gap-y-2">
                {hasPrefix && (
                  <span className="tracking-wide">
                    <span className="text-primary">0</span>
                    <span className="text-foreground">x</span>
                  </span>
                )}
                {chunks.map((chunk, chunkIndex) => (
                  <span key={chunkIndex} className="tracking-wide">
                    {chunk.map((item, charIndex) => (
                      <span 
                        key={charIndex}
                        className={item.isDigit ? 'text-primary' : 'text-foreground'}
                      >
                        {item.char}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>

            {/* Warning */}
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              <span className="font-semibold text-foreground">Only deposit {tokenSymbol} from the correct network.</span>{' '}
              Deposits of other assets or from other networks will be lost.{' '}
              <button className="text-primary underline underline-offset-2">Learn more</button>
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleShare}
                variant="secondary"
                className="flex-1 h-12 rounded-xl"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={handleCopy}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-hover"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Share Poster Sheet */}
      {token && (
        <SharePosterSheet
          open={showSharePoster}
          onOpenChange={setShowSharePoster}
          address={address}
          token={token}
        />
      )}
    </>
  );
};
