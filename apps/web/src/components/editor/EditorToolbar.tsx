"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCheck, Loader2, ListTree, Search, Sparkles } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useEditorStore } from "@next-md-editor/editor-core";
import { UndoRedoButtons } from "./toolbar/UndoRedoButtons";
import { ModeToggle } from "./toolbar/ModeToggle";
import { TemplateMenu } from "./toolbar/TemplateMenu";
import { FileActions } from "./toolbar/FileActions";
import { Divider, ToolbarButton } from "./toolbar/ToolbarButton";
import { ThemeToggle } from "./toolbar/ThemeToggle";
import { EmojiPicker } from "./EmojiPicker";
import { getDocStats } from "@/features/document-stats";
import { insertEmoji } from "@/utils/insert-emoji";
import { getDomTextOffset } from "@next-md-editor/markdown";
import { TableOfContents } from "./TableOfContents";

export function EditorToolbar() {
  const saveStatus = useUIStore((s) => s.saveStatus);
  const blocks = useEditorStore((s) => s.blocks);
  const stats = getDocStats(blocks);
  const [tocOpen, setTocOpen] = useState(false);
  const [emojiPicker, setEmojiPicker] = useState(false);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const emojiSelRef = useRef<{ el: HTMLElement; start: number; end: number } | null>(null);

  return (
    <header className="toolbar-header" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      height: 52,
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          color: "#fff",
          boxShadow: "0 2px 8px var(--accent-glow)",
        }}>M</div>
        <span className="app-name" style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          next-md-editor
        </span>
      </div>

      {/* Save Status Indicator */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "var(--text-secondary)",
        marginLeft: 16,
        marginRight: "auto",
        transition: "opacity 0.2s ease",
      }}>
        {saveStatus === "saving" && (
          <>
            <Loader2 size={13} style={{ color: "var(--warning)", animation: "spin 1s linear infinite" }} />
            <span className="save-status-label" style={{ color: "var(--text-secondary)", opacity: 0.8, fontWeight: 500 }}>Saving changes…</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <CheckCheck size={13} style={{ color: "var(--success)" }} />
            <span className="save-status-label" style={{ color: "var(--text-secondary)", opacity: 0.8, fontWeight: 500 }}>Saved to browser</span>
          </>
        )}
        {stats.words > 0 && (
          <>
            <span style={{ color: "var(--text-muted)", margin: "0 2px" }}>·</span>
            <span style={{ color: "var(--text-muted)", fontSize: 11, whiteSpace: "nowrap" }}>
              {stats.words} words · {stats.readingTime}
            </span>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <UndoRedoButtons />
        <ToolbarButton
          onClick={() => useUIStore.getState().setSearchOpen(true)}
          tooltip="Search in document (Ctrl+F)"
        >
          <Search size={14} />
        </ToolbarButton>
        <Divider />
        <TemplateMenu />
        <ToolbarButton
          onClick={() => useUIStore.getState().setAiReadmeOpen(true)}
          tooltip="Generate README with AI"
        >
          <Sparkles size={14} />
          <span className="btn-label">AI Readme</span>
        </ToolbarButton>
        <ModeToggle />
        <div style={{ position: "relative" }}>
          <ToolbarButton
            onClick={() => setTocOpen((o) => !o)}
            tooltip="Table of contents"
          >
            <ListTree size={14} />
          </ToolbarButton>
          {tocOpen && (
            <>
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 99,
                }}
                onClick={() => setTocOpen(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  zIndex: 100,
                  width: 240,
                  maxHeight: 360,
                  overflow: "auto",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <div
                  style={{
                    padding: "8px 16px 4px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Table of Contents
                </div>
                <TableOfContents onClose={() => setTocOpen(false)} />
              </div>
            </>
          )}
        </div>
        <div style={{ position: "relative", display: "flex" }}>
          <ToolbarButton
            onClick={() => {
              const ce = document.querySelector<HTMLElement>("[contenteditable]");
              if (ce) {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0 && ce.contains(sel.anchorNode as Node)) {
                  const start = getDomTextOffset(ce, sel.anchorNode!, sel.anchorOffset);
                  const end = sel.focusNode ? getDomTextOffset(ce, sel.focusNode, sel.focusOffset) : start;
                  emojiSelRef.current = { el: ce, start, end };
                }
              }
              setEmojiPicker((p) => !p);
            }}
            onMouseDown={(e) => e.preventDefault()}
            tooltip="Insert emoji"
          >
            <span ref={emojiBtnRef} style={{ fontSize: 16, lineHeight: 1 }}>😊</span>
          </ToolbarButton>
          {emojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => {
                const saved = emojiSelRef.current;
                if (saved) {
                  const { el, start } = saved;
                  const range = document.createRange();
                  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                  let pos = 0;
                  let node: Node | null;
                  let targetNode: Node | null = null;
                  let targetOffset = 0;
                  while ((node = walker.nextNode())) {
                    const len = node.textContent?.length ?? 0;
                    if (pos + len >= start) {
                      targetNode = node;
                      targetOffset = start - pos;
                      break;
                    }
                    pos += len;
                  }
                  if (targetNode) {
                    range.setStart(targetNode, targetOffset);
                    range.collapse(true);
                    const sel = window.getSelection();
                    if (sel) {
                      sel.removeAllRanges();
                      sel.addRange(range);
                    }
                    document.execCommand("insertText", false, emoji);
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                  }
                } else {
                  insertEmoji(emoji);
                }
                setEmojiPicker(false);
              }}
              onClose={() => setEmojiPicker(false)}
              buttonRef={emojiBtnRef}
            />
          )}
        </div>
        <ThemeToggle />
        <FileActions />
      </div>
    </header>
  );
}
