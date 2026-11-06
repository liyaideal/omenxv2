// ============================================================
// Quick Play combo poster — the ⇪ SHARE key in the combo HUD (CPO 2026-11-02).
// The designer's three cards (claude.ai/artifact/3yr24DXSdwJkqW5BBKz4PD, layout
// from Figma "Combo share · PC"), one per combo tier (CPO 2026-11-06 批):
//   ×3–4  Power-up block — the lynx hops into a $ block, ×N floats above it
//   ×5–7  Trophy         — the lynx lifts the cup, ×N slams in beside it
//   ×8+   Treasure chest — the lid blows off, coins shower, ×N rises
// Player bar (avatar · name · "N of N right" with a Lucide zap · QUICK PLAY),
// the scene, PROFIT in Jersey 10, the plain-words line + "N minutes · N calls ·
// $5 each", Best run / Biggest win, referral + wordmark + "Pick UP or DOWN ·
// from $2" + QR. Markup and keyframes are the designer's, scoped in
// arcadeComboPoster.css; fonts self-hosted (Jersey 10 / Chakra Petch / Archivo /
// Russo One) and embedded into the PNG (arcadePosterFontCSS).
// mode="play": intro once, idle loops after (the share sheet's preview).
// mode="still": the intro's last frame, frozen — the node html-to-image saves
// (CPO 2026-11-06: static poster ships now, no GIF).
// ============================================================
import { forwardRef, useMemo } from "react";
import { Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { omenxLogoSolid as omenxLogo } from "@/components/Logo";
import bgTrophy from "@/assets/arcade/combo/bg-trophy.png";
import bgBlock from "@/assets/arcade/combo/bg-block.png";
import bgChest from "@/assets/arcade/combo/bg-chest.png";
import lynxTrophy from "@/assets/arcade/combo/lynx-trophy.png";
import lynxJump from "@/assets/arcade/combo/lynx-jump.png";
import blockPng from "@/assets/arcade/combo/block.png";
import torchPng from "@/assets/arcade/combo/torch.png";
import chestGlow from "@/assets/arcade/combo/chest-glow.png";
import chestShut from "@/assets/arcade/combo/chest-shut.png";
import chestOpen from "@/assets/arcade/combo/chest-open.png";
import { SITE_URL } from "@/lib/site";
import { arcadeBestRunLabel } from "@/lib/arcade/session";
import type { ArcadeComboShare } from "@/pages/arcade/arcadeEngine";
import "./arcadeComboPoster.css";

export type ArcadeComboTier = "t1" | "t2" | "t3";

/** which of the three cards a combo gets (CPO 2026-11-06): ×3–4 block · ×5–7 trophy · ×8+ chest */
export const arcadeComboTier = (n: number): ArcadeComboTier => (n >= 8 ? "t3" : n >= 5 ? "t1" : "t2");

/** for the style guide and the delivery doc */
export const ARCADE_COMBO_TIERS: { tier: ArcadeComboTier; range: string; name: string }[] = [
  { tier: "t2", range: "×3–4", name: "Power-up block" },
  { tier: "t1", range: "×5–7", name: "Trophy" },
  { tier: "t3", range: "×8+", name: "Treasure chest" },
];

export interface ArcadeComboPosterProps {
  combo: ArcadeComboShare;
  username?: string;
  avatarUrl?: string;
  referralCode?: string;
  /** "play" = intro + idle loops (preview); "still" = the frozen last frame (export). Default "still". */
  mode?: "play" | "still";
}

// Decode the art before the first export so html-to-image never grabs a blank.
if (typeof window !== "undefined") {
  [bgTrophy, bgBlock, bgChest, lynxTrophy, lynxJump, blockPng, torchPng, chestGlow, chestShut, chestOpen].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

// thousands separated like everywhere else on the site: +$1,234.56
const money = (n: number) => `${n < 0 ? "−" : "+"}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** the designer's number sizing: ×N keeps its box as digits are added (F = [1, 1, .74, .56, .46] by string length) */
const F = [1, 1, 0.74, 0.56, 0.46];
const numScale = (n: number) => F[Math.min(4, String(n).length + 1)] / F[2];

/** [dx, h, land, t, d, s, front?] — the designer's coin tables, verbatim */
type Coin = [number, number, number, number, number, number, 1?];
const T2_COINS: Coin[] = [[-34,62,10,0.38,0.75,14],[28,74,6,0.41,0.8,15],[-12,92,18,0.44,0.85,16],[46,56,22,0.47,0.72,13],[-52,48,26,0.5,0.7,13],[8,84,4,0.53,0.82,15]];
const T3_COINS: Coin[] = [[51,154,121,0.765,1.1,14,1],[-215,199,101,0.776,1.04,15],[-57,171,115,0.774,1.16,18,1],[121,164,97,0.803,1.19,18],[-188,205,107,0.785,1.29,16,1],[199,230,120,0.747,1.14,18,1],[181,264,94,0.755,1.02,14],[-179,179,89,0.748,0.97,14],[240,234,90,0.77,1.07,14],[170,205,100,0.752,1.2,12],[90,234,118,0.751,1.25,12,1],[72,265,86,0.744,1.12,12],[-237,207,84,0.818,1.27,12],[221,173,106,0.741,1.27,15],[-39,169,100,0.777,1.03,15],[85,173,90,0.785,1.21,18],[-94,175,110,0.753,0.95,20,1],[198,256,94,0.812,1.23,15],[-207,211,118,0.764,1.11,20,1],[-102,177,85,0.79,1.08,16],[93,192,89,0.767,1.23,12],[-173,270,112,0.819,1.06,14,1],[36,186,109,0.756,1.22,13,1],[220,258,89,0.774,1.06,16],[-164,226,100,0.812,0.98,12],[126,154,113,0.788,1.07,14,1],[119,227,101,0.817,1.09,15],[-137,272,119,0.811,1.17,18,1],[-128,205,100,0.819,1.01,14],[-188,268,91,0.762,1.26,12],[-80,94,99,0.89,1.05,14],[-118,90,101,0.886,1.05,15],[-60,145,109,0.92,0.98,10,1],[-24,95,95,0.953,0.9,16],[-89,140,102,0.955,1.12,10],[-97,83,92,0.964,0.91,12],[-123,120,98,0.989,1.15,14],[150,163,98,1.016,1.17,13],[47,125,108,1.043,0.96,10,1],[115,124,97,1.052,1.04,12],[118,134,87,1.042,1.11,14],[-164,133,107,1.068,0.96,16,1],[128,102,109,1.109,1.05,10,1],[169,103,112,1.133,1.08,14,1],[-130,80,109,1.137,0.94,16,1],[-121,129,106,1.169,1.11,16,1],[57,98,88,1.178,1.13,14],[-31,134,114,1.193,1.19,13,1],[-18,146,97,1.205,0.92,13],[82,170,102,1.219,1.17,15],[100,82,98,1.252,1.05,15],[-30,168,92,1.265,0.89,13]];

const coinStyle = (left: number, top: number, [dx, h, land, t, d, s]: Coin) =>
  ({ left: `${left}px`, top: `${top}px`, "--dx": `${dx}px`, "--h": `${h}px`, "--land": `${land}px`, "--t": `${t}s`, "--d": `${d}s`, "--s": `${s}px` }) as React.CSSProperties;

const Coins = ({ left, top, list, vanish }: { left: number; top: number; list: Coin[]; vanish?: boolean }) => (
  <>
    {list.map((c, i) => (
      <i key={i} className={`cf${vanish ? " vanish" : ""}${c[6] ? " front" : ""}`} style={coinStyle(left, top, c)}>
        <b>
          <u />
        </b>
      </i>
    ))}
  </>
);

const Halo = () => (
  <div className="halo">
    <i className="r" />
    <i className="r r2" />
    <i className="g" />
  </div>
);

const Num = ({ n, fs, gold }: { n: number; fs: number; gold?: boolean }) => {
  const s = fs * numScale(n);
  return (
    <div className="nw">
      <span className={gold ? "gold" : undefined} style={{ fontSize: `${s}px`, lineHeight: `${s * 0.8}px` }}>
        ×{n}
      </span>
    </div>
  );
};

const Scene = ({ tier, n }: { tier: ArcadeComboTier; n: number }) => {
  if (tier === "t1")
    return (
      <>
        <img className="bg px" src={bgTrophy} alt="" />
        <Halo />
        <img className="lynx" src={lynxTrophy} alt="" />
        <Num n={n} fs={142.84} gold />
        <div className="cmbx">COMBO</div>
        <i className="star4" />
      </>
    );
  if (tier === "t2")
    return (
      <>
        <img className="bg px" src={bgBlock} alt="" />
        <Halo />
        <div className="cmbx">COMBO</div>
        <Num n={n} fs={89} />
        <Coins left={200} top={150} list={T2_COINS} vanish />
        <i className="cl">
          <u />
          <i />
        </i>
        <div className="bk">
          <img className="px" src={blockPng} alt="" />
          <div className="dol">$</div>
        </div>
        <img className="lynx" src={lynxJump} alt="" />
      </>
    );
  return (
    <>
      <img className="bg px" src={bgChest} alt="" />
      <img className="torch" src={torchPng} alt="" />
      <Halo />
      <img className="cglow" src={chestGlow} alt="" />
      <div className="cmbg">
        <i className="l" />
        <b>COMBO</b>
        <i className="r" />
      </div>
      <div className="chest">
        <img className="open" src={chestOpen} alt="" />
        <img className="body" src={chestShut} alt="" />
        <img className="lid" src={chestShut} alt="" />
      </div>
      <i className="flash" />
      <i className="ring" />
      <i className="ring b" />
      <Coins left={197} top={218} list={T3_COINS} />
      <Num n={n} fs={103.09} gold />
    </>
  );
};

export const ArcadeComboPoster = forwardRef<HTMLDivElement, ArcadeComboPosterProps>(({ combo, username = "Trader", avatarUrl, referralCode = "OMENX2025", mode = "still" }, ref) => {
  const tier = arcadeComboTier(combo.n);
  const amount = money(combo.pnl);
  const meta = useMemo(() => `${combo.minutes} minute${combo.minutes === 1 ? "" : "s"} · ${combo.n} call${combo.n === 1 ? "" : "s"} · ${combo.stakeLine}`, [combo]);
  return (
    <div ref={ref} className={`cposter ${tier} ${mode}`}>
      <div className="bar">
        <div className="who">
          <div className="ava">{avatarUrl ? <img src={avatarUrl} alt={username} /> : <span>{username.slice(0, 2).toUpperCase()}</span>}</div>
          <div style={{ minWidth: 0 }}>
            <div className="u">{username}</div>
            <span className="badge">
              {/* Lucide zap, square caps like the cabinet (item 17: no emoji on product surfaces) */}
              <Zap size={12} strokeWidth={2.4} strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" />
              {combo.n} of {combo.n} right
            </span>
          </div>
        </div>
        <span className="qp">QUICK PLAY</span>
      </div>
      <div className="scene">
        <Scene tier={tier} n={combo.n} />
        <div className="fade" />
      </div>
      <div className="info">
        <div className="lb">PROFIT</div>
        <div className={`amt${amount.length > 9 ? " long" : ""}`}>{amount}</div>
        <div className="txt">
          Called <b>Bitcoin</b> up or down,
          <br />
          <b>30 seconds</b> at a time<small>{meta}</small>
        </div>
      </div>
      <div className="stats">
        <div>
          <span>Best run</span>
          <b>{arcadeBestRunLabel(combo.n)}</b>
        </div>
        <div>
          <span>Biggest win</span>
          <b>{combo.biggestWin > 0 ? money(combo.biggestWin) : "—"}</b>
        </div>
      </div>
      <div className="foot">
        <div className="l">
          <div className="ref">
            Referral:<b>{referralCode}</b>
          </div>
          <img className="logo" src={omenxLogo} alt="OmenX" />
          <div className="pick">Pick UP or DOWN · from $2</div>
        </div>
        <div className="qrw">
          <div className="qr">
            <QRCodeSVG value={`${SITE_URL}/arcade?ref=${referralCode}`} size={54} level="M" includeMargin={false} />
          </div>
          <span>omenx.com</span>
        </div>
      </div>
    </div>
  );
});
ArcadeComboPoster.displayName = "ArcadeComboPoster";

export default ArcadeComboPoster;
