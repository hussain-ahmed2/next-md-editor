"use client";

import { useEffect, useRef } from "react";
import { BlockRegistry } from "@next-md-editor/editor-core";

interface SlashCommandMenuProps {
  isOpen: boolean;
  position: { top: number; left: number } | null;
  searchText: string;
  selectedIndex: number;
  onSelect: (type: string, defaultProps: Record<string, unknown>) => void;
}

export function SlashCommandMenu({
  isOpen,
  position,
  searchText,
  selectedIndex,
  onSelect,
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected index
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const selectedEl = menuRef.current.children[selectedIndex + 1] as HTMLElement; // +1 to skip the "Basic Blocks" header
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen || !position) return null;

  const allBlocks = BlockRegistry.getAll();
  
  // Filter options based on searchText
  const filteredBlocks = allBlocks.filter((def) => 
    def.type.toLowerCase().includes(searchText.toLowerCase())
  );

  if (filteredBlocks.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: position.top + 24, // below the text
        left: position.left,
        zIndex: 50,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        padding: "4px",
        display: "flex",
        flexDirection: "column",
        minWidth: "180px",
        maxHeight: "300px",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "4px 8px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
        Basic Blocks
      </div>
      {filteredBlocks.map((def, index) => {
        const isSelected = index === selectedIndex;
        return (
          <button
            key={def.type}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(def.type, def.defaultProps || {});
            }}
            style={{
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: isSelected ? "var(--bg-hover)" : "transparent",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              textAlign: "left",
              color: "var(--text-primary)",
              fontSize: "14px",
              width: "100%",
            }}
            onMouseEnter={(e) => {
               // Prevent interfering with keyboard navigation heavily, but allow hover highlight
            }}
          >
            <span style={{ textTransform: "capitalize" }}>{def.type}</span>
          </button>
        );
      })}
    </div>
  );
}
