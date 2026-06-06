"use client";

import { useEffect, useRef } from "react";

export function useSynchronizedScroll(
  a: React.RefObject<HTMLElement | null>,
  b: React.RefObject<HTMLElement | null>,
) {
  const lock = useRef(false);

  useEffect(() => {
    const elA = a.current;
    const elB = b.current;
    if (!elA || !elB) return;

    function sync(from: HTMLElement, to: HTMLElement) {
      if (lock.current) return;
      lock.current = true;
      const maxFrom = from.scrollHeight - from.clientHeight;
      const maxTo = to.scrollHeight - to.clientHeight;
      if (maxFrom <= 0 || maxTo <= 0) {
        lock.current = false;
        return;
      }
      to.scrollTop = (from.scrollTop / maxFrom) * maxTo;
      requestAnimationFrame(() => { lock.current = false; });
    }

    function onScrollA() { sync(elA!, elB!); }
    function onScrollB() { sync(elB!, elA!); }

    elA.addEventListener("scroll", onScrollA, { passive: true });
    elB.addEventListener("scroll", onScrollB, { passive: true });

    return () => {
      elA.removeEventListener("scroll", onScrollA);
      elB.removeEventListener("scroll", onScrollB);
    };
  }, [a, b]);
}
