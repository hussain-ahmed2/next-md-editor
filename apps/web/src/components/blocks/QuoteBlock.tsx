"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts, htmlToMarkdown } from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";

export function QuoteBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const text = (block.props.text as string) ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // If isEditing goes true, focus and move caret to the end
  useEffect(() => {
    if (isEditing && editorRef.current) {
      const el = editorRef.current;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isEditing]);

  return (
    <div style={{
      display: "flex",
      gap: 14,
      padding: "0 16px",
      borderRadius: "0",
      background: "transparent",
    }}>
      <div style={{
        width: 4,
        borderRadius: 0,
        background: "#30363d",
        flexShrink: 0,
        alignSelf: "stretch",
      }} />
      {!isEditing ? (
        <div
          onClick={() => {
            setIsEditing(true);
            selectBlock(block.id);
          }}
          style={{
            flex: 1,
            fontSize: "15px",
            lineHeight: 1.6,
            color: text ? "#8b949e" : "rgba(255, 255, 255, 0.25)",
            fontStyle: "normal",
            outline: "none",
            minHeight: "1.6em",
            cursor: "text",
          }}
          dangerouslySetInnerHTML={{
            __html: renderInlineMarkdown(text) || "Empty blockquote"
          }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            updateBlock(block.id, { text: htmlToMarkdown(e.currentTarget.innerHTML) });
            setIsEditing(false);
          }}
          onKeyDown={(e) => handleEditorKeyboardShortcuts(e, block.id, updateBlock)}
          style={{
            flex: 1,
            fontSize: "15px",
            lineHeight: 1.6,
            color: "#8b949e",
            fontStyle: "normal",
            outline: "none",
            minHeight: "1.6em",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
