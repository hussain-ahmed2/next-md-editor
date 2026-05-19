"use client";

import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { MarkdownPreview } from "@/components/editor/MarkdownPreview";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { initRegistry } from "@/registry";
import { parseMarkdown } from "@/features/markdown/serializer";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from "@dnd-kit/core";
import { v4 as uuidv4 } from "uuid";
import { BlockRegistry } from "@next-md-editor/editor-core";
import { BlockRenderer } from "@/components/editor/BlockRenderer";
import { CANVAS_ROOT_ID } from "@/components/editor/EditorCanvas";

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
  const moveBlocks = useEditorStore((s) => s.moveBlocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "idle">(
    "idle",
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Drag and Drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState<{
    type: string;
    label: string;
  } | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const lastDeltaY = useRef<number | null>(null);
  const mouseClientY = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseClientY.current = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const pointerSensor = useSensor(
    PointerSensor,
    useMemo(() => ({ activationConstraint: { distance: 6 } }), [])
  );
  const sensors = useSensors(pointerSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const isSidebarDrag =
      active.data.current?.isSidebarItem ||
      (active.id && active.id.toString().startsWith("sidebar-"));
    if (isSidebarDrag) {
      const type =
        active.data.current?.type ||
        active.id.toString().replace("sidebar-", "");
      setActiveSidebarItem({
        type,
        label:
          active.data.current?.label ||
          type.charAt(0).toUpperCase() + type.slice(1),
      });
      setInsertIndex(blocks.length);
      lastDeltaY.current = null;
    } else {
      setActiveId(active.id as string);
    }
  }, [blocks.length]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over, delta } = event;
    const isSidebarDrag =
      active.data.current?.isSidebarItem ||
      (active.id && active.id.toString().startsWith("sidebar-"));
    if (isSidebarDrag) {
      if (!over) {
        console.log("[DragOver] over is null!");
        return; // Keep last known insertIndex to prevent flickering or disappearing placeholder
      }

      const overId = over.id as string;
      console.log("[DragOver] overId:", overId);

      if (overId === CANVAS_ROOT_ID) {
        if (blocks.length === 0) {
          setInsertIndex(0);
        } else {
          let isTop = false;
          const firstBlockEl = document.getElementById(blocks[0].id);
          if (firstBlockEl) {
            const rect = firstBlockEl.getBoundingClientRect();
            if (mouseClientY.current < rect.top + rect.height / 2) {
              isTop = true;
            }
          } else if (over.rect) {
            const canvasCenterY = over.rect.top + over.rect.height / 2;
            isTop = mouseClientY.current < canvasCenterY;
          }
          setInsertIndex(isTop ? 0 : blocks.length);
        }
        lastDeltaY.current = delta.y;
      } else if (overId === active.id || overId.startsWith("placeholder-")) {
        // Keep current insertIndex to prevent flickering / infinite loops
      } else {
        const idx = blocks.findIndex((b) => b.id === overId);
        console.log("[DragOver] idx of block:", idx);
        if (idx !== -1) {
          // Calculate if we are hovering over the upper or lower 50% of the block
          let targetIndex = idx;
          
          if (over.rect) {
            const overCenterY = over.rect.top + over.rect.height / 2;
            if (mouseClientY.current > overCenterY) {
              targetIndex = idx + 1;
            }
          }

          console.log("[DragOver] targetIndex computed:", targetIndex, "current insertIndex:", insertIndex);

          if (targetIndex !== insertIndex) {
            if (lastDeltaY.current !== null) {
              const diffY = Math.abs(delta.y - lastDeltaY.current);
              if (diffY < 20) {
                console.log("[DragOver] Ignored due to low delta:", diffY);
                // Ignore layout shift updates when mouse is stationary!
                return;
              }
            }
            setInsertIndex(targetIndex);
            lastDeltaY.current = delta.y;
          }
        }
      }
    }
  }, [blocks, insertIndex]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    const finalInsertIndex = insertIndex;
    setInsertIndex(null);
    lastDeltaY.current = null;

    const isSidebarDrag =
      active.data.current?.isSidebarItem ||
      (active.id && active.id.toString().startsWith("sidebar-"));

    if (isSidebarDrag) {
      const type =
        active.data.current?.type ||
        active.id.toString().replace("sidebar-", "");
      const def = BlockRegistry.get(type);
      const newBlock = {
        id: uuidv4(),
        type,
        props: { ...(def?.defaultProps ?? {}) },
      };

      console.log(
        "[DragEnd] Sidebar item dropped:",
        type,
        "at index:",
        finalInsertIndex,
      );

      const isSuccessfulDrop = !!over;
      if (isSuccessfulDrop) {
        if (typeof finalInsertIndex === "number") {
          addBlock(newBlock, finalInsertIndex);
        } else {
          addBlock(newBlock);
        }
        // Delay resetting the active sidebar item slightly to let the dropAnimation prop (activeSidebarItem ? null : undefined) evaluate to null and instantly hide the overlay
        setTimeout(() => {
          setActiveSidebarItem(null);
        }, 0);
      } else {
        setActiveSidebarItem(null);
      }
      return;
    }

    setActiveSidebarItem(null);
    if (!over) return;

    // Standard canvas reordering
    if (active.id === over.id) return;
    
    let toIndex = -1;
    if (over.id === CANVAS_ROOT_ID) {
      if (blocks.length > 0) {
        let isTop = false;
        const firstBlockEl = document.getElementById(blocks[0].id);
        if (firstBlockEl) {
          const rect = firstBlockEl.getBoundingClientRect();
          if (mouseClientY.current < rect.top + rect.height / 2) {
            isTop = true;
          }
        } else if (over.rect) {
          const canvasCenterY = over.rect.top + over.rect.height / 2;
          isTop = mouseClientY.current < canvasCenterY;
        }
        toIndex = isTop ? 0 : blocks.length;
      } else {
        toIndex = 0;
      }
    } else {
      const sortableIndex = over.data.current?.sortable?.index;
      if (typeof sortableIndex === "number") {
        toIndex = sortableIndex;
      } else {
        toIndex = blocks.findIndex((b) => b.id === over.id);
      }
    }

    if (toIndex !== -1) {
      if (selectedBlockIds.includes(active.id as string) && selectedBlockIds.length > 1) {
        moveBlocks(selectedBlockIds, toIndex);
      } else {
        moveBlocks([active.id as string], toIndex);
      }
    }
  }, [insertIndex, blocks, addBlock, moveBlocks, selectedBlockIds]);

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

  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // Use closestCenter for all dragging to guarantee robust block-level target resolution
    return closestCenter(args);
  }, []);

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
              width: sidebarWidth,
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
      <EditorToolbar
        previewOpen={previewOpen}
        onTogglePreview={() => setPreviewOpen((v) => !v)}
        saveStatus={saveStatus}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <EditorSidebar width={sidebarWidth} />

          {/* Sidebar Resize Bar */}
          <div
            onMouseDown={startResizeSidebar}
            style={{
              width: 8,
              cursor: "col-resize",
              background: isResizingSidebar
                ? "var(--accent-muted)"
                : "transparent",
              zIndex: 10,
              transition: "background-color 0.15s ease",
              alignSelf: "stretch",
              marginLeft: -4,
              marginRight: -4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              if (!isResizingSidebar)
                e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isResizingSidebar)
                e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                color: "var(--text-muted)",
                opacity: isResizingSidebar ? 1 : 0.5,
                pointerEvents: "none",
              }}
            >
              <GripVertical size={12} />
            </div>
          </div>

          <EditorCanvas
            activeSidebarItem={activeSidebarItem}
            insertIndex={insertIndex}
          />

          {previewOpen && (
            <>
              {/* Preview Resize Bar */}
              <div
                onMouseDown={startResizePreview}
                style={{
                  width: 8,
                  cursor: "col-resize",
                  background: isResizingPreview
                    ? "var(--accent-muted)"
                    : "transparent",
                  zIndex: 10,
                  transition: "background-color 0.15s ease",
                  alignSelf: "stretch",
                  marginLeft: -4,
                  marginRight: -4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  if (!isResizingPreview)
                    e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isResizingPreview)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    color: "var(--text-muted)",
                    opacity: isResizingPreview ? 1 : 0.5,
                    pointerEvents: "none",
                  }}
                >
                  <GripVertical size={12} />
                </div>
              </div>
              <MarkdownPreview width={previewWidth} />
            </>
          )}
        </div>

        <DragOverlay
          adjustScale={false}
          dropAnimation={activeSidebarItem ? null : undefined}
        >
          {activeId ? (
            <div
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--accent)",
                background: "var(--bg-elevated)",
                boxShadow: "var(--shadow-lg)",
                padding: "8px 12px",
                cursor: "grabbing",
                opacity: 0.9,
              }}
            >
              {(() => {
                const activeBlock = blocks.find((b) => b.id === activeId);
                const isMultiDrag = selectedBlockIds.includes(activeId as string) && selectedBlockIds.length > 1;
                
                return activeBlock ? (
                  <div style={{ position: "relative" }}>
                    <BlockRenderer block={activeBlock} />
                    {isMultiDrag && (
                      <div
                        style={{
                          position: "absolute",
                          top: -10,
                          right: -10,
                          background: "var(--accent)",
                          color: "white",
                          fontSize: 12,
                          fontWeight: "bold",
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "var(--shadow-sm)",
                          zIndex: 10,
                        }}
                      >
                        {selectedBlockIds.length}
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          ) : activeSidebarItem ? (
            <div
              style={{
                padding: "8px 16px",
                background: "var(--accent)",
                color: "white",
                borderRadius: "var(--radius-md)",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "var(--shadow-lg)",
                cursor: "grabbing",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Adding {activeSidebarItem.label}...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
