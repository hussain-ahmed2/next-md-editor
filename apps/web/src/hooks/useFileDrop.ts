"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { isMarkdownFile } from "@/lib/workspace-storage";
import { parseMarkdown } from "@/features/markdown/serializer";

/**
 * Window-level native file drop (OS → app import).
 *
 * dnd-kit never sees external drags, so this listens to the raw HTML5
 * drag events. Dropped .md files are parsed into block documents; any
 * other file is imported as plain text.
 */
export function useFileDrop() {
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  useEffect(() => {
    let depth = 0;

    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setIsDraggingFiles(true);
    };

    const onDragLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setIsDraggingFiles(false);
    };

    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      // Required to allow dropping
      e.preventDefault();
    };

    const onDrop = async (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setIsDraggingFiles(false);

      const files = Array.from(e.dataTransfer?.files ?? []);
      const { importFile } = useWorkspaceStore.getState();
      for (const file of files) {
        // Only import reasonable text files (up to 2 MB)
        if (file.size > 2 * 1024 * 1024) continue;
        try {
          const text = await file.text();
          if (isMarkdownFile(file.name)) {
            importFile(null, file.name, { format: "blocks", blocks: parseMarkdown(text) });
          } else {
            importFile(null, file.name, { format: "text", text });
          }
        } catch (err) {
          console.error(`Failed to import dropped file ${file.name}:`, err);
        }
      }
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return { isDraggingFiles };
}
