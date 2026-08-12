"use client";

import React from "react";
import { Trash2, Edit2 } from "lucide-react";
import type { GridImage } from "./types";

interface ImageGridItemProps {
  img: GridImage;
  onStartEdit: (img: GridImage, e: React.MouseEvent) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
}

export function ImageGridItem({
  img,
  onStartEdit,
  onRemove,
}: ImageGridItemProps) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
        background: "var(--bg-surface)",
        display: "flex",
        flexDirection: "column",
        aspectRatio: "16/10",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt={img.alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* Hover actions menu bar */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            opacity: 0,
            transition: "opacity 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
        >
          <button
            onClick={(e) => onStartEdit(img, e)}
            style={{
              height: 24,
              padding: "0 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Edit2 size={13} /> Edit
          </button>
          <button
            onClick={(e) => onRemove(img.id, e)}
            style={{
              height: 24,
              padding: "0 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--danger-border)",
              background: "var(--danger-muted)",
              color: "var(--danger)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>


    </div>
  );
}
