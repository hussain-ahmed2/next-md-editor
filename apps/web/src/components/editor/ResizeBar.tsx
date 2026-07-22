"use client";

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

  // 8px invisible hit area (negative margins overlap both panes) with a
  // 2px visible highlight strip — the JetBrains splitter pattern.
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: 8,
        margin: "0 -4px",
        flexShrink: 0,
        cursor: "col-resize",
        zIndex: 10,
        alignSelf: "stretch",
        display: "flex",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        const strip = e.currentTarget.firstElementChild as HTMLElement | null;
        if (strip && !isResizing) strip.style.background = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        const strip = e.currentTarget.firstElementChild as HTMLElement | null;
        if (strip && !isResizing) strip.style.background = "transparent";
      }}
    >
      <div
        style={{
          width: 2,
          background: isResizing ? "var(--accent)" : "transparent",
          transition: "background-color 0.1s",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
