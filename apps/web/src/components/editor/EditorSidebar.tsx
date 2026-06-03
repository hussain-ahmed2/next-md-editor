"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { BlockRegistry } from "@next-md-editor/editor-core";
import { v4 as uuidv4 } from "uuid";
import { useDraggable } from "@dnd-kit/react";
import {
  Heading,
  Text,
  Quote,
  Code2,
  Minus,
  Image,
  Table,
  Lightbulb,
  List,
  ListOrdered,
  LayoutGrid,
  Award,
} from "lucide-react";

interface SidebarBlock {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const BLOCK_PALETTE: SidebarBlock[] = [
  {
    type: "heading",
    label: "Heading",
    icon: <Heading size={14} />,
    description: "Section title",
  },
  {
    type: "paragraph",
    label: "Paragraph",
    icon: <Text size={14} />,
    description: "Body text",
  },
  {
    type: "quote",
    label: "Quote",
    icon: <Quote size={14} />,
    description: "Blockquote",
  },
  {
    type: "code",
    label: "Code",
    icon: <Code2 size={14} />,
    description: "Code block",
  },
  {
    type: "divider",
    label: "Divider",
    icon: <Minus size={14} />,
    description: "Horizontal rule",
  },
  {
    type: "image",
    label: "Image",
    icon: <Image size={14} />,
    description: "Insert an image",
  },
  {
    type: "image-grid",
    label: "Image Grid",
    icon: <LayoutGrid size={14} />,
    description: "Responsive grid table of images",
  },
  {
    type: "table",
    label: "Table",
    icon: <Table size={14} />,
    description: "Visual GFM grid table",
  },
  {
    type: "callout",
    label: "Callout",
    icon: <Lightbulb size={14} />,
    description: "Pastel alert callout box",
  },
  {
    type: "bullet-list",
    label: "Bullet List",
    icon: <List size={14} />,
    description: "Rich text bullet list block",
  },
  {
    type: "numbered-list",
    label: "Numbered List",
    icon: <ListOrdered size={14} />,
    description: "Rich text numbered list block",
  },
  {
    type: "badge-group",
    label: "Badge Group",
    icon: <Award size={14} />,
    description: "Tech stack badges with shields.io style",
  },
];

function DraggableSidebarItem({
  b,
  handleAdd,
}: {
  b: SidebarBlock;
  handleAdd: (type: string) => void;
}) {
  // New API: useDraggable from @dnd-kit/react.
  // ref → registers the element; no separate listeners/attributes needed.
  // The PointerSensor bound on the DragDropProvider activates on pointer-down.
  const { ref, isDragging } = useDraggable({
    id: `sidebar-${b.type}`,
    data: {
      isSidebarItem: true,
      type: b.type,
      label: b.label,
    },
  });

  return (
    <div
      ref={ref}
      onClick={() => handleAdd(b.type)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleAdd(b.type);
        }
      }}
      title={b.description}
      role="button"
      tabIndex={0}
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
        outline: "none",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = "var(--bg-hover)";
        el.style.borderColor = "var(--border)";
        el.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = "transparent";
        el.style.borderColor = "transparent";
        el.style.color = "var(--text-secondary)";
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-sm)",
          background: "var(--accent-muted)",
          color: "var(--accent)",
          flexShrink: 0,
        }}
      >
        {b.icon}
      </span>
      <div>
        <div style={{ lineHeight: 1.3 }}>{b.label}</div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            lineHeight: 1.3,
          }}
        >
          {b.description}
        </div>
      </div>
    </div>
  );
}

import { useUIStore } from "@/store/uiStore";

export function EditorSidebar() {
  const addBlock = useEditorStore((s) => s.addBlock);
  const isMobile = useUIStore((s) => s.isMobile);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const setMobileTab = useUIStore((s) => s.setMobileTab);

  const handleAdd = (type: string) => {
    const def = BlockRegistry.get(type);
    addBlock({
      id: uuidv4(),
      type,
      props: { ...(def?.defaultProps ?? {}) },
    });
    if (isMobile) {
      setMobileTab("editor");
    }
  };

  const width = isMobile ? undefined : (sidebarWidth ?? 220);

  return (
    <aside
      style={{
        width: width ?? "100%",
        flex: width === undefined ? 1 : undefined,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        padding: "12px 8px",
        gap: 4,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          padding: "4px 8px 8px",
        }}
      >
        Blocks
      </div>
      {BLOCK_PALETTE.map((b) => (
        <DraggableSidebarItem key={b.type} b={b} handleAdd={handleAdd} />
      ))}
    </aside>
  );
}
