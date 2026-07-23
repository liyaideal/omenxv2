import { useState, useRef } from 'react';
import { Download, Share2, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { TokenConfig } from '@/types/deposit';
import { toast } from 'sonner';
import { SharePosterContent } from './SharePosterContent';

interface SharePosterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  token: TokenConfig;
}

export const SharePosterSheet = ({
  open,
  onOpenChange,
  address,
  token,
}: SharePosterSheetProps) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async (): Promise<string | null> => {
    if (!posterRef.current) return null;
    
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });
      return dataUrl;
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast.error('Failed to generate image');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `${token.symbol}-deposit-address.png`;
    link.href = dataUrl;
    link.click();
    toast.success('Image saved');
  };

  const handleShare = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `${token.symbol}-deposit-address.png`, { type: 'image/png' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `${token.symbol} Deposit Address`,
          text: `Deposit ${token.symbol} to this address on ${token.network}`,
          files: [file],
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleDownload();
        }
      }
    } else {
      handleDownload();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle>Share Deposit Address</DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          {/* Poster Preview - scaled down for mobile */}
          <div className="flex justify-center overflow-hidden">
            <div className="transform scale-[0.75] origin-top -mb-16">
              <SharePosterContent
                ref={posterRef}
                address={address}
                token={token}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleDownload}
              variant="secondary"
              className="flex-1 h-12 rounded-xl"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-hover"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              Share
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
