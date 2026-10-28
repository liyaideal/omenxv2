// ============================================================
// Quick Play v2 markup — the "stream stage" cabinet (mock
// claude.ai/artifact/6AmwMxsb3aNDUgVDZ8epWJ v26, CPO 2026-10-28) on the
// designer's steel shell (artifact BKHuHJvFkzeLXQxLWBHxSF). The engine
// (arcadeEngine.ts) binds to these ids; keep ids/classes stable.
//   • one table: BTC · 30-second calls — every chip is its own contract
//   • header bar: title · YOUR OPEN · AVAILABLE · Deposit / Transfer / Rules
//   • road strip (the table's 30 s cells) · stage + OPEN CALLS rail
//   • UP / chips / DOWN keys · OPEN / LIVE / SESSION / LAST 10 boards
//   • dash: the lynx (mood, road signs, runner game while paused)
// The logo plate is the only exit (CPO 2026-10-19: no ✕).
// ============================================================

const LOGO_SVG = (fill: string, clip: string) =>
  `<svg width="150" height="23" role="img" aria-label="OmenX" viewBox="0 0 116 18" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#${clip})"><path d="M53.7907 0.000274658H49.2198V17.2655H53.7907V0.000274658Z" fill="${fill}"/><path d="M69.899 0.0126953H50.6039V3.89457H69.899V0.0126953Z" fill="${fill}"/><path d="M69.899 13.371H50.6039V17.2529H69.899V13.371Z" fill="${fill}"/><path d="M66.5891 6.68271V10.5808H58.0206C57.196 10.5808 56.395 10.3011 55.748 9.78929L53.7908 8.23719V6.68271H66.5891Z" fill="${fill}"/><path d="M17.1988 0.014679H6.11366C2.73693 0.014679 0 2.75161 0 6.12833V11.1662C0 14.5429 2.73693 17.2799 6.11366 17.2799H17.1988C20.5756 17.2799 23.3125 14.5429 23.3125 11.1662V6.12833C23.3149 2.75161 20.5756 0.014679 17.1988 0.014679ZM18.7415 10.6164C18.7415 12.0287 17.5969 13.1733 16.1846 13.1733H7.20606C5.79376 13.1733 4.64922 12.0287 4.64922 10.6164V6.69944C4.64922 5.28713 5.79376 4.14259 7.20606 4.14259H16.1846C17.5969 4.14259 18.7415 5.28713 18.7415 6.69944V10.6164Z" fill="${fill}"/><path d="M29.1703 0.0146484H24.5992V17.2798H29.1703V0.0146484Z" fill="${fill}"/><path d="M47.912 0.0146484H43.3408V17.2798H47.912V0.0146484Z" fill="${fill}"/><path d="M43.3409 0.0146484V6.14252L36.2555 13.1519L29.1704 6.14252V0.0146484H29.1728L36.2555 7.02166L43.3409 0.0146484Z" fill="${fill}"/><path d="M75.8153 0.0146484H71.2444V17.2798H75.8153V0.0146484Z" fill="${fill}"/><path d="M91.9665 0.0146484H87.3956V17.2798H91.9665V0.0146484Z" fill="${fill}"/><path d="M87.3956 11.1235V17.2798L75.8152 6.16859V0.0146484L87.3956 11.1235Z" fill="${fill}"/><path d="M92.8182 17.2601L98.3374 9.70414C99.0348 8.70633 100.264 8.09959 101.584 8.09959H104.116C104.483 8.09959 104.826 7.93133 105.021 7.65164L110.593 0.0198975H116L110.714 7.5758C110.017 8.57361 108.787 9.18035 107.467 9.18035H104.702C104.335 9.18035 103.992 9.34864 103.797 9.6283L98.4612 17.2577H92.7086L92.8182 17.2601Z" fill="${fill}"/><path d="M104.811 12.2382H110.449L116 17.2618H111.543C110.787 17.2618 110.061 16.9903 109.524 16.5063L104.811 12.2382Z" fill="${fill}"/><path d="M103.897 5.04352H98.2592L92.7084 0.0198975L97.1651 0.0198978C97.9217 0.0198979 98.6469 0.291382 99.184 0.77533L103.897 5.04352Z" fill="${fill}"/></g><defs><clipPath id="${clip}"><rect width="116" height="17.4139" fill="${fill}"/></clipPath></defs></svg>`;

const MUTE_BTN = `<button class="key fsbtn mutebtn" id="muteBtn" aria-pressed="false" aria-label="Mute sound" title="Sound on / off"><svg class="on" width="20" height="18" viewBox="0 0 20 18" fill="#020c10"><path d="M1 6h4l5-4v14l-5-4H1z"/><path d="M13 5h2v8h-2zM16 2h2v14h-2z"/></svg><svg class="off" width="20" height="18" viewBox="0 0 20 18" fill="#fff"><path d="M1 6h4l5-4v14l-5-4H1z"/><path d="M12 5h2v2h-2zM16 5h2v2h-2zM14 7h2v2h-2zM12 9h2v2h-2zM16 9h2v2h-2z"/></svg></button>`;
const FS_BTN = `<button class="key fsbtn" id="fsBtn" aria-label="Toggle full screen"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#020c10" stroke-width="2.5" stroke-linecap="square"><path d="M1 6V1h5M12 1h5v5M17 12v5h-5M6 17H1v-5"/></svg></button>`;

const HOWTO = `<div class="howto" id="howto" hidden><b>How to read the road</b><span><i class="k">Dragon</i> — one colour stacking down a column: BTC has been going the same way for several 30-second slots. Trend-followers are getting paid.</span><span><i class="k">Chop</i> — colours alternating every cell: the market is flip-flopping. Chasing gets punished; size down or wait.</span><span><i class="k">Break</i> — a long column just switched colour: the direction just changed. Loudest moment, easiest to get shaken out.</span><span class="n">The road is context, not a forecast. Each cell is the same 30-second horizon as your call, so it tells you the market's mood at the horizon you are betting on — nothing more.</span></div>`;
/** the road strip in the mobile sheet */
const ROAD_STRIP = `<div class="howto" id="howto" hidden><b>How to read the road</b><span><i class="k">Dragon</i> — one colour stacking down a column: BTC has been going the same way for several 30-second slots. Trend-followers are getting paid.</span><span><i class="k">Chop</i> — colours alternating every cell: the market is flip-flopping. Chasing gets punished; size down or wait.</span><span><i class="k">Break</i> — a long column just switched colour: the direction just changed. Loudest moment, easiest to get shaken out.</span><span class="n">The road is context, not a forecast. Each cell is the same 30-second horizon as your call, so it tells you the market's mood at the horizon you are betting on — nothing more.</span></div><div class="rh"><span class="lbl">Market<span class="x"> · every cell = 30 seconds of BTC</span> <i class="info" id="roadI" tabindex="0" role="button" aria-label="How to read the road">i</i></span><span class="lbl" id="slotLbl">THIS SLOT · —</span></div><div class="roads"><div class="beadscr"><span class="lbl">BEAD · <span id="beadN">0</span></span><div class="beads" id="bead"></div></div><div class="roadscr"><span class="lbl">Big road<span class="x"> · same result stacks down, a change starts a new column</span></span><div class="road" id="road"></div></div><div class="rstats"><span>Up <b class="cu" id="nUp">0</b> · Down <b class="cd" id="nDn">0</b> <small>last <span id="nSlots">0</span> slots</small></span><span>Longest <b id="longest">—</b></span></div></div>`;

const COMBO = (id: string) => `<div class="combo" id="${id}"><div class="big"></div><div class="meta"><div class="pips"></div><div class="sub"></div></div></div>`;
const MEGA = (id: string) => `<div class="mega" id="${id}"><div><div class="t"></div><div class="s"></div></div></div>`;

const DIR = (side: "u" | "d", prefix: string) =>
  `<button class="dir ${side}" id="${prefix}${side === "u" ? "U" : "D"}" data-side="${side}"><span class="side">${side === "u" ? "UP" : "DOWN"}</span><span class="mid"><span class="stack"></span><span class="ringwrap"></span></span><span class="cents" id="${prefix}c${side === "u" ? "U" : "D"}">—</span><span class="pays" id="${prefix}p${side === "u" ? "U" : "D"}"></span></button>`;

export const ARCADE_OVERLAYS = `<canvas id="fx" aria-hidden="true"></canvas>
<div class="tip" id="tip" role="tooltip" hidden></div>
<div class="v2toast" id="toast" role="status" aria-live="polite" hidden></div>
<div class="flash" id="flash" aria-hidden="true"></div>
<div class="gate" id="gate" role="dialog" aria-modal="true" aria-labelledby="gateT" hidden><div class="gbox steel rivets">
  <div class="gh scr"><span class="tag" id="gateT">BEFORE YOU PLAY</span><span class="sub">BTC · 30-second calls</span></div>
  <ul class="gl scr">
    <li><i>⏱</i><span><b>Each chip = one 30-second call.</b> Up or Down vs the price when you tap.</span></li>
    <li><i>🔒</i><span><b>2 seconds to cancel.</b> Then it's locked — no cash-out.</span></li>
    <li><i>%</i><span><b>3% in · 5% of profit out.</b> Ties refund in full.</span></li>
    <li><i>⚠</i><span><b>High risk.</b> $5–100 a call · $500 open max.</span></li>
  </ul>
  <button class="gbtn" id="gateGo">I GET IT · START PLAYING</button>
  <a href="#" class="gmore" id="gateRules">How the price and odds are made →</a>
</div></div>
<div class="rmodal" id="rules" role="dialog" aria-modal="true" aria-labelledby="rulesT" hidden><div class="rbox steel rivets">
  <div class="gh scr"><span class="tag" id="rulesT">HOW IT WORKS</span><button class="key mx rx" id="rulesX" aria-label="Close">✕</button></div>
  <div class="rcols">
    <section class="scr"><h4>1 · The price</h4><p>The <b>index</b> is the median of three exchanges' mid prices (best bid + best ask ÷ 2) in USDT terms: <b>Binance</b> BTC/USDT, <b>Hyperliquid</b> BTC/USDC and <b>Coinbase</b> BTC-USD (both converted at the live USDT-USD rate). A snapshot counts only when at least two sources are fresh, no book is crossed and every spread is ≤ 2 bps; with just two sources they must agree within 5 bps. If that fails the index is <b>invalid</b> for that second and we stop taking new calls (open ones still settle). The three live prices are shown under the chart at all times. Between index points the chart line follows Binance's live order book (shifted onto the index), so it moves many times a second — but every open, close and settlement uses the index only.</p></section>
    <section class="scr"><h4>2 · Open and close</h4><p><b>Open (S0)</b> = the first valid index <em>after</em> the server accepts your chip — never a price from before you tapped, so nobody can front-run a move they already saw. <b>Close (S1)</b> = the last valid index at or before the 30-second mark (we wait up to 2 s for late data, and never use a price from after the mark). S1 &gt; S0 → Up wins. S1 &lt; S0 → Down wins. Equal, or no valid S0 / S1 → the call is void and you get everything back, fees included.</p></section>
    <section class="scr"><h4>3 · The odds</h4><p>The cents on UP / DOWN are a probability from our pricing model, built from the last 10 minutes of index moves. It is clipped to <b>40–60¢</b> and UP + DOWN always add to $1.00. A quote lives for about a second; your chip is filled at the exact quote you saw, and the payout is locked then. If the price moved too much in between, the chip is refused and you simply tap again — we never fill at a price you didn't see.</p></section>
    <section class="scr"><h4>4 · Payout &amp; fees</h4><p><b>Fee:</b> 3% of the chip, taken on entry. <b>Payout if you win:</b> (chip − fee) ÷ odds, rounded down to the cent, minus <b>5%</b> of the profit. Example: $100 on Up at 53.0¢ → fee $3 → working $97 → payout $183.01 → profit $83.01 − 5% = <b>$78.86</b>. <b>Cancel within 2 s:</b> chip returned minus 0.15%. <b>Lose:</b> the chip is gone.</p></section>
    <section class="scr"><h4>5 · Limits &amp; pauses</h4><p>$5–100 per call · $500 open per account · 2 calls per second. The table pauses new calls (open ones still settle) when the index is invalid, when BTC moves more than 10 bps in one second, when our daily loss limit is hit, or when the table's risk room is full. You always see why on the chart.</p></section>
    <section class="scr"><h4>6 · Your record</h4><p>Every call stores its accept time, open, close, quote, fee and payout. The SETTLED list under your open calls shows open → close for each one. Disputes: support@omenx.com with the time of the call.</p></section>
  </div>
</div></div>
`;

export const ARCADE_DESKTOP = `<main>
  <div class="wrap">
  <div class="cockpit">
    <div class="cab v2" id="cab">
      <div class="hull steel rivets" aria-hidden="true"></div>
      <span class="ear l" style="--t:120px" aria-hidden="true"><span class="steel" style="position:absolute;inset:0"></span></span>
      <span class="ear r" style="--t:120px" aria-hidden="true"><span class="steel" style="position:absolute;inset:0"></span></span>
      <span class="ear l" style="--t:calc(100% - 170px)" aria-hidden="true"><span class="steel" style="position:absolute;inset:0"></span><i></i></span>
      <span class="ear r" style="--t:calc(100% - 170px)" aria-hidden="true"><span class="steel" style="position:absolute;inset:0"></span><i></i></span>

      <!-- row 1 · header bar -->
      <div class="r1">
        <div class="logoplate steel rivets" id="logoPlate" role="link" tabindex="0" aria-label="OmenX · back to Events"><span class="pipe" aria-hidden="true"></span>${LOGO_SVG("#07090f", "clipL")}</div>
        <div class="scr hbar">
          <div class="hl"><h1>BTC · 30-second calls</h1><span class="meta">Price from 3 exchanges · settles in 30s</span></div>
          <div class="hr">
            <div class="stat"><span class="lbl">Your open</span><b id="dYourOpen">$0 / $500</b></div>
            <div class="stat"><span class="lbl">Available · spot</span><b class="lime" id="equity">$0.00</b></div>
            <div class="keys"><button class="key hk dep" id="depBtn" title="Buy USDC with card or deposit on Base">+ Deposit</button><button class="key hk" id="xferBtn" title="Move funds between futures and spot">⇄ Transfer</button><button class="key hk rk" id="rulesBtn" title="How it works">Rules</button></div>
          </div>
        </div>
        <div class="ctrlplate steel rivets">${MUTE_BTN}${FS_BTN}</div>
      </div>

      <!-- row 2 · the table's road (01 / REPLAY) -->
      <div class="r2r steel rivets rr">
        <div class="scr tagscr"><span class="tag">01 / REPLAY</span><span class="sub">WHAT HAPPENED</span></div>
        <div class="scr beadscr"><span class="lbl">BEAD · <span id="beadN">0</span></span><div class="beads" id="bead"></div></div>
        <div class="scr roadscr"><span class="lbl">Big road <i class="info" id="roadI" tabindex="0" role="button" aria-label="How to read the road">i</i></span><div class="road" id="road"></div></div>
        <div class="scr rstats"><span>Up <b class="cu" id="nUp">0</b> · Down <b class="cd" id="nDn">0</b> <small>last <span id="nSlots">0</span> slots</small></span><span>Longest <b id="longest">—</b></span><span class="lbl" id="slotLbl">THIS SLOT · —</span></div>
        ${HOWTO}
      </div>

      <!-- row 2 · stage + rail -->
      <div class="r2">
        <div class="feedplate steel rivets"><div class="feed scr crt">
          <div class="feed-head"><div class="titles"><span class="tag">02 / LIVE FEED</span><span class="sub">WHAT'S HAPPENING</span></div><div class="pricebox"><div class="price up" id="price">$—</div><div class="chg" id="chg">—</div></div>${COMBO("dCombo")}<div class="lbl" id="dNext">NEXT SETTLE · —</div></div>
          <div class="chg src" id="dSrc"><span class="s"><i>Binance</i><b id="s1">—</b></span><span class="s"><i>Hyperliquid</i><b id="s2">—</b></span><span class="s"><i>Coinbase</i><b id="s3">—</b></span><span class="s st"><b id="dSrcState">—</b></span><span class="s ln"><i>Line</i><b id="dLine">index</b></span></div>
          <div class="plot" id="plot"><canvas id="cv"></canvas><div class="ov" id="dOv"><div><div class="t" id="dOvT">TABLE PAUSED</div><div class="s" id="dOvS"></div><div class="h">Open calls keep running and settle as normal</div></div></div></div>
          <div class="axis"><span>−45s</span><span>now</span><span>+30s · flags = settlement</span></div>${MEGA("dMega")}
        </div></div>
        <div class="railplate steel rivets"><div class="rail scr"><div class="head"><span class="tabs"><button class="tab on" data-tab="mine">MY CALLS <b id="dOpenN">0</b></button><button class="tab" data-tab="table">TABLE <b id="dTableN">0</b></button></span><span class="n" id="dOpenSum">$0</span></div><div class="list" id="dList"></div><div class="list" id="dTable" hidden></div><div class="hint" id="dHint">Tap UP or DOWN — your calls land here</div><div class="donehead lbl">Settled</div><div class="done" id="dDone"></div></div></div>
      </div>

      <!-- row 3 · keys -->
      <div class="r3 dirplate steel rivets">
        <div class="dirhead scr"><span class="tag">03 / SELECT YOUR DIRECTION</span><span class="sub" id="dirSub">EVERY CHIP IS ITS OWN 30-SECOND CALL</span></div>
        <div class="row2">
          ${DIR("u", "btn")}
          <div class="bet scr"><div class="bethead"><span>Your stake · per chip</span><b id="dSel">$5 SELECTED</b></div><div class="chips" id="chips"></div></div>
          ${DIR("d", "btn")}
        </div>
      </div>

      <!-- row 4 · boards -->
      <div class="r4 steel rivets">
        <div class="scr head"><span class="tag">04 / YOUR RESULT</span><span class="sub">SESSION SCOREBOARD</span></div>
        <div class="scr"><span class="lbl">Open</span><span class="s" id="dOpenS">nothing on the table</span><span class="n" id="dOpenBig">—</span></div>
        <div class="scr"><span class="lbl">Live</span><span class="s">if all settle now</span><span class="n" id="dLive">—</span></div>
        <div class="scr"><span class="lbl">Session</span><span class="s" id="dSesS">0 won · 0 lost</span><span class="n" id="dSes">$0.00</span></div>
        <div class="scr"><span class="lbl">Last 10</span><span class="s" id="dStreak"></span><span class="n"><span class="ticks" id="dTicks"></span></span></div>
      </div>
    </div>

    <div class="dash">
      <div class="console l" aria-hidden="true"><span class="lamp"></span><span class="piston"></span></div>
      <div class="window" id="dWin"><canvas id="space"></canvas><div class="lynx idle" id="lynx" role="img" aria-label="Lynx pilot"><span class="emote" id="emote"></span><span class="sign" id="sign" hidden></span><div class="body"><img id="lynxImg" alt="" src="/arcade/lynx0.png"></div></div><div class="ghud" id="ghud" hidden><span class="t" id="ghudT">TABLE PAUSED · TAP TO JUMP</span><span class="sc" id="ghudS">0</span></div></div>
      <div class="console r" aria-hidden="true"><span class="lamp"></span><span class="piston"></span></div>
    </div>
  </div>
  </div>
</main>`;

export const ARCADE_MOBILE = `<main class="m-app v2m">
  <div class="cab v2 m-shell" id="cab">
    <header class="m-top">
      <div class="logoplate steel rivets" id="logoPlate" role="link" tabindex="0" aria-label="OmenX · back to Events">${LOGO_SVG("#07090f", "clipM")}</div>
      <div class="eqscr scr"><span class="lbl">Available</span><strong id="equity">$0.00</strong></div>
      <button class="key mkey dep" id="depBtn" aria-label="Deposit" title="Deposit">+</button>
      <button class="key mkey" id="rulesBtn">RULES</button>
      ${MUTE_BTN}
    </header>
    <section class="scr q"><h1>BTC · 30s calls · <span class="amt" id="mPrice">$—</span></h1><div class="meta"><span>Your open <b id="dYourOpen">$0 / $500</b></span><span>$5–100 a call</span></div></section>
    <div class="scr src" id="mSrc"><div class="s"><i>Binance</i><b id="s1">—</b></div><div class="s"><i>Hyperliq.</i><b id="s2">—</b></div><div class="s"><i>Coinbase</i><b id="s3">—</b></div><div class="s"><i>Index</i><b class="idx" id="mIdx">—</b></div></div>
    <div class="scr feed crt"><div class="feed-head"><div><div class="price up" id="price">$—</div><div class="chg" id="chg">—</div></div>${COMBO("dCombo")}<div class="lbl" id="dNext"></div></div>${MEGA("dMega")}<div class="plot" id="plot"><canvas id="cv"></canvas><div class="ov" id="dOv"><div><div class="t" id="dOvT">PAUSED</div><div class="s" id="dOvS"></div></div></div></div></div>
    <div class="scr calls"><span class="lbl" id="mStripLbl">My calls</span><div class="strip" id="mStrip"></div></div>
    <div class="sb"><div class="scr"><span class="lbl">Open</span><span class="n" id="mOpen">—</span></div><div class="scr"><span class="lbl">Live</span><span class="n" id="dLive">—</span></div><div class="scr"><span class="lbl">Session</span><span class="n" id="dSes">$0.00</span></div></div>
    <div class="scr bet"><div class="bethead"><span>Your stake</span><b id="dSel">$5 SELECTED</b></div><div class="chips" id="chips"></div></div>
    <div class="dirs">
      ${DIR("u", "btn")}
      ${DIR("d", "btn")}
    </div>
    <button class="peek" id="mPeek" aria-haspopup="dialog" aria-expanded="false" aria-controls="mSheet"><span class="lbl">Road &amp; stats</span><span class="pk" id="mPeekRoad"></span><span class="ar" aria-hidden="true">▲</span></button>
  </div>
  <div class="mscrim" id="mScrim" hidden></div>
  <section class="msheet steel" id="mSheet" role="dialog" aria-modal="true" aria-label="Road and stats" hidden>
    <div class="msh" id="mSheetH"><span class="grip" aria-hidden="true"></span><span class="tag">ROAD &amp; STATS</span><button class="key mx mxk" id="mSheetX" aria-label="Close">✕</button></div>
    <div class="scr rr" id="mRoads">${ROAD_STRIP.replace(/id="/g, 'id="m_')}</div>
    <div class="scr r4m"><span class="lbl">Session</span><span class="s" id="dSesS">0 won · 0 lost</span><span class="lbl">Last 10</span><span class="n"><span class="ticks" id="dTicks"></span></span><span class="s" id="dStreak"></span></div>
    <div class="scr msettled"><span class="lbl">Settled</span><div id="dDone"></div></div>
    <div class="mwin" id="mWin"><img class="mlynx" id="mLynx" src="/arcade/lynx0.png" alt=""></div>
  </section>
</main>`;
