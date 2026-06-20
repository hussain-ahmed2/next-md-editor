"use client";

import { useState, useRef, useEffect } from "react";

interface LinkDialogProps {
  initialUrl: string;
  position: { top: number; left: number };
  onApply: (url: string) => void;
  onRemove?: () => void;
  onCancel: () => void;
}

export function LinkDialog({ initialUrl, position, onApply, onRemove, onCancel }: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onApply(url.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
    if (e.key === "Enter" && url.trim()) {
      e.preventDefault();
      onApply(url.trim());
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
        zIndex: 10000,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-md)",
        padding: "8px 10px",
        display: "flex",
        gap: 6,
        alignItems: "center",
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter URL…"
          style={{
            padding: "4px 8px",
            fontSize: 13,
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            outline: "none",
            width: 240,
          }}
        />
        <button
          type="submit"
          disabled={!url.trim()}
          style={{
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 4,
            border: "none",
            background: url.trim() ? "var(--accent)" : "var(--bg-hover)",
            color: url.trim() ? "#fff" : "var(--text-muted)",
            cursor: url.trim() ? "pointer" : "default",
          }}
        >
          Apply
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 4,
              border: "none",
              background: "var(--danger)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
