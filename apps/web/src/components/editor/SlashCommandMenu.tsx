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
      className="ide-menu"
      style={{
        position: "absolute",
        top: position.top + 6,
        left: position.left,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        minWidth: 200,
        maxHeight: 280,
        overflowY: "auto",
      }}
    >
      <div className="ide-menu-label">Insert block</div>
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <button
            key={item.type}
            className="ide-menu-item"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item);
            }}
            style={isSelected ? { background: "var(--accent)", color: "#fff" } : undefined}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
