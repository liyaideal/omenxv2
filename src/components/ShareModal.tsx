import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, Download, Copy, Send, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as htmlToImage from "html-to-image";
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  shareText: string;
  shareUrl: string;
  fileName: string;
  children: ReactNode; // The content to be rendered as the share card
  isDataReady?: boolean; // Optional flag to delay image generation until data is ready
}

export const ShareModal = ({ 
  isOpen, 
  onClose, 
  title = "Share",
  subtitle = "Share this with your friends",
  shareText,
  shareUrl,
  fileName,
  children,
  isDataReady = true,
}: ShareModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate image when modal opens
  const generateImage = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      const blob = await htmlToImage.toBlob(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0a0c14',
        skipFonts: true,
        cacheBust: true,
      });
      if (blob) {
        setImageBlob(blob);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen && isDataReady) {
      // Reset image blob when data changes
      setImageBlob(null);
      const timer = setTimeout(generateImage, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isDataReady]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageBlob) return;
    const url = URL.createObjectURL(imageBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Image saved!", description: "Card saved to your device" });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Link copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleShareX = () => {
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xUrl, '_blank');
  };

  const handleShareTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast({ title: "Sharing not supported", description: "Use the social media buttons instead" });
      return;
    }

    try {
      const shareData: ShareData = {
        title: title,
        text: shareText,
        url: shareUrl,
      };

      if (imageBlob && navigator.canShare && navigator.canShare({ files: [new File([imageBlob], 'share.png', { type: 'image/png' })] })) {
        shareData.files = [new File([imageBlob], `${fileName}.png`, { type: 'image/png' })];
      }

      await navigator.share(shareData);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast({ title: "Share failed", description: "Please try another method" });
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pb-20 md:pb-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl p-5 w-full max-w-[440px] max-h-[calc(100vh-6rem)] md:max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>

        {/* Card Preview - scales down on smaller screens */}
        <div className="relative mb-4 overflow-hidden rounded-2xl">
          <div 
            ref={cardRef}
            className="origin-top-left"
            style={{
              transform: 'scale(var(--poster-scale, 1))',
              // CSS custom property set by container query would be ideal, 
              // but for now we use a fixed scale that works on mobile
            }}
          >
            {children}
          </div>
          {isGenerating && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-2xl">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Share Options */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={handleDownload}
            disabled={!imageBlob || isGenerating}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 border border-border transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium">Save</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 border border-border transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-trading-green" /> : <Copy className="w-4 h-4 text-foreground" />}
            <span className="text-sm font-medium">{copied ? "Copied" : "Copy Link"}</span>
          </button>
          <button
            onClick={handleShareX}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 border border-border transition-colors"
          >
            <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-sm font-medium">X</span>
          </button>
          <button
            onClick={handleShareTelegram}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 border border-border transition-colors"
          >
            <Send className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium">Telegram</span>
          </button>
        </div>

        {/* Native Share Button */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            onClick={handleNativeShare}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="text-sm font-medium">More Options</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};
