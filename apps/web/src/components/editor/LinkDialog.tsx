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
      onClick={(e) => e.stopPropagation()}
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
        padding: 6,
        display: "flex",
        gap: 6,
        alignItems: "center",
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          ref={inputRef}
          type="text"
          className="ide-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter URL…"
          style={{ width: 240 }}
        />
        <button
          type="submit"
          disabled={!url.trim()}
          className="ide-btn primary"
          style={!url.trim() ? { opacity: 0.5, cursor: "default" } : undefined}
        >
          Apply
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ide-btn"
            style={{ background: "var(--danger)", color: "#fff" }}
          >
            Remove
          </button>
        )}
        <button type="button" onClick={onCancel} className="ide-btn">
          Cancel
        </button>
      </form>
    </div>
  );
}
