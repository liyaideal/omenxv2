---
name: LiteEventCard is frozen
description: Exact grammar of the generic Lite event card (Will it happen? grid) — FROZEN, place it, never restyle it
type: constraint
---

`src/components/lite/LiteEventCard.tsx` is a **FROZEN** component. Place it, never
redesign it. Never invent a replacement card for the events-page catalogue
("Will it happen?"), for Boost-filter groups, for watchlist, or for any future
category view. Grouping headers, filters and sections happen OUTSIDE the card.

Exception: the Editor's picks module (`EditorPicksModule.tsx`) has its own,
separately CPO-approved card. That is the ONLY other card style on the list page.

## The five-part grammar (real values from the restored/current code)

1. **Header art zone** — `CardArtTile`, `h-[130px]`, real `<img>` object-cover
   (Bonix IP artwork), blur placeholder, `priority` for `index < 4`, bottom→top
   scrim `linear-gradient(to top, rgba(10,11,13,0.85), transparent 60%)`,
   striped fallback when no art. Overlay badge stack `absolute left-3 top-3`,
   `gap-1.5`, **max 2 pills**, fixed fill order STATUS → Intraday → Boost:
   - Ends soon: `hsl(var(--trading-yellow))` bg / `#241B00` ink, Clock icon, `Ends {Xh Ym}`
   - New: `hsl(var(--yes))` bg / `#04222c` ink
   - Trending: `#FFFFFF` bg / `#0A0B0D` ink, Flame icon
   - Intraday: `hsl(var(--badge-intraday))` bg / `#2A1200` ink, Timer icon
   - Boost: `hsl(var(--no))` bg / `#1a2408` ink, Zap icon, `Boost {n}×`
   Pill: `rounded-full px-[10px] py-[5px] text-[11px] font-semibold`.
2. **Eyebrow** — `text-[10px] font-medium uppercase tracking-[0.12em] text-[#6B7280]`,
   `{MICROLABEL}` and, only for multi (`children.length > 2`), ` · {n} markets`.
3. **Title** — `mt-[7px] mb-4 min-h-[42px] font-display text-[17px] font-bold
   leading-[1.2] text-foreground`.
4. **Outcomes** (middle zone, `flex-1 justify-center`):
   - MULTI: top 2 options by price as continuous `h-[30px] rounded-[8px] px-2.5`
     rows, base `hsl(var(--yes)/0.05)`, absolute left-anchored fill at the
     probability width in `hsl(var(--yes)/0.09)`, label `text-[12.5px] font-semibold`
     left, `{p}%` right in `font-mono font-bold text-yes`. `space-y-1.5`.
    - BINARY (CPO ruling 2026-08-05 — the tinted-capsule exemption is
      CANCELLED): two Tier-2 neutral chips, `chip-t2` + `min-h-[58px] flex-1`,
      `border-radius: 11px`, `px-[13px]`, `gap-[10px]`, label left
      `text-[11px] text-[#9AA1AC]` ("Yes" / "No"), price right
      `font-display text-[17px] font-bold` in `#33D6FF` (Yes) / `#CFFF4A` (No),
      `--chip-accent` = the same colour for the hover border. No tinted fill,
      no coloured border at rest. Tier-1 tinted pairs are direction-only
      (Up/Down, Up/Not-up). The chip law governs DISPLAY, not selection
      controls: the one exempt tinted pair is `SideButton` — selected = solid
      fill, unselected = outline — because colour expresses the selected control
      state, not an information lean. Ruled 2026-08-06.
5. **Footer** — `mt-[14px] border-t border-[#1D2026] pt-[10px] text-[11px]
   text-[#6B7280]`, single baseline row. Multi: left `+{n} markets` in
   `font-semibold text-yes`, right `Vol $X · {Mon D}`. Binary: left `Vol $X`
   (font-mono), right settlement string (`Settles today HH:MM` / `Settles
   tomorrow` / `Settles {Wkd}` / `Settles {Mon D}` / `Settles {Mon YYYY}`).

Card shell: `rounded-[16px] border border-[#1D2026] bg-[#131519]`, body `p-[18px]`,
grid gap `18px`, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Routes to
`/spot?event=` for spot product lines, otherwise `/trade?event=`.

Only permitted future edits: data mapping (e.g. the `stocks|finance → "Finance"`
microlabel rename from the taxonomy round). Visual grammar above is closed.
