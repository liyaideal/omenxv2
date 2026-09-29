/**
 * 「Share Your Rank」弹窗。Figma 673:22677（desktop 384×627）/ 673:25397（mobile 358）。
 *
 * - 桌面：384 居中浮层，底 #14161A、描边 #1C1F26、圆角 16、padding 20
 * - 移动：走 MobileDrawer（DESIGN §5 [LOCKED] Mobile-zero-Dialog —— 移动端只允许
 *   MobileDrawer / Sheet / Popover，不许居中弹窗）
 * - 2026-09-22 CPO 拍板：删掉 Card Style 四主题与 Show Stats 三开关，按稿的海报来
 * - 主 CTA 走 .btn-primary（DESIGN §5「主 CTA 不手搓」），稿的纯 cyan 实心只留给
 *   分段器选中态与分页当前页
 */
import { t } from "@/i18n";
import { useEffect, useRef, useState } from "react";
import { Copy, Download, Send, X } from "lucide-react";
import * as htmlToImage from "html-to-image";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { SITE_URL } from "@/lib/site";
import { useToast } from "@/hooks/use-toast";
import { RankShareCard, periodLabel, sortLabel } from "./RankShareCard";
import type { LeaderboardUser, PeriodType, SortType } from "./leaderboardKit";

/**
 * 分享链接 / 二维码 / 卡底域名统一走 src/lib/site.ts 的 SITE_URL（VITE_SITE_URL → 当前访问域）。
 * 2026-09-29 CPO 打回：本件原先硬编码 `https://omenx.lovable.app`——那不是任何一个活着的域，
 * 二维码扫出去是死链；09-07 全站域名收敛（54a2e3df）时把 Leaderboard 漏了。
 */
const SHARE_ORIGIN = SITE_URL;

const XLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SECONDARY: React.CSSProperties = {
  height: 46,
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: "1px solid #1C1F26",
  borderRadius: 12,
  background: "#1C1F26",
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: 500,
};

export const ShareRankModal = ({
  isOpen,
  onClose,
  user,
  sortType,
  period,
  referralCode,
  isMobile,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: LeaderboardUser;
  sortType: SortType;
  period: PeriodType;
  referralCode: string;
  isMobile: boolean;
}) => {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);

  const shareUrl = `${SHARE_ORIGIN}?ref=${referralCode}`;
  // 卡上印的是品牌域（与 SharePosterLayout qrLabel / LitePnlPoster 一致），二维码才编码 SITE_URL 活链。
  // 2026-09-29 CPO 打回：印 window.origin 会在预览站印出 id-preview--xxxx 长串并把二维码框撑宽。
  const shareHost = "omenx.com";
  const shareText = `🏆 #${user.rank} in ${sortLabel(sortType)} (${periodLabel(period)}) on the OMENX leaderboard — $${Math.round(
    user.pnl
  ).toLocaleString("en-US")} PnL, ${user.roi.toFixed(1)}% ROI.`;

  /** 打开时生成一次出图；skipFonts 必须为 true（见 RankShareCard 顶部第 3 条） */
  useEffect(() => {
    if (!isOpen) {
      setImageBlob(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      if (!cardRef.current) return;
      try {
        const blob = await htmlToImage.toBlob(cardRef.current, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: "#05080F",
          skipFonts: true,
          cacheBust: true,
        });
        if (blob) setImageBlob(blob);
      } catch {
        /* 出图失败时按钮降级为禁用，不打断弹窗 */
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [isOpen, user.rank, user.pnl, user.roi, user.volume]);

  const handleSave = () => {
    if (!imageBlob) return;
    const url = URL.createObjectURL(imageBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omenx-rank-${user.rank}-${user.username}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Image saved", description: "Ranking card saved to your device" });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied", description: "Referral link copied to clipboard" });
  };

  const handleX = () =>
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );

  const handleTelegram = () =>
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      "_blank"
    );

  const handleMore = async () => {
    if (!navigator.share) {
      toast({ title: "Sharing not supported", description: "Use the buttons above instead" });
      return;
    }
    try {
      const data: ShareData = { title: "OMENX Leaderboard", text: shareText, url: shareUrl };
      if (
        imageBlob &&
        navigator.canShare?.({ files: [new File([imageBlob], "rank.png", { type: "image/png" })] })
      ) {
        data.files = [new File([imageBlob], `omenx-rank-${user.rank}.png`, { type: "image/png" })];
      }
      await navigator.share(data);
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast({ title: "Share failed", description: "Please try another method" });
    }
  };

  const body = (
    <>
      <RankShareCard
        user={user}
        sortType={sortType}
        period={period}
        referralCode={referralCode}
        shareHost={shareHost}
        shareUrl={shareUrl}
        cardRef={cardRef}
      />

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <button type="button" onClick={handleSave} disabled={!imageBlob} style={{ ...SECONDARY, opacity: imageBlob ? 1 : 0.5 }}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {t("common.save")}
        </button>
        <button type="button" onClick={handleCopyLink} style={SECONDARY}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          {t("common.copy_link")}
        </button>
        <button type="button" onClick={handleX} style={SECONDARY}>
          <XLogo className="h-4 w-4" />X
        </button>
        <button type="button" onClick={handleTelegram} style={SECONDARY}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {t("common.screen.shared.ShareModal.telegram")}
        </button>
      </div>

      <button
        type="button"
        onClick={handleMore}
        className="btn-primary"
        style={{
          marginTop: 12,
          width: "100%",
          height: 44,
          borderRadius: 12,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {t("common.more_options")}
      </button>
    </>
  );

  if (isMobile) {
    return (
      <MobileDrawer
        open={isOpen}
        onOpenChange={(o) => !o && onClose()}
        title={t("leaderboard.share_your_rank")}
        description={t("leaderboard.share_modal_subtitle")}
      >
        {body}
      </MobileDrawer>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("leaderboard.share_your_rank")}
        className="animate-scale-in relative max-h-[90vh] overflow-y-auto"
        style={{
          width: 384,
          maxWidth: "100%",
          boxSizing: "border-box",
          background: "#14161A",
          border: "1px solid #1C1F26",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute"
          style={{
            right: 16,
            top: 16,
            width: 28,
            height: 28,
            padding: 4,
            border: 0,
            borderRadius: 9999,
            background: "transparent",
            color: "#9CA2AB",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X className="h-5 w-5" />
        </button>

        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: "28px", color: "#FFFFFF" }}>
          {t("leaderboard.share_your_rank")}
        </h3>
        <p style={{ margin: "4px 0 16px", fontSize: 14, lineHeight: "20px", color: "#9CA2AB" }}>
          {t("leaderboard.share_modal_subtitle")}
        </p>

        {body}
      </div>
    </div>
  );
};
