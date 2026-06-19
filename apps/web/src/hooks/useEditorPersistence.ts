import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { initRegistry } from "@/registry";
import { useUIStore } from "@/store/uiStore";

export function useEditorPersistence() {
  const blocks = useEditorStore((s) => s.blocks);
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  const setSaveStatus = useUIStore((s) => s.setSaveStatus);
  const saveStatus = useUIStore((s) => s.saveStatus);
  const [isLoaded, setIsLoaded] = useState(false);

  // Stable ref so save timers always write the latest data without stale closures
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Ref to hold the "idle" reset timer so we can cancel it if editing resumes
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load from localStorage
  useEffect(() => {
    initRegistry();
    const saved = localStorage.getItem("next-md-editor-blocks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBlocks(parsed);
          setIsLoaded(true);
          setSaveStatus("saved");
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved blocks:", e);
      }
    }
    setIsLoaded(true);
    setSaveStatus("idle");
  }, [setBlocks, setSaveStatus]);

  // Optimized two-phase auto-save debounce:
  //   Phase 1 — 400ms after last change → show "Saving…" indicator
  //   Phase 2 — 800ms after last change → write to localStorage, show "Saved"
  //   Phase 3 — 2s after "Saved" → reset indicator to idle
  useEffect(() => {
    if (!isLoaded) return;

    // Cancel any pending idle-reset from a previous save cycle
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    // Phase 1: show saving indicator only after 400ms pause (no per-keystroke flicker)
    const savingTimer = setTimeout(() => {
      setSaveStatus("saving");
    }, 400);

    // Phase 2: write to localStorage at 800ms
    const writeTimer = setTimeout(() => {
      try {
        localStorage.setItem(
          "next-md-editor-blocks",
          JSON.stringify(blocksRef.current),
        );
        setSaveStatus("saved");

        // Phase 3: auto-clear "Saved" banner after 2s
        idleTimerRef.current = setTimeout(() => {
          setSaveStatus("idle");
          idleTimerRef.current = null;
        }, 2000);
      } catch (e) {
        console.error("Failed to save blocks:", e);
        setSaveStatus("idle");
      }
    }, 800);

    return () => {
      clearTimeout(savingTimer);
      clearTimeout(writeTimer);
    };
  }, [blocks, isLoaded, setSaveStatus]);

  // Global Undo / Redo keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;
      if (isMeta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (isMeta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (isMeta && e.key.toLowerCase() === "f") {
        e.preventDefault();
        useUIStore.getState().setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [undo, redo]);

  return {
    saveStatus,
    isLoaded,
  };
}
