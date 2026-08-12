"use client";

import React from "react";
import { LayoutGrid, Plus } from "lucide-react";

interface ImageGridControlsProps {
  cols: number;
  onUpdateCols: (cols: number) => void;
  onAddImage: () => void;
}

export function ImageGridControls({
  cols,
  onUpdateCols,
  onAddImage,
}: ImageGridControlsProps) {
  return (
    <div
      contentEditable={false}
      className="image-grid-controls"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 8px",
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="image-grid-title-wrapper"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        <LayoutGrid size={13} style={{ color: "var(--text-muted)" }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Image Grid
        </span>
      </div>

      <div
        className="image-grid-actions"
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        {/* Custom Column Stepper */}
        <div
          className="image-grid-cols-wrapper"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Cols
          </span>
          <input
            type="number"
            min={1}
            max={8}
            value={cols}
            onChange={(e) => {
              const val = Math.max(
                1,
                Math.min(8, parseInt(e.target.value) || 2),
              );
              onUpdateCols(val);
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="ide-input"
            style={{ width: 48, height: 24, fontSize: 12, textAlign: "center", padding: "0 4px" }}
          />
        </div>

        <button
          className="image-grid-add-btn ide-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddImage();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ transition: "background 0.1s, color 0.1s" }}
        >
          <Plus size={13} /> Add Image
        </button>
      </div>
    </div>
  );
}
