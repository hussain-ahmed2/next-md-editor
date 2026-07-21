import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { initRegistry } from "@/registry";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import {
  emptyFileContent,
  getFileFormat,
  loadFileContent,
  saveFileContent,
} from "@/lib/workspace-storage";
import { registerFlush } from "@/lib/persistence-bridge";
import { parseMarkdown, serializeToMarkdown } from "@/features/markdown/serializer";

/**
 * Multi-file persistence bridge.
 *
 * Loads the active file's content into the editor (blocks) or the plain-text
 * buffer, debounce-saves edits to that file's own localStorage key, and
 * synchronously flushes pending writes before the workspace switches files
 * (registered via the persistence bridge, called by workspaceStore actions).
 */
export function useActiveFilePersistence() {
  const blocks = useEditorStore((s) => s.blocks);
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  const setSaveStatus = useUIStore((s) => s.setSaveStatus);
  const saveStatus = useUIStore((s) => s.saveStatus);
  const plainText = useUIStore((s) => s.plainText);
  const setPlainText = useUIStore((s) => s.setPlainText);

  const initWorkspace = useWorkspaceStore((s) => s.init);
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);
  const activeFileName = useWorkspaceStore((s) =>
    s.activeFileId ? (s.nodes[s.activeFileId]?.name ?? null) : null,
  );
  const markDirty = useWorkspaceStore((s) => s.markDirty);
  const clearDirty = useWorkspaceStore((s) => s.clearDirty);

  const [isLoaded, setIsLoaded] = useState(false);

  // Stable refs so timers/flush always see the latest data without stale closures
  const blocksRef = useRef(blocks);
  const plainTextRef = useRef(plainText);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);
  useEffect(() => {
    plainTextRef.current = plainText;
  }, [plainText]);

  /** Which file's content currently lives in the editor/text buffer. */
  const loadedFileIdRef = useRef<string | null>(null);
  const loadedFormatRef = useRef<"blocks" | "text">("blocks");
  /** True right after a programmatic load, so the save effect skips one cycle. */
  const justLoadedRef = useRef(false);
  /** True while an edit is waiting for its debounced write. */
  const pendingRef = useRef(false);

  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize registry + workspace once on mount
  useEffect(() => {
    initRegistry();
    setTimeout(() => {
      initWorkspace();
      setIsLoaded(true);
    }, 0);
  }, [initWorkspace]);

  // Synchronous flush — registered with the bridge so workspaceStore can call
  // it before any file switch/close/delete.
  useEffect(() => {
    const flush = () => {
      if (!pendingRef.current || !loadedFileIdRef.current) return;
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
      savingTimerRef.current = null;
      writeTimerRef.current = null;
      const id = loadedFileIdRef.current;
      try {
        saveFileContent(
          id,
          loadedFormatRef.current === "blocks"
            ? { format: "blocks", blocks: blocksRef.current }
            : { format: "text", text: plainTextRef.current },
        );
        useWorkspaceStore.getState().clearDirty(id);
      } catch (e) {
        console.error("Failed to flush file save:", e);
      }
      pendingRef.current = false;
    };
    registerFlush(flush);
    // Also flush when the page is being hidden/closed so nothing is lost.
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      registerFlush(null);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  // Load content whenever the active file changes
  useEffect(() => {
    if (!isLoaded) return;
    if (!activeFileId || !activeFileName) {
      loadedFileIdRef.current = null;
      return;
    }
    const format = getFileFormat(activeFileName);
    // Reload when the file changed, or when a rename changed its format
    // (e.g. notes.md → notes.txt must re-render as raw text).
    if (loadedFileIdRef.current === activeFileId && loadedFormatRef.current === format) return;

    // Pending writes for the previous file were flushed by the store action
    // (via the bridge) before activeFileId changed.
    const content = loadFileContent(activeFileId) ?? emptyFileContent(activeFileName);
    loadedFileIdRef.current = activeFileId;
    loadedFormatRef.current = format;
    justLoadedRef.current = true;
    if (format === "blocks") {
      // A text file renamed to .md: parse its raw markdown into blocks.
      setBlocks(content.format === "blocks" ? content.blocks : parseMarkdown(content.text));
    } else {
      // An .md file renamed to plain: show its serialized markdown as text.
      setPlainText(content.format === "text" ? content.text : serializeToMarkdown(content.blocks));
      // Keep the canvas in a sane state while a text file is active.
      setBlocks([]);
    }
    // Undo history must never cross file boundaries.
    useEditorStore.temporal.getState().clear();
    setSaveStatus("saved");
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
  }, [isLoaded, activeFileId, activeFileName, setBlocks, setPlainText, setSaveStatus]);

  // Debounced save of edits to the loaded file:
  //   Phase 1 — 400ms after last change → show "Saving…"
  //   Phase 2 — 800ms after last change → write to localStorage, show "Saved"
  //   Phase 3 — 2s after "Saved" → reset indicator to idle
  useEffect(() => {
    if (!isLoaded || !loadedFileIdRef.current) return;
    if (justLoadedRef.current) {
      // This change came from loading a file, not from the user editing.
      justLoadedRef.current = false;
      return;
    }

    const fileId = loadedFileIdRef.current;
    pendingRef.current = true;
    markDirty(fileId);

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    savingTimerRef.current = setTimeout(() => setSaveStatus("saving"), 400);

    writeTimerRef.current = setTimeout(() => {
      try {
        saveFileContent(
          fileId,
          loadedFormatRef.current === "blocks"
            ? { format: "blocks", blocks: blocksRef.current }
            : { format: "text", text: plainTextRef.current },
        );
        pendingRef.current = false;
        clearDirty(fileId);
        setSaveStatus("saved");
        idleTimerRef.current = setTimeout(() => {
          setSaveStatus("idle");
          idleTimerRef.current = null;
        }, 2000);
      } catch (e) {
        console.error("Failed to save file:", e);
        setSaveStatus("idle");
      }
    }, 800);

    return () => {
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    };
  }, [blocks, plainText, isLoaded, markDirty, clearDirty, setSaveStatus]);

  // Global keyboard shortcuts (skip when focus is inside CodeMirror — it has
  // its own undo stack and find panel)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(".cm-editor")) return;
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
