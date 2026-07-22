"use client";

import { useRef } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts } from "@/utils/editorShortcuts";
import { useBlockFocus } from "@/hooks/useBlockFocus";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export interface RoadmapItem {
  id: string;
  text: string;
  completed: boolean;
}

export function RoadmapBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const items = (block.props.items as RoadmapItem[]) ?? [];

  const ref = useRef<HTMLDivElement>(null);
  useBlockFocus(ref, block.id, selectedBlockIds);

  const handleUpdateItem = (id: string, updates: Partial<RoadmapItem>) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    updateBlock(block.id, { items: newItems });
  };

  const handleAddItem = () => {
    updateBlock(block.id, {
      items: [...items, { id: uuidv4(), text: "", completed: false }],
    });
  };

  const handleRemoveItem = (id: string) => {
    updateBlock(block.id, {
      items: items.filter((item) => item.id !== id),
    });
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={(e) => {
        handleEditorKeyboardShortcuts(
          e,
          block,
          blocks,
          selectedBlockIds,
          addBlock,
          removeBlocks,
          updateBlock,
          selectBlock,
        );
      }}
      style={{
        outline: "none",
        width: "100%",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "12px",
      }}
    >
      <div style={{ marginBottom: 16, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
        Project Roadmap
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "var(--bg-base)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ cursor: "grab", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <GripVertical size={16} />
            </div>
            
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(e) => handleUpdateItem(item.id, { completed: e.target.checked })}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }}
            />
            
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleUpdateItem(item.id, { text: e.target.value })}
              placeholder="Task description..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                color: item.completed ? "var(--text-muted)" : "var(--text-primary)",
                textDecoration: item.completed ? "line-through" : "none",
              }}
            />

            <button
              onClick={() => handleRemoveItem(item.id)}
              className="ide-btn"
              style={{ width: 26, padding: 0 }}
              title="Remove task"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddItem}
        className="ide-btn"
        style={{
          marginTop: 12,
          width: "100%",
          height: 28,
          border: "1px dashed var(--border)",
        }}
      >
        <Plus size={14} /> Add Task
      </button>
    </div>
  );
}
