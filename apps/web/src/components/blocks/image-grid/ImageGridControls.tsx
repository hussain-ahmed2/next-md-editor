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
        background: "var(--bg-elevated)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="image-grid-title-wrapper"
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <LayoutGrid size={14} style={{ color: "var(--accent)" }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          IMAGE GRID
        </span>
      </div>

      <div
        className="image-grid-actions"
        style={{ display: "flex", alignItems: "center", gap: 16 }}
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
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            COLS:
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
            style={{
              width: 48,
              padding: "2px 6px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 4,
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              textAlign: "center",
              outline: "none",
            }}
          />
        </div>

        <button
          className="image-grid-add-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddImage();
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
          <Plus size={11} /> Add Image
        </button>
      </div>
    </div>
  );
}
