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
          top: -30,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: 2,
          boxShadow: "var(--shadow-md)",
          zIndex: 10,
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? "auto" : "none",
          transition: "opacity 0.15s",
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
          className="ws-icon-btn"
          style={{
            cursor: index === 0 ? "default" : "pointer",
            opacity: index === 0 ? 0.4 : 1,
          }}
        >
          <ChevronLeft size={13} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveRight();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={index === totalCount - 1}
          title="Move right"
          className="ws-icon-btn"
          style={{
            cursor: index === totalCount - 1 ? "default" : "pointer",
            opacity: index === totalCount - 1 ? 0.4 : 1,
          }}
        >
          <ChevronRight size={13} />
        </button>
        <button
          onClick={onRemove}
          onMouseDown={(e) => e.stopPropagation()}
          title="Remove"
          className="ws-icon-btn"
          style={{ color: "var(--danger)" }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
