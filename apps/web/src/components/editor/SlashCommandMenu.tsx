"use client";

import { useEffect, useRef } from "react";

export interface SlashMenuItem {
  type: string;
  label: string;
  defaultProps: Record<string, unknown>;
}

interface SlashCommandMenuProps {
  position: { top: number; left: number };
  items: SlashMenuItem[];
  selectedIndex: number;
  onSelect: (item: SlashMenuItem) => void;
}

/** Presentational dropdown for the Lexical SlashCommandPlugin. */
export function SlashCommandMenu({
  position,
  items,
  selectedIndex,
  onSelect,
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Keep the selected row in view while arrowing through
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const selectedEl = menu.children[selectedIndex + 1] as HTMLElement | undefined; // +1 skips the header
    selectedEl?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: position.top + 6,
        left: position.left,
        zIndex: 60,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        padding: 4,
        display: "flex",
        flexDirection: "column",
        minWidth: 200,
        maxHeight: 280,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          padding: "4px 8px",
          fontSize: 11,
          color: "var(--text-muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Insert block
      </div>
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <button
            key={item.type}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item);
            }}
            style={{
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              borderRadius: "var(--radius-sm)",
              background: isSelected ? "var(--accent-muted)" : "transparent",
              color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
