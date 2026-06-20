"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { EMOJIS } from "@/data/emoji";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLElement | null>;
}

export function EmojiPicker({ onSelect, onClose, buttonRef }: EmojiPickerProps) {
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const pickerHeight = 260;
    const gap = 4;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const above = spaceBelow < pickerHeight && spaceAbove >= pickerHeight;
    setPosition({
      top: above ? rect.top - pickerHeight - gap : rect.bottom + gap,
      left: Math.max(8, Math.min(rect.left + rect.width / 2, window.innerWidth - 148)),
    });
    setReady(true);
  }, [buttonRef]);

  const filtered = useMemo(() => {
    if (!query) return EMOJIS;
    const q = query.toLowerCase();
    return EMOJIS.filter(
      (e) => e.name.toLowerCase().includes(q) || e.shortcode.toLowerCase().includes(q),
    );
  }, [query]);

  if (!ready) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div
        ref={pickerRef}
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          transform: "translateX(-50%)",
          zIndex: 9999,
          width: 280,
          maxHeight: 260,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emoji..."
          style={{
            padding: "8px 10px",
            border: "none",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            fontSize: 12,
            outline: "none",
            fontFamily: "var(--font-sans)",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 2,
            padding: 6,
            overflowY: "auto",
            flex: 1,
          }}
        >
          {filtered.map((e) => (
            <button
              key={e.shortcode}
              onMouseDown={(ev) => {
                ev.preventDefault();
                onSelect(e.emoji);
              }}
              title={`:${e.shortcode}:`}
              style={{
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: "transparent",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 18,
                padding: 0,
                transition: "background 0.1s ease",
              }}
              onMouseEnter={(el) => (el.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(el) => (el.currentTarget.style.background = "transparent")}
            >
              {e.emoji}
            </button>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: 12,
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 11,
              }}
            >
              No emoji found
            </div>
          )}
        </div>
      </div>
    </>
  );
}
