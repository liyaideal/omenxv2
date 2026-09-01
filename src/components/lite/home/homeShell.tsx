// ============================================================
// HOME (HP-1) — shared shell primitives for the four stage cards.
// Colours map the mock onto the project's existing DNA tokens.
// ============================================================
import { CSSProperties, ReactNode } from "react";

export const ORANGE = "#FF8A3D";
export const CYAN = "#33D6FF";
export const LIME = "#CFFF4A";
export const MUTED = "#98A1AD";

export const HomeCard = ({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) => (
  <div
    className={className}
    style={{
      background: "#13161C",
      border: "1px solid rgba(148,163,184,0.14)",
      borderRadius: 20,
      boxSizing: "border-box",
      ...style,
    }}
  >
    {children}
  </div>
);

export const HomeEyebrow = ({
  children,
  color,
}: {
  children: ReactNode;
  color: string;
}) => (
  <div
    className="font-display"
    style={{
      color,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

export const HomeQuestion = ({
  children,
  size = 26,
}: {
  children: ReactNode;
  size?: number;
}) => (
  <span
    className="font-display"
    style={{ fontSize: size, fontWeight: 700, letterSpacing: "-0.01em", color: "#fff" }}
  >
    {children}
  </span>
);

export const HomeSkeletonRow = ({ height = 44 }: { height?: number }) => (
  <div
    className="w-full animate-pulse"
    style={{ height, background: "#191D24", borderRadius: 12 }}
  />
);
