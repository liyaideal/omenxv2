// ============================================================
// Pro desktop terminal skeleton (SP-1 · B1).
//
// THE only way to build a Pro desktop terminal. Both /trade
// (DesktopTrading) and /spot (SpotTrading) render through this shell so the
// two terminals can never drift on widths, gaps or borders again.
//
// Slots only — this file holds ZERO product data and ZERO business logic.
// Geometry (locked, extracted verbatim from DesktopTrading):
//   root        h-screen flex-col, overflow hidden
//   header      caller-owned chrome (each page keeps its own LOCKED header)
//   body        flex-1 flex
//     left      flex-1 min-w-0 overflow-y-auto
//       row     flex items-stretch {chartMinHeightClass} gap-1 p-1
//         chart flex-1 card
//         book  w-[280px] card
//       tabs    bottom strip (see ProBottomTabs)
//     rail      w-[280px] flex-col gap-2 m-1 overflow-y-auto
//   children    page-level dialogs / overlays
// ============================================================
import { ReactNode } from "react";

interface ProTerminalLayoutProps {
  header: ReactNode;
  /** Optional strip between header and body (e.g. multi-outcome chips). */
  subHeader?: ReactNode;
  chart: ReactNode;
  orderBook: ReactNode;
  bottomTabs: ReactNode;
  panel: ReactNode;
  account?: ReactNode;
  /**
   * Min height of the chart/order-book row. Futures locks 680px so the order
   * book bottom aligns with the taller trade panel; spot locks 600px.
   */
  chartMinHeightClass?: string;
  /** Dialogs, sheets and other page-level overlays. */
  children?: ReactNode;
}

export const ProTerminalLayout = ({
  header,
  subHeader,
  chart,
  orderBook,
  bottomTabs,
  panel,
  account,
  chartMinHeightClass = "min-h-[680px]",
  children,
}: ProTerminalLayoutProps) => (
  <div className="h-screen flex flex-col bg-background overflow-hidden">
    {header}
    {subHeader}

    <div className="flex-1 flex overflow-hidden">
      {/* Left: chart + order book on top, positions/orders below. */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className={`flex items-stretch ${chartMinHeightClass} gap-1 p-1`}>
          <div className="flex-1 flex flex-col min-w-0 bg-background rounded border border-border/30">
            {chart}
          </div>
          <div className="w-[280px] flex-shrink-0 flex flex-col bg-background rounded border border-border/30 overflow-hidden">
            {orderBook}
          </div>
        </div>

        {bottomTabs}
      </div>

      {/* Right rail: trade panel + account. */}
      <div className="w-[280px] flex-shrink-0 flex flex-col gap-2 m-1 overflow-y-auto">
        {panel}
        {account}
      </div>
    </div>

    {children}
  </div>
);
