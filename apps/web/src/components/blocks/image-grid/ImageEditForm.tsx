"use client";

import React from "react";

interface ImageEditFormProps {
  inputUrl: string;
  setInputUrl: (url: string) => void;
  inputAlt: string;
  setInputAlt: (alt: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * Premium keyboard helper for input fields to support Ctrl+B / Ctrl+I text wrapping.
 */
function handleInputShortcuts(
  e: React.KeyboardEvent<HTMLInputElement>,
  value: string,
  onChange: (newValue: string) => void,
) {
  const hasMeta = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();

  if (hasMeta && (key === "i" || key === "b")) {
    e.preventDefault();
    e.stopPropagation();

    const input = e.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;

    const selected = value.substring(start, end);
    const wrapper = key === "b" ? "**" : "_";

    let newSelected = "";
    if (selected.startsWith(wrapper) && selected.endsWith(wrapper)) {
      newSelected = selected.slice(wrapper.length, -wrapper.length);
    } else {
      newSelected = `${wrapper}${selected}${wrapper}`;
    }

    const newValue =
      value.substring(0, start) + newSelected + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      input.focus();
      const offset = wrapper.length;
      if (selected.startsWith(wrapper) && selected.endsWith(wrapper)) {
        input.setSelectionRange(start, end - offset * 2);
      } else {
        input.setSelectionRange(start, end + offset * 2);
      }
    }, 0);
  }
}

export function ImageEditForm({
  inputUrl,
  setInputUrl,
  inputAlt,
  setInputAlt,
  onCancel,
  onSave,
}: ImageEditFormProps) {
  return (
    <div
      contentEditable={false}
      style={{
        padding: "12px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "var(--bg-surface)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Image URL
        </label>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="https://example.com/image.png"
          className="ide-input"
          style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Alt Text
        </label>
        <input
          type="text"
          value={inputAlt}
          onChange={(e) => setInputAlt(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            handleInputShortcuts(e, inputAlt, setInputAlt);
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Image description..."
          className="ide-input"
          style={{ fontSize: 12 }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="ide-btn"
        >
          Cancel
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="ide-btn primary"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
