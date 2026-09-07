// ============================================================
// 海报等比缩放外壳。
// 海报组件自身恒 400px 宽；容器装不下时由本组件把整张等比缩小，
// 绝不改变海报自身布局（一旦被压窄，内容会重排，导出图规格就不一致）。
// ============================================================
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** 海报基准宽度，与 LitePnlPoster 根节点写死的宽度一致。 */
export const POSTER_WIDTH = 400;

export const PosterScaleFrame = ({ children }: { children: ReactNode }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const measure = () => {
      const box = boxRef.current;
      const inner = innerRef.current;
      if (!box || !inner) return;
      const available = box.clientWidth;
      const next = available > 0 ? Math.min(1, available / POSTER_WIDTH) : 1;
      setScale(next);
      setHeight(inner.offsetHeight * next);
    };
    measure();
    const inner = innerRef.current;
    const ro = inner ? new ResizeObserver(measure) : null;
    if (ro && inner) ro.observe(inner);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={boxRef}
      className="mx-auto overflow-hidden"
      style={{ width: "100%", maxWidth: `${POSTER_WIDTH}px`, height }}
    >
      <div
        className="origin-top-left"
        style={{ width: `${POSTER_WIDTH}px`, transform: `scale(${scale})` }}
      >
        <div ref={innerRef}>{children}</div>
      </div>
    </div>
  );
};

export default PosterScaleFrame;
