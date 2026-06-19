"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts } from "@/utils/editorShortcuts";
import { Plus, Award } from "lucide-react";
import { Badge, TechItem } from "./badge-group/constants";
import { BadgePicker } from "./badge-group/BadgePicker";
import { BadgeItem } from "./badge-group/BadgeItem";
import { useBlockFocus } from "@/hooks/useBlockFocus";

export function BadgeGroupBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);


  const badges = (block.props.badges as Badge[]) ?? [];
  const alignment = (block.props.alignment as "left" | "center" | "right") ?? "left";

  const [showPicker, setShowPicker] = useState(false);
  const [hoveredBadgeId, setHoveredBadgeId] = useState<string | null>(null);

  const pickerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useBlockFocus(ref, block.id, selectedBlockIds);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPicker]);

  const handleAddPresetBadge = (tech: TechItem) => {
    const newBadge: Badge = {
      id: Math.random().toString(36).substring(7),
      text: tech.text,
      color: tech.color,
      logo: tech.logo,
    };
    updateBlock(block.id, {
      badges: [...badges, newBadge],
      alignment,
    });
    setShowPicker(false);
  };

  const handleCreateCustomBadge = (customBadge: Omit<Badge, "id">) => {
    const newBadge: Badge = {
      ...customBadge,
      id: Math.random().toString(36).substring(7),
    };
    updateBlock(block.id, {
      badges: [...badges, newBadge],
      alignment,
    });
    setShowPicker(false);
  };

  const handleRemoveBadge = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = badges.filter((b) => b.id !== id);
    updateBlock(block.id, {
      badges: filtered,
      alignment,
    });
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...badges];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updateBlock(block.id, { badges: updated, alignment });
  };

  const handleMoveDown = (index: number) => {
    if (index >= badges.length - 1) return;
    const updated = [...badges];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updateBlock(block.id, { badges: updated, alignment });
  };

  const toggleAlignment = () => {
    const next = alignment === "left" ? "center" : alignment === "center" ? "right" : "left";
    updateBlock(block.id, { badges, alignment: next });
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setShowPicker(false);
        }
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
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Control panel bar */}
      <div
        contentEditable={false}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "4px 8px",
          padding: "6px 8px",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Award size={14} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>
            BADGE GROUP
          </span>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {badges.length} badges
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleAlignment();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title={`Alignment: ${alignment}`}
            style={{
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              cursor: "pointer",
              textTransform: "uppercase",
              minWidth: 60,
              textAlign: "center",
            }}
          >
            {alignment}
          </button>

          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPicker(!showPicker);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Plus size={11} /> Add Badge
            </button>

            {/* Icon Picker Popover */}
            {showPicker && (
              <BadgePicker
                onAddPreset={handleAddPresetBadge}
                onCreateCustom={handleCreateCustomBadge}
                pickerRef={pickerRef}
              />
            )}
          </div>
        </div>
      </div>

      {/* Badge display container */}
      <div
        contentEditable={false}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          width: "100%",
          justifyContent:
            alignment === "center"
              ? "center"
              : alignment === "right"
                ? "flex-end"
                : "flex-start",
        }}
      >
        {badges.map((badge, index) => (
          <BadgeItem
            key={badge.id}
            badge={badge}
            index={index}
            totalCount={badges.length}
            isHovered={hoveredBadgeId === badge.id}
            onMouseEnter={() => setHoveredBadgeId(badge.id)}
            onMouseLeave={() => setHoveredBadgeId(null)}
            onMoveLeft={() => handleMoveUp(index)}
            onMoveRight={() => handleMoveDown(index)}
            onRemove={(e) => handleRemoveBadge(badge.id, e)}
          />
        ))}
      </div>
    </div>
  );
}
