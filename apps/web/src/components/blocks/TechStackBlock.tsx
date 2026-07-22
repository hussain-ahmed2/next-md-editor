"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts } from "@/utils/editorShortcuts";
import { useBlockFocus } from "@/hooks/useBlockFocus";
import { X, LayoutTemplate, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { TECH_DICTIONARY } from "@/constants/techStack";

export function TechStackBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const techs = (block.props.techs as typeof TECH_DICTIONARY) ?? [];
  const alignment = (block.props.alignment as string) ?? "left";

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useBlockFocus(ref, block.id, selectedBlockIds);

  const filteredTech = useMemo(() => {
    if (!search.trim()) return TECH_DICTIONARY;
    const lower = search.toLowerCase();
    return TECH_DICTIONARY.filter(
      (t) => t.name.toLowerCase().includes(lower) || t.id.includes(lower)
    );
  }, [search]);

  const handleAddTech = (tech: typeof TECH_DICTIONARY[0]) => {
    if (techs.find((t) => t.id === tech.id)) return;
    updateBlock(block.id, {
      techs: [...techs, tech],
      alignment,
    });
    setSearch("");
    setShowDropdown(false);
  };

  const handleRemoveTech = (id: string) => {
    updateBlock(block.id, {
      techs: techs.filter((t) => t.id !== id),
      alignment,
    });
  };

  const handleUpdateAlignment = (align: string) => {
    updateBlock(block.id, {
      techs,
      alignment: align,
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [showDropdown]);

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
        padding: "12px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Controls */}
      <div
        contentEditable={false}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "4px 8px",
          background: "var(--bg-base)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-subtle)",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <LayoutTemplate size={14} color="var(--text-muted)" />
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, position: "relative" }} ref={dropdownRef}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              Add Tech:
            </span>
            <input
              type="text"
              value={search}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              className="ide-input"
              style={{ flex: 1, maxWidth: 240 }}
              placeholder="Search e.g. React..."
            />
            {showDropdown && (
              <div
                className="ide-menu"
                style={{
                  left: 60,
                  marginTop: 4,
                  width: 240,
                  maxHeight: 200,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {filteredTech.length === 0 ? (
                  <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-muted)" }}>
                    No exact match found in curated list.
                  </div>
                ) : (
                  filteredTech.map((tech) => (
                    <button
                      key={tech.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddTech(tech);
                      }}
                      className="ide-menu-item"
                    >
                      <img
                        src={`https://img.shields.io/badge/-${tech.color}?style=flat&logo=${tech.logo}&logoColor=white`}
                        alt={tech.name}
                        style={{ height: 16 }}
                      />
                      {tech.name}
                    </button>
                  ))
                )}
                {search.trim() && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const slug = search.trim().toLowerCase().replace(/\s+/g, '-');
                      const logo = search.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                      handleAddTech({
                        id: `custom-${slug}`,
                        name: search.trim(),
                        color: "000000",
                        logo: logo,
                      });
                    }}
                    style={{
                      padding: "5px 10px",
                      background: "transparent",
                      border: "none",
                      borderTop: "1px solid var(--border-subtle)",
                      marginTop: 4,
                      textAlign: "left",
                      fontSize: 12,
                      color: "var(--accent)",
                      cursor: "pointer",
                      borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    + Add custom &quot;{search.trim()}&quot; badge
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ width: 1, height: 16, background: "var(--border)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button
            onClick={() => handleUpdateAlignment("left")}
            className={alignment === "left" ? "ide-btn active" : "ide-btn"}
            style={{ width: 26, padding: 0 }}
            title="Align Left"
          >
            <AlignLeft size={15} />
          </button>
          <button
            onClick={() => handleUpdateAlignment("center")}
            className={alignment === "center" ? "ide-btn active" : "ide-btn"}
            style={{ width: 26, padding: 0 }}
            title="Align Center"
          >
            <AlignCenter size={15} />
          </button>
          <button
            onClick={() => handleUpdateAlignment("right")}
            className={alignment === "right" ? "ide-btn active" : "ide-btn"}
            style={{ width: 26, padding: 0 }}
            title="Align Right"
          >
            <AlignRight size={15} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        contentEditable={false}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          minHeight: 32,
          justifyContent: alignment === "center" ? "center" : "flex-start",
        }}
      >
        {techs.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", padding: "8px 0" }}>
            No technologies added yet. Search and add some above.
          </div>
        )}
        {techs.map((tech) => {
          return (
            <div
              key={tech.id}
              style={{
                position: "relative",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget.querySelector("button");
                if (btn) btn.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget.querySelector("button");
                if (btn) btn.style.opacity = "0";
              }}
            >
              <img
                src={`https://img.shields.io/badge/${encodeURIComponent(tech.name.replace(/-/g, "--"))}-${tech.color}?style=for-the-badge&logo=${tech.logo}&logoColor=white`}
                alt={tech.name}
                style={{
                  display: "block",
                  height: 28,
                }}
              />
              <button
                onClick={() => handleRemoveTech(tech.id)}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  background: "var(--danger)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  opacity: 0,
                  transition: "opacity 0.15s ease",
                  zIndex: 10,
                }}
                title="Remove"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
