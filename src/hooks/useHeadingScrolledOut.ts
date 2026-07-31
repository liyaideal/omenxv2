import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Watches a heading element and reports whether it has scrolled out of the
 * viewport. Used by the Lite trade pages to fade the mobile header title in
 * only after the in-content H1 is gone.
 */
export const useHeadingScrolledOut = () => {
  const [scrolledOut, setScrolledOut] = useState(false);
  const nodeRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback(() => {
    observerRef.current?.disconnect();
    const node = nodeRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => setScrolledOut(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(node);
    observerRef.current = obs;
  }, []);

  const headingRef = useCallback(
    (node: HTMLElement | null) => {
      nodeRef.current = node;
      observe();
    },
    [observe],
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { headingRef, scrolledOut };
};
