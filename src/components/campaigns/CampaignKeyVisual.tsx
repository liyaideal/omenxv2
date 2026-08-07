import { useState, type ReactNode } from "react";

const SCRIM = "linear-gradient(180deg, rgba(6,7,8,0) 28%, rgba(6,7,8,.9) 96%)";

/**
 * Campaign art slot. Renders the key visual with a scrim, or the graceful
 * fallback (flat panel + accent rail) when there is no image. Text always
 * lives in the DOM layer on top — never baked into the artwork.
 */
export const CampaignKeyVisual = ({
  src,
  accent,
  ratio,
  children,
  className,
}: {
  src?: string | null;
  accent: string;
  /** CSS aspect-ratio value, e.g. "16 / 6.4" */
  ratio: string;
  children: ReactNode;
  className?: string;
}) => {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  return (
    <div
      className={`relative w-full overflow-hidden ${className ?? ""}`}
      style={{ aspectRatio: ratio, background: showImage ? undefined : "#101216" }}
    >
      {showImage ? (
        <>
          <img
            src={src as string}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
          <div className="absolute inset-0" style={{ background: SCRIM }} />
        </>
      ) : (
        <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent }} />
      )}
      <div className="relative flex h-full flex-col justify-between p-4">{children}</div>
    </div>
  );
};