"use client";

import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";

function isEditingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.closest) return false;
  return Boolean(
    el.closest("input, textarea, [contenteditable='true'], [contenteditable=''], .cm-editor"),
  );
}

function cloneBlock(block: Block): Block {
  return { ...structuredClone(block), id: uuidv4() };
}

/**
 * Block-level keyboard operations on the canvas (Notion-style):
 *   Esc               — clear selection
 *   Ctrl/Cmd+D        — duplicate selected blocks below themselves
 *   Ctrl/Cmd+Shift+↑↓ — move selected blocks up / down
 *   Delete/Backspace  — remove selected blocks (when not typing)
 */
export function useBlockKeyboardShortcuts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const store = useEditorStore.getState();
      const { blocks, selectedBlockIds } = store;
      const isMeta = e.ctrlKey || e.metaKey;
      const editing = isEditingTarget(e.target);

      if (e.key === "Escape" && !editing && selectedBlockIds.length > 0) {
        e.preventDefault();
        store.selectBlock(null);
        return;
      }

      if (selectedBlockIds.length === 0) return;

      // Duplicate — works even while editing (common muscle memory)
      if (isMeta && !e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const selected = blocks.filter((b) => selectedBlockIds.includes(b.id));
        if (selected.length === 0) return;
        const lastIdx = Math.max(...selected.map((b) => blocks.findIndex(x => x.id === b.id)));
        selected.forEach((b, i) => store.addBlock(cloneBlock(b), lastIdx + 1 + i));
        return;
      }

      if (editing) return;

      if (isMeta && e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const indices = selectedBlockIds
          .map((id) => blocks.findIndex((b) => b.id === id))
          .filter((i) => i !== -1);
        if (indices.length === 0) return;
        const minIdx = Math.min(...indices);
        const toIndex =
          e.key === "ArrowUp"
            ? Math.max(0, minIdx - 1)
            : Math.min(blocks.length - selectedBlockIds.length, minIdx + 1);
        store.moveBlocks(selectedBlockIds, toIndex);
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !isMeta) {
        e.preventDefault();
        store.removeBlocks(selectedBlockIds);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
