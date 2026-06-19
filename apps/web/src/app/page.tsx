"use client";

import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { SourceEditor } from "@/components/editor/SourceEditor";
import { MarkdownPreview } from "@/components/editor/MarkdownPreview";
import { useCallback, useEffect, useState } from "react";
import { DragDropProvider, DragOverlay, DragStartEvent } from "@dnd-kit/react";
import { useUIStore } from "@/store/uiStore";
import { useEditorStore, BlockRegistry } from "@next-md-editor/editor-core";
import { v4 as uuidv4 } from "uuid";

// Custom hooks
import { useEditorPersistence } from "@/hooks/useEditorPersistence";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useSynchronizedScroll } from "@/hooks/useSynchronizedScroll";

// Extracted components
import { ResizeBar } from "@/components/editor/ResizeBar";
import { MobileBottomBar } from "@/components/editor/MobileBottomBar";
import { DragOverlayContent } from "@/components/editor/DragOverlayContent";

// Disable dropAnimation entirely — the default "snap back" animation causes
// a brief flicker of the drag overlay at the original block position after
// a canvas reorder. null = instant removal with no animation.
function ActiveDragOverlay() {
  return (
    <DragOverlay dropAnimation={null}>
      <DragOverlayContent />
    </DragOverlay>
  );
}

export default function EditorPage() {
  const [mounted, setMounted] = useState(false);
  
  const isMobile = useUIStore((s) => s.isMobile);
  const setIsMobile = useUIStore((s) => s.setIsMobile);
  const mobileTab = useUIStore((s) => s.mobileTab);
  const previewOpen = useUIStore((s) => s.previewOpen);
  const editorMode = useUIStore((s) => s.editorMode);
  const isResizingSidebar = useUIStore((s) => s.isResizingSidebar);
  const isResizingPreview = useUIStore((s) => s.isResizingPreview);

  // Initialize and run persistence side effects
  useEditorPersistence();

  const addBlock = useEditorStore((s) => s.addBlock);
  const setMobileTab = useUIStore((s) => s.setMobileTab);

  // Only two things needed from the hook now
  const { sensors, handleDragEnd } = useDragAndDrop();

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!isMobile) return;
      const source = event.operation.source;
      if (!source?.data?.isSidebarItem) return;
      const type = source.data.type as string;
      const def = BlockRegistry.get(type);
      addBlock({
        id: uuidv4(),
        type,
        props: { ...(def?.defaultProps ?? {}) },
      });
      setMobileTab("editor");
    },
    [isMobile, addBlock, setMobileTab],
  );

  const { refA: canvasScrollRef, refB: previewScrollRef } = useSynchronizedScroll();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsMobile]);

  if (!mounted) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          background: "var(--bg-base)",
        }}
      >
        <div
          style={{
            height: 48,
            background: "var(--bg-elevated)",
            borderBottom: "1px solid var(--border)",
          }}
        />
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div
            style={{
              width: 220,
              background: "var(--bg-elevated)",
              borderRight: "1px solid var(--border)",
            }}
          />
          <div style={{ flex: 1, background: "var(--bg-base)" }} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-base)",
        userSelect: isResizingSidebar || isResizingPreview ? "none" : "auto",
      }}
    >
      <EditorToolbar />

      {editorMode === "source" ? (
        <div
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <SourceEditor />
          {previewOpen && (
            <>
              <ResizeBar pane="preview" />
              <MarkdownPreview />
            </>
          )}
        </div>
      ) : (
        <DragDropProvider sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <div
            style={{
              display: "flex",
              flex: 1,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {isMobile ? (
              <>
                {mobileTab === "blocks" && <EditorSidebar />}
                {mobileTab === "editor" && <EditorCanvas scrollRef={canvasScrollRef} />}
                {mobileTab === "preview" && <MarkdownPreview scrollRef={previewScrollRef} />}
              </>
            ) : (
              <>
                <EditorSidebar />
                <ResizeBar pane="sidebar" />
                <EditorCanvas scrollRef={canvasScrollRef} />
                {previewOpen && (
                  <>
                    <ResizeBar pane="preview" />
                    <MarkdownPreview scrollRef={previewScrollRef} />
                  </>
                )}
              </>
            )}
          </div>

          {/* ActiveDragOverlay must be inside DragDropProvider to use useDragOperation() */}
          <ActiveDragOverlay />
        </DragDropProvider>
      )}

      {isMobile && <MobileBottomBar />}
    </div>
  );
}
