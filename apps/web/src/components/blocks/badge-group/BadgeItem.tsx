"use client";

import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Badge, buildShieldsUrl } from "./constants";

interface BadgeItemProps {
  badge: Badge;
  index: number;
  totalCount: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRemove: (e: React.MouseEvent) => void;
}

export function BadgeItem({
  badge,
  index,
  totalCount,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onMoveLeft,
  onMoveRight,
  onRemove,
}: BadgeItemProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        borderRadius: 4,
        padding: "2px",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={badge.url || buildShieldsUrl(badge)}
        alt={badge.text}
        style={{ height: 28, cursor: "default" }}
      />

      {/* Hover actions */}
      <div
        style={{
          position: "absolute",
          top: -24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: "2px 4px",
          boxShadow: "var(--shadow-md)",
          zIndex: 10,
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? "auto" : "none",
          transition: "opacity 0.15s ease",
        }}
      >
        {/* Invisible bridge to prevent mouse leave on gap */}
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            height: 8,
            background: "transparent",
          }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveLeft();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={index === 0}
          title="Move left"
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            border: "1px solid var(--border)",
            background: "var(--bg-surface)",
            color: "var(--text-muted)",
            cursor: index === 0 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            opacity: index === 0 ? 0.3 : 1,
          }}
        >
          <ChevronLeft size={10} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveRight();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={index === totalCount - 1}
          title="Move right"
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            border: "1px solid var(--border)",
            background: "var(--bg-surface)",
            color: "var(--text-muted)",
            cursor: index === totalCount - 1 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            opacity: index === totalCount - 1 ? 0.3 : 1,
          }}
        >
          <ChevronRight size={10} />
        </button>
        <button
          onClick={onRemove}
          onMouseDown={(e) => e.stopPropagation()}
          title="Remove"
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            border: "1px solid var(--danger-border)",
            background: "var(--danger-muted)",
            color: "var(--danger)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <Trash2 size={9} />
        </button>
      </div>
    </div>
  );
}
