"use client";

import { useState, useRef } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts } from "@/utils/editorShortcuts";
import { useBlockFocus } from "@/hooks/useBlockFocus";
import { X, Plus, UserPlus } from "lucide-react";

export function ContributorsBlock({ block }: { block: Block }) {
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const usernames = (block.props.usernames as string[]) ?? [];
  const avatarSize = (block.props.avatarSize as number) ?? 48;

  const [inputVal, setInputVal] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useBlockFocus(ref, block.id, selectedBlockIds);

  const handleAddUsername = () => {
    const trimmed = inputVal.trim().replace(/^@/, "");
    if (!trimmed || usernames.includes(trimmed)) return;
    updateBlock(block.id, {
      usernames: [...usernames, trimmed],
      avatarSize,
    });
    setInputVal("");
  };

  const handleRemoveUsername = (u: string) => {
    updateBlock(block.id, {
      usernames: usernames.filter((name) => name !== u),
      avatarSize,
    });
  };

  const handleUpdateSize = (size: number) => {
    updateBlock(block.id, {
      usernames,
      avatarSize: size,
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
          useEditorStore.getState().blocks,
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
          <UserPlus size={14} color="var(--text-muted)" />
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              Add GitHub User:
            </span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddUsername();
                }
              }}
              className="ide-input"
              style={{ flex: 1, maxWidth: 200 }}
              placeholder="torvalds"
            />
            <button
              onClick={handleAddUsername}
              disabled={!inputVal.trim()}
              className="ide-btn primary"
              style={{
                width: 26,
                padding: 0,
                cursor: inputVal.trim() ? "pointer" : "not-allowed",
                opacity: inputVal.trim() ? 1 : 0.5,
              }}
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div style={{ width: 1, height: 16, background: "var(--border)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>
            Size:
          </span>
          <select
            value={avatarSize}
            onChange={(e) => handleUpdateSize(Number(e.target.value))}
            className="ide-select"
          >
            <option value={32}>Small (32px)</option>
            <option value={48}>Medium (48px)</option>
            <option value={64}>Large (64px)</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div
        contentEditable={false}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          minHeight: 48,
        }}
      >
        {usernames.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", padding: "8px 0" }}>
            No contributors added yet. Type a GitHub username above to add one.
          </div>
        )}
        {usernames.map((u) => (
          <div
            key={u}
            style={{
              position: "relative",
              width: avatarSize,
              height: avatarSize,
              borderRadius: "50%",
              border: "2px solid var(--bg-surface)",
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://github.com/${u}.png?size=${avatarSize * 2}`}
              alt={u}
              title={u}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
                display: "block",
              }}
            />
            <button
              onClick={() => handleRemoveUsername(u)}
              style={{
                position: "absolute",
                top: -4,
                right: -4,
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
              }}
              title="Remove"
            >
              <X size={10} strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
