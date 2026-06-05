"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import type { GridImage } from "./types";

interface ImageGridItemProps {
  img: GridImage;
  showCaptions: boolean;
  onStartEdit: (img: GridImage, e: React.MouseEvent) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
}

export function ImageGridItem({
  img,
  showCaptions,
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
        background: "rgba(255,255,255,0.01)",
        display: "flex",
        flexDirection: "column",
        aspectRatio: showCaptions ? undefined : "16/10",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: showCaptions ? "16/10" : "100%",
          height: showCaptions ? undefined : "100%",
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
            background: "rgba(10, 10, 10, 0.4)",
            opacity: 0,
            transition: "opacity 0.2s ease",
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
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "#161b22",
              color: "#c9d1d9",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={(e) => onRemove(img.id, e)}
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid rgba(255,100,100,0.2)",
              background: "rgba(248, 81, 73, 0.15)",
              color: "#ff7b72",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Trash2 size={10} /> Delete
          </button>
        </div>
      </div>

      {/* Bottom Caption Label Text */}
      {showCaptions && (
        <div
          style={{
            padding: "8px 10px",
            background: "var(--bg-elevated)",
            borderTop: "1px solid var(--border-subtle)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {img.alt || "Untitled Image"}
        </div>
      )}
    </div>
  );
}
