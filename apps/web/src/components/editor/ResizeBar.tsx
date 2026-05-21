"use client";

import { GripVertical } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

interface ResizeBarProps {
  pane: "sidebar" | "preview";
}

export function ResizeBar({ pane }: ResizeBarProps) {
  const isResizing = useUIStore((s) =>
    pane === "sidebar" ? s.isResizingSidebar : s.isResizingPreview
  );
  const onMouseDown = useUIStore((s) =>
    pane === "sidebar" ? s.startResizeSidebar : s.startResizePreview
  );

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: 8,
        cursor: "col-resize",
        background: isResizing ? "var(--accent-muted)" : "transparent",
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
        if (!isResizing) {
          e.currentTarget.style.background = "var(--bg-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isResizing) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <div
        style={{
          color: "var(--text-muted)",
          opacity: isResizing ? 1 : 0.5,
          pointerEvents: "none",
        }}
      >
        <GripVertical size={12} />
      </div>
    </div>
  );
}
