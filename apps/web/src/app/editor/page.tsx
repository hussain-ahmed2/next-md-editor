"use client";

import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { SourceEditor } from "@/components/editor/SourceEditor";
import { MarkdownPreview } from "@/components/editor/MarkdownPreview";
import { PlainFileEditor } from "@/components/editor/PlainFileEditor";
import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { DragDropProvider, DragOverlay, DragStartEvent } from "@dnd-kit/react";
import { useUIStore } from "@/store/uiStore";
import { BlockRegistry } from "@next-md-editor/editor-core";
import { FileText } from "lucide-react";

// Custom hooks
import { useActiveFilePersistence } from "@/hooks/useActiveFilePersistence";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useSynchronizedScroll } from "@/hooks/useSynchronizedScroll";
import { useFileDrop } from "@/hooks/useFileDrop";
import { useBlockKeyboardShortcuts } from "@/hooks/useBlockKeyboardShortcuts";

// Workspace chrome
import { ToolWindowStrip } from "@/components/workspace/ToolWindowStrip";
import { FileTree } from "@/components/workspace/FileTree";
import { EditorTabs } from "@/components/workspace/EditorTabs";
import { Breadcrumbs } from "@/components/workspace/Breadcrumbs";
import { StatusBar } from "@/components/workspace/StatusBar";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { getFileFormat } from "@/lib/workspace-storage";

// Extracted components
import { ResizeBar } from "@/components/editor/ResizeBar";
import { MobileBottomBar } from "@/components/editor/MobileBottomBar";
import { DragOverlayContent } from "@/components/editor/DragOverlayContent";
import { SearchReplaceOverlay } from "@/components/editor/SearchReplaceOverlay";
import { AiChatPanel } from "@/components/editor/AiChatPanel";
import { DropOverlay } from "@/components/editor/DropOverlay";

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

function EmptyEditorState() {
    return (
        <div className="ws-empty-editor">
            <FileText size={40} strokeWidth={1.2} />
            <span>No file open</span>
            <span style={{ fontSize: 12 }}>
                Select or create a file in the Project tool window to start writing.
            </span>
        </div>
    );
}

export default function EditorPage() {
    const [mounted, setMounted] = useState(false);

    const isMobile = useUIStore((s) => s.isMobile);
    const setIsMobile = useUIStore((s) => s.setIsMobile);
    const mobileTab = useUIStore((s) => s.mobileTab);
    const previewOpen = useUIStore((s) => s.previewOpen);
    const previewRatio = useUIStore((s) => s.previewRatio);
    const editorMode = useUIStore((s) => s.editorMode);
    const isResizingSidebar = useUIStore((s) => s.isResizingSidebar);
    const isResizingPreview = useUIStore((s) => s.isResizingPreview);
    const sidebarWidth = useUIStore((s) => s.sidebarWidth);
    const activeToolWindow = useUIStore((s) => s.activeToolWindow);

    const activeFileName = useWorkspaceStore((s) =>
        s.activeFileId ? (s.nodes[s.activeFileId]?.name ?? null) : null,
    );

    // Initialize and run workspace + persistence side effects
    useActiveFilePersistence();

    // Native OS file drop import + block keyboard operations
    const { isDraggingFiles } = useFileDrop();
    const isTextActive = activeFileName !== null && getFileFormat(activeFileName) === "text";
    useBlockKeyboardShortcuts(!isTextActive);

    const setMobileTab = useUIStore((s) => s.setMobileTab);

    const { sensors, handleDragEnd, setPendingMobileDragBlock } = useDragAndDrop();

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            if (!isMobile) return;
            const source = event.operation.source;
            if (!source?.data?.isSidebarItem) return;

            const dragBlock = source.data.block
                ? source.data.block
                : {
                      type: source.data.type as string,
                      props: { ...(BlockRegistry.get(source.data.type as string)?.defaultProps ?? {}) },
                  };

            setPendingMobileDragBlock(dragBlock);

            flushSync(() => {
                setMobileTab("editor");
                useUIStore.getState().setAiChatOpen(false);
            });
        },
        [isMobile, setMobileTab, setPendingMobileDragBlock],
    );

    const { refA: canvasScrollRef, refB: previewScrollRef } = useSynchronizedScroll();

    useEffect(() => {
        setTimeout(() => {
            setMounted(true);
        }, 0);
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            setTimeout(() => {
                setIsMobile(window.innerWidth < 768);
            }, 0);
        };
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
                            width: 260,
                            background: "var(--bg-elevated)",
                            borderRight: "1px solid var(--border)",
                        }}
                    />
                    <div style={{ flex: 1, background: "var(--bg-base)" }} />
                </div>
            </div>
        );
    }

    const isTextFile = activeFileName !== null && getFileFormat(activeFileName) === "text";
    const hasActiveFile = activeFileName !== null;

    // The center editing surface for the active file (canvas/plain/empty)
    const renderEditingSurface = (scrollRef?: React.Ref<HTMLDivElement>) => {
        if (!hasActiveFile) return <EmptyEditorState />;
        if (isTextFile) return <PlainFileEditor fileName={activeFileName} />;
        if (editorMode === "source") return <SourceEditor />;
        return <EditorCanvas scrollRef={scrollRef} />;
    };

    return (
        <DragDropProvider sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
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
                <SearchReplaceOverlay />
                <AiChatPanel />

                <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
                    {!isMobile && <ToolWindowStrip />}

                    {!isMobile && activeToolWindow === "project" && (
                        <aside className="ws-toolwindow" style={{ width: sidebarWidth, minWidth: 120 }}>
                            <FileTree />
                        </aside>
                    )}
                    {!isMobile && activeToolWindow === "blocks" && <EditorSidebar />}
                    {!isMobile && activeToolWindow !== null && <ResizeBar pane="sidebar" />}

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            overflow: "hidden",
                            minWidth: 0,
                        }}
                    >
                        {!isMobile && <EditorTabs />}
                        {!isMobile && hasActiveFile && <Breadcrumbs />}

                        {isMobile ? (
                            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                                <div
                                    style={{
                                        display: mobileTab === "files" ? "flex" : "none",
                                        flexDirection: "column",
                                        flex: 1,
                                        overflow: "hidden",
                                        background: "var(--toolwindow-bg)",
                                    }}
                                >
                                    <FileTree />
                                </div>
                                <div
                                    style={{
                                        display: mobileTab === "blocks" ? "flex" : "none",
                                        flex: 1,
                                        overflow: "hidden",
                                    }}
                                >
                                    <EditorSidebar />
                                </div>
                                <div
                                    style={{
                                        display: mobileTab === "editor" ? "flex" : "none",
                                        flexDirection: "column",
                                        flex: 1,
                                        overflow: "hidden",
                                    }}
                                >
                                    <EditorTabs />
                                    {renderEditingSurface(canvasScrollRef)}
                                </div>
                                <div
                                    style={{
                                        display: mobileTab === "preview" ? "flex" : "none",
                                        flex: 1,
                                        overflow: "hidden",
                                    }}
                                >
                                    <MarkdownPreview scrollRef={previewScrollRef} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                                {editorMode === "source" && !isTextFile && hasActiveFile ? (
                                    <div
                                        style={{
                                            flex: `${Math.round((1 - previewRatio) * 100)} 1 0`,
                                            display: "flex",
                                            overflow: "hidden",
                                            minWidth: 0,
                                        }}
                                    >
                                        <SourceEditor />
                                    </div>
                                ) : (
                                    renderEditingSurface(canvasScrollRef)
                                )}
                                {!isTextFile && hasActiveFile && previewOpen && (
                                    <>
                                        <ResizeBar pane="preview" />
                                        {editorMode === "source" ? (
                                            <div
                                                style={{
                                                    flex: `${Math.round(previewRatio * 100)} 1 0`,
                                                    display: "flex",
                                                    overflow: "hidden",
                                                    minWidth: 0,
                                                }}
                                            >
                                                <MarkdownPreview />
                                            </div>
                                        ) : (
                                            <MarkdownPreview scrollRef={previewScrollRef} />
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <StatusBar />
                <DropOverlay visible={isDraggingFiles} />

                {/* ActiveDragOverlay must be inside DragDropProvider to use useDragOperation() */}
                <ActiveDragOverlay />

                {isMobile && <MobileBottomBar />}
            </div>
        </DragDropProvider>
    );
}
