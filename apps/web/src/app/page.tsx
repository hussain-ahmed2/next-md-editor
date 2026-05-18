"use client";

import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { MarkdownPreview } from "@/components/editor/MarkdownPreview";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useEffect, useState } from "react";
import { initRegistry } from "@/registry";

export default function EditorPage() {
  const [previewOpen, setPreviewOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [previewWidth, setPreviewWidth] = useState(360);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingPreview, setIsResizingPreview] = useState(false);

  useEffect(() => {
    initRegistry();
  }, []);

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
      <EditorToolbar previewOpen={previewOpen} onTogglePreview={() => setPreviewOpen(v => !v)} />
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
