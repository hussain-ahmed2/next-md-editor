"use client";

import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { MarkdownPreview } from "@/components/editor/MarkdownPreview";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useEffect, useState } from "react";
import { initRegistry } from "@/registry";
import { parseMarkdown } from "@/features/markdown/serializer";

export default function EditorPage() {
  const [previewOpen, setPreviewOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [previewWidth, setPreviewWidth] = useState(360);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingPreview, setIsResizingPreview] = useState(false);

  const blocks = useEditorStore((s) => s.blocks);
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "idle">("idle");
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load
  useEffect(() => {
    initRegistry();
    const saved = localStorage.getItem("next-md-editor-blocks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBlocks(parsed);
          setIsLoaded(true);
          setSaveStatus("saved");
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved blocks:", e);
      }
    }

    // Default fallback demo markdown
    const DEMO_MARKDOWN = `# Welcome to next-md-editor!

This is a beautiful block-based markdown editor built with Next.js and Turborepo workspaces.

---

> Block-based editing makes reordering elements intuitive and fun. Drag and drop any block using the handle on the left side of the block!

\`\`\`ts
// Happy coding!
const editorName = "next-md-editor";
console.log(\`Successfully loaded demo in \${editorName}!\`);
\`\`\``;

    const parsedBlocks = parseMarkdown(DEMO_MARKDOWN);
    setBlocks(parsedBlocks);
    setIsLoaded(true);
    setSaveStatus("saved");
  }, [setBlocks]);

  // Persist to localStorage with 600ms debounce
  useEffect(() => {
    if (!isLoaded || blocks.length === 0) return;

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
      // Skip global undo/redo when the user is actively typing inside a
      // contentEditable element (paragraph, heading, table cell, etc.)
      // This lets the browser handle per-keystroke native text undo instead.
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

  const startResizeSidebar = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizingSidebar(true);
    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;

    const doResize = (mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX;
      const newWidth = Math.max(160, Math.min(360, startWidth + deltaX));
      setSidebarWidth(newWidth);
    };

    const stopResize = () => {
      setIsResizingSidebar(false);
      document.removeEventListener("mousemove", doResize);
      document.removeEventListener("mouseup", stopResize);
    };

    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);
  };

  const startResizePreview = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizingPreview(true);
    const startX = mouseDownEvent.clientX;
    const startWidth = previewWidth;

    const doResize = (mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX;
      const newWidth = Math.max(260, Math.min(600, startWidth - deltaX));
      setPreviewWidth(newWidth);
    };

    const stopResize = () => {
      setIsResizingPreview(false);
      document.removeEventListener("mousemove", doResize);
      document.removeEventListener("mouseup", stopResize);
    };

    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden",
      background: "var(--bg-base)",
      userSelect: isResizingSidebar || isResizingPreview ? "none" : "auto",
    }}>
      <EditorToolbar 
        previewOpen={previewOpen} 
        onTogglePreview={() => setPreviewOpen(v => !v)} 
        saveStatus={saveStatus}
      />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <EditorSidebar width={sidebarWidth} />
        
        {/* Sidebar Resize Bar */}
        <div
          onMouseDown={startResizeSidebar}
          style={{
            width: 4,
            cursor: "col-resize",
            background: isResizingSidebar ? "var(--accent)" : "transparent",
            zIndex: 10,
            transition: "background-color 0.15s ease",
            alignSelf: "stretch",
            marginLeft: -2,
            marginRight: -2,
          }}
          onMouseEnter={e => {
            if (!isResizingSidebar) e.currentTarget.style.background = "var(--accent-muted)";
          }}
          onMouseLeave={e => {
            if (!isResizingSidebar) e.currentTarget.style.background = "transparent";
          }}
        />

        <EditorCanvas />

        {previewOpen && (
          <>
            {/* Preview Resize Bar */}
            <div
              onMouseDown={startResizePreview}
              style={{
                width: 4,
                cursor: "col-resize",
                background: isResizingPreview ? "var(--accent)" : "transparent",
                zIndex: 10,
                transition: "background-color 0.15s ease",
                alignSelf: "stretch",
                marginLeft: -2,
                marginRight: -2,
              }}
              onMouseEnter={e => {
                if (!isResizingPreview) e.currentTarget.style.background = "var(--accent-muted)";
              }}
              onMouseLeave={e => {
                if (!isResizingPreview) e.currentTarget.style.background = "transparent";
              }}
            />
            <MarkdownPreview width={previewWidth} />
          </>
        )}
      </div>
    </div>
  );
}
