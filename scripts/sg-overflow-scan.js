// style-guide overflow scan — run in the browser console (or Claude's javascript_tool) on
// /style-guide#<section> AFTER every frame has mounted (scroll the page to the bottom once).
// Reports, per iframe: document-level horizontal overflow, any element whose box spills past
// the frame's right edge, and nowrap text clipped by its own box. Known benign hits:
// sr-only "Close" (Radix) and the hidden referral-link input (clientWidth 0).
// Added 2026-09-25 after RW-12c (7 segments + "3 / 7 days") overflowed the 375 frame and
// RW-8d-b ("WEEKS DONE") wrapped — both shipped because the mainnet pass never scanned the
// dictionary frames. This is the machine check for DESIGN §Addendum 2026-09-25 rule 10.
(async () => {
  const H = document.documentElement.scrollHeight;
  for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 4000));
  const out = [];
  for (const f of document.querySelectorAll("iframe")) {
    const d = f.contentDocument, w = f.contentWindow; if (!d) continue;
    const key = (f.src.match(/c=([^&]+)/) || [])[1]; const dev = decodeURIComponent((f.src.match(/fid=([^&]+)/) || [])[1] || "");
    const W = d.documentElement.clientWidth; const hits = [];
    if (d.documentElement.scrollWidth > W + 1) hits.push(`doc scrollWidth ${d.documentElement.scrollWidth} > ${W}`);
    for (const el of d.body.querySelectorAll("*")) {
      const cs = w.getComputedStyle(el);
      if (cs.position === "fixed" || cs.visibility === "hidden" || cs.display === "none") continue;
      const r = el.getBoundingClientRect(); if (r.width === 0) continue;
      if (r.right > W + 1) { hits.push(`${el.tagName}.${String(el.className).slice(0, 40)} right=${Math.round(r.right)} "${(el.textContent || "").trim().slice(0, 30)}"`); if (hits.length > 8) break; }
    }
    for (const el of d.body.querySelectorAll("span,div,button,strong")) {
      if (el.children.length) continue; const cs = w.getComputedStyle(el);
      if (cs.whiteSpace === "nowrap" && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && cs.overflow !== "visible")
        hits.push(`clipped nowrap "${(el.textContent || "").trim().slice(0, 30)}" ${el.scrollWidth} > ${el.clientWidth}`);
      if (cs.whiteSpace !== "nowrap" && el.getClientRects().length > 1 && /^[A-Z0-9 $/]+$/.test((el.textContent || "").trim()) && (el.textContent || "").trim().length < 14)
        hits.push(`label wrapped "${(el.textContent || "").trim()}"`);
    }
    if (hits.length) out.push({ key, dev, W, hits });
  }
  console.table(out.flatMap((o) => o.hits.map((h) => ({ key: o.key, dev: o.dev, W: o.W, hit: h }))));
  return out;
})();
