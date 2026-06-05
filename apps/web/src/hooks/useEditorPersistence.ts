import { useEffect, useState } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { initRegistry } from "@/registry";
import { useUIStore } from "@/store/uiStore";

export function useEditorPersistence() {
  const blocks = useEditorStore((s) => s.blocks);
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
 
  const saveStatus = useUIStore((s) => s.saveStatus);
  const setSaveStatus = useUIStore((s) => s.setSaveStatus);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load
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
  }, [setBlocks]);

  // Persist to localStorage with 600ms debounce
  useEffect(() => {
    if (!isLoaded) return;

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      localStorage.setItem("next-md-editor-blocks", JSON.stringify(blocks));
      setSaveStatus("saved");
    }, 600);

    return () => clearTimeout(timer);
  }, [blocks, isLoaded]);

  // Global Undo / Redo keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && activeEl.contentEditable === "true") {
        return;
      }

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
