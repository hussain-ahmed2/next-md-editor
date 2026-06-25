"use client";

import { useEffect, useRef, useCallback } from "react";

export function useSynchronizedScroll() {
  const lock = useRef(false);
  const elARef = useRef<HTMLElement | null>(null);
  const elBRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const sync = useCallback((from: HTMLElement, to: HTMLElement) => {
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
  }, []);

  const attach = useCallback(() => {
    if (cleanupRef.current) cleanupRef.current();
    const elA = elARef.current;
    const elB = elBRef.current;
    if (!elA || !elB) return;

    const onScrollA = () => sync(elA, elB);
    const onScrollB = () => sync(elB, elA);

    elA.addEventListener("scroll", onScrollA, { passive: true });
    elB.addEventListener("scroll", onScrollB, { passive: true });

    cleanupRef.current = () => {
      elA.removeEventListener("scroll", onScrollA);
      elB.removeEventListener("scroll", onScrollB);
    };
  }, [sync]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  const refA = useCallback((node: HTMLElement | null) => {
    elARef.current = node;
    attach();
  }, [attach]);

  const refB = useCallback((node: HTMLElement | null) => {
    elBRef.current = node;
    attach();
  }, [attach]);

  return { refA, refB };
}
