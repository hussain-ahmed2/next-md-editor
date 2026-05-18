"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { BlockRenderer } from "./BlockRenderer";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableBlock } from "./SortableBlock";
import { useState } from "react";

export function EditorCanvas() {
  const { blocks, moveBlock } = useEditorStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const toIndex = blocks.findIndex((b) => b.id === over.id);
    if (toIndex !== -1) moveBlock(active.id as string, toIndex);
  };

  const activeBlock = blocks.find((b) => b.id === activeId);

  return (
    <main
      style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 24px",
        background: "var(--bg-base)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 720 }}>
        {blocks.length === 0 && <EmptyState />}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {blocks.map((block) => (
                <SortableBlock key={block.id} id={block.id}>
                  <BlockRenderer block={block} />
                </SortableBlock>
              ))}
            </div>
          </SortableContext>

          <DragOverlay adjustScale={false}>
            {activeBlock ? (
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
                <BlockRenderer block={activeBlock} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 40px",
        gap: 16,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: "var(--accent-muted)",
          border: "1px solid rgba(108,126,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginBottom: 8,
        }}
      >
        ✦
      </div>
      <div
        style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}
      >
        Start writing
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--text-muted)",
          maxWidth: 300,
          lineHeight: 1.7,
        }}
      >
        Pick a block from the sidebar to begin building your document.
      </div>
    </div>
  );
}
