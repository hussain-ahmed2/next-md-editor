"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { getDomTextOffset, restoreDomRange } from "@next-md-editor/markdown";

export function useContentSync<T>({
  blockId,
  ref,
  storeValue,
  updatePropName,
  parseHtml,
  serializeToHtml,
  onInputCallback,
}: {
  blockId: string;
  ref: React.RefObject<HTMLElement | null>;
  storeValue: T;
  updatePropName: string;
  parseHtml: (html: string) => T;
  serializeToHtml: (value: T) => string;
  onInputCallback?: (rawText: string) => void;
}) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest refs of parameters to avoid re-creating handlers
  const storeValueRef = useRef(storeValue);
  const parseHtmlRef = useRef(parseHtml);
  const serializeToHtmlRef = useRef(serializeToHtml);

  // Update refs in an effect to avoid mutating during render
  useEffect(() => {
    storeValueRef.current = storeValue;
    parseHtmlRef.current = parseHtml;
    serializeToHtmlRef.current = serializeToHtml;
  });

  // Flush any pending updates immediately
  const flushUpdate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const el = ref.current;
    if (!el) return;
    const currentHtml = el.innerHTML;
    const parsed = parseHtmlRef.current(currentHtml);
    
    // Check if store is already in sync to avoid unnecessary updates
    const currentStoreVal = storeValueRef.current;
    if (JSON.stringify(currentStoreVal) !== JSON.stringify(parsed)) {
      updateBlock(blockId, { [updatePropName]: parsed });
    }
  }, [blockId, ref, updateBlock, updatePropName]);

  // Handle local DOM input (onInput)
  const handleInput = useCallback((e: React.FormEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rawText = el.textContent ?? "";
    if (onInputCallback) {
      onInputCallback(rawText);
    }

    // Debounce the store update
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      const parsed = parseHtmlRef.current(el.innerHTML);
      updateBlock(blockId, { [updatePropName]: parsed });
    }, 400); // 400ms debounce
  }, [blockId, onInputCallback, updateBlock, updatePropName]);

  // Handle blur - immediately flush changes to the store
  const handleBlur = useCallback(() => {
    flushUpdate();
  }, [flushUpdate]);

  // Reconcile incoming store updates (e.g., undo/redo) back to the DOM
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if the DOM matches the store representation
    const expectedHtml = serializeToHtmlRef.current(storeValue);
    if (el.innerHTML === expectedHtml) return;

    // Save caret position if focused
    let savedStart = -1;
    let savedEnd = -1;
    const isFocused = document.activeElement === el;
    if (isFocused) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && sel.anchorNode && sel.focusNode && el.contains(sel.anchorNode) && el.contains(sel.focusNode)) {
        savedStart = getDomTextOffset(el, sel.anchorNode, sel.anchorOffset);
        savedEnd = getDomTextOffset(el, sel.focusNode, sel.focusOffset);
      }
    }

    // Update DOM
    el.innerHTML = expectedHtml;

    // Restore caret position
    if (savedStart >= 0) {
      const totalLen = el.textContent?.length ?? 0;
      restoreDomRange(el, Math.min(savedStart, totalLen), Math.min(savedEnd, totalLen));
    }
  }, [storeValue, ref]);

  // Cleanup pending timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    handleInput,
    handleBlur,
    flushUpdate,
  };
}
