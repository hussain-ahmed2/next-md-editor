"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { BlockRegistry } from "@next-md-editor/editor-core";
import { v4 as uuidv4 } from "uuid";
import { useDraggable } from "@dnd-kit/core";
import {
  Heading,
  Text,
  Quote,
  Code2,
  Minus,
  Image,
  Table,
  Lightbulb,
} from "lucide-react";

interface SidebarBlock {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const BLOCK_PALETTE: SidebarBlock[] = [
  { type: "heading",   label: "Heading",   icon: <Heading size={14} />,    description: "Section title" },
  { type: "paragraph", label: "Paragraph", icon: <Text size={14} />,       description: "Body text" },
  { type: "quote",     label: "Quote",     icon: <Quote size={14} />,      description: "Blockquote" },
  { type: "code",      label: "Code",      icon: <Code2 size={14} />,      description: "Code block" },
  { type: "divider",   label: "Divider",   icon: <Minus size={14} />,      description: "Horizontal rule" },
  { type: "image",     label: "Image",     icon: <Image size={14} />,      description: "Insert an image" },
  { type: "table",     label: "Table",     icon: <Table size={14} />,      description: "Visual GFM grid table" },
  { type: "callout",   label: "Callout",   icon: <Lightbulb size={14} />,  description: "Pastel alert callout box" },
];

function DraggableSidebarItem({ b, handleAdd }: { b: SidebarBlock, handleAdd: (type: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${b.type}`,
    data: {
      isSidebarItem: true,
      type: b.type,
      label: b.label,
    },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => handleAdd(b.type)}
      title={b.description}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid transparent",
        background: "transparent",
        color: "var(--text-secondary)",
        cursor: isDragging ? "grabbing" : "grab",
        fontSize: 13,
        fontWeight: 500,
        transition: "all 0.15s ease",
        textAlign: "left",
        opacity: isDragging ? 0.5 : 1,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.background = "var(--bg-hover)";
        el.style.borderColor = "var(--border)";
        el.style.color = "var(--text-primary)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.background = "transparent";
        el.style.borderColor = "transparent";
        el.style.color = "var(--text-secondary)";
      }}
    >
      <span style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-sm)",
        background: "var(--accent-muted)",
        color: "var(--accent)",
        flexShrink: 0,
      }}>
        {b.icon}
      </span>
      <div>
        <div style={{ lineHeight: 1.3 }}>{b.label}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>{b.description}</div>
      </div>
    </button>
  );
}

export function EditorSidebar({ width = 220 }: { width?: number }) {
  const addBlock = useEditorStore((s) => s.addBlock);

  const handleAdd = (type: string) => {
    const def = BlockRegistry.get(type);
    addBlock({
      id: uuidv4(),
      type,
      props: { ...(def?.defaultProps ?? {}) },
    });
  };

  return (
    <aside style={{
      width,
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      padding: "12px 8px",
      gap: 4,
      overflowY: "auto",
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        padding: "4px 8px 8px",
      }}>
        Blocks
      </div>
      {BLOCK_PALETTE.map((b) => (
        <DraggableSidebarItem key={b.type} b={b} handleAdd={handleAdd} />
      ))}
    </aside>
  );
}
