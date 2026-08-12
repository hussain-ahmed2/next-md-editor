"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FOCUS_COMMAND,
  BLUR_COMMAND,
} from "lexical";
import { COMMAND_PRIORITY_LOW } from "lexical";
import { $isLinkNode } from "@lexical/link";
import { Sparkles, Smile, Bold, Italic, Code, Strikethrough, Link as LinkIcon } from "lucide-react";
import { LinkDialog } from "../LinkDialog";
import { EmojiPicker } from "../EmojiPicker";

import { BlockAiDialog, TEXT_BLOCK_TYPES } from "../BlockAiDialog";
import { useEditorStore } from "@next-md-editor/editor-core";

type FormatAction = "bold" | "italic" | "code" | "strikethrough" | "link";

export function FloatingToolbarPlugin({ blockId }: { blockId: string }) {
  const [editor] = useLexicalComposerContext();
  const b = useEditorStore.getState().blocks.find(bl => bl.id === blockId);
  const isTextBlock = b && TEXT_BLOCK_TYPES.has(b.type);

  const isFocused = useEditorStore((s) => s.selectedBlockIds.includes(blockId));
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  const [linkDialog, setLinkDialog] = useState<{ url: string } | null>(null);
  const [linkPos, setLinkPos] = useState<{ top: number; left: number } | null>(null);
  const [emojiPicker, setEmojiPicker] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We must track if THIS specific editor has focus, because blocks like Tables have multiple Lexical instances
    const unregisterFocus = editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        setIsEditorFocused(true);
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    const unregisterBlur = editor.registerCommand(
      BLUR_COMMAND,
      () => {
        setIsEditorFocused(false);
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    // Initial state check in case it's already focused
    editor.getEditorState().read(() => {
      if (editor.getRootElement() === document.activeElement) {
        setIsEditorFocused(true);
      }
    });
    return () => {
      unregisterFocus();
      unregisterBlur();
    };
  }, [editor]);

  useEffect(() => {
    if (linkDialog) {
      const tr = toolbarRef.current?.getBoundingClientRect();
      const pos = tr
        ? { top: tr.bottom + 4, left: tr.left + tr.width / 2 }
        : { top: 80, left: window.innerWidth / 2 };
      setLinkPos(pos);
    } else {
      setLinkPos(null);
    }
  }, [linkDialog]);

  const updateFormats = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        let isLink = false;
        const node = selection.anchor.getNode();
        const parent = node.getParent();
        if ($isLinkNode(parent) || $isLinkNode(node)) {
          isLink = true;
        }

        setActiveFormats({
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          strikethrough: selection.hasFormat("strikethrough"),
          code: selection.hasFormat("code"),
          link: isLink,
        });
      }
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateFormats();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateFormats]);

  const apply = useCallback(
    (action: FormatAction) => {
      if (action === "link") {
        editor.getEditorState().read(() => {
          let url = "https://";
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            const parent = node.getParent();
            if ($isLinkNode(parent)) {
              url = parent.getURL();
            } else if ($isLinkNode(node)) {
              url = node.getURL();
            }
          }
          setLinkDialog({ url });
        });
        return;
      }
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, action);
    },
    [editor]
  );

  const applyLink = useCallback(
    (url: string) => {
      import("@lexical/link").then(({ TOGGLE_LINK_COMMAND }) => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url || null);
      });
      setLinkDialog(null);
    },
    [editor]
  );

  const handleEmoji = useCallback(
    (emoji: string) => {
      setEmojiPicker(false);
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(emoji);
        }
      });
    },
    [editor]
  );

  const handleEmojiClick = useCallback(() => {
    setEmojiPicker((p) => !p);
  }, []);

  if (!isTextBlock) return null;
  // Strict condition: Block must be selected, AND this specific editor must have DOM focus (or dialogs are open)
  if (!(isFocused && isEditorFocused) && !aiDialogOpen && !linkDialog && !emojiPicker) return null;

  const buttons: { action: FormatAction; label: React.ReactNode }[] = [
    { action: "bold", label: <Bold size={14} /> },
    { action: "italic", label: <Italic size={14} /> },
    { action: "code", label: <Code size={14} /> },
    { action: "strikethrough", label: <Strikethrough size={14} /> },
    { action: "link", label: <LinkIcon size={14} /> },
  ];

  const hasFormat = (action: FormatAction): boolean => {
    if (action === "link") return !!activeFormats["link"];
    return !!activeFormats[action];
  };

  return (
    <>
      <div
        ref={toolbarRef}
        onMouseDown={(e) => e.preventDefault()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "4px 0 8px",
          marginBottom: 8,
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {buttons.map(({ action, label }) => {
          const active = hasFormat(action);
          return (
            <button
              key={action}
              onClick={() => apply(action)}
              title={action.charAt(0).toUpperCase() + action.slice(1)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 24,
                background: active ? "var(--accent-muted)" : "transparent",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "0 6px",
                cursor: "pointer",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                transition: "background 0.1s, color 0.1s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              {label}
            </button>
          );
        })}
        <div style={{ width: 1, height: 16, background: "var(--border-subtle)", margin: "0 4px" }} />
        <div style={{ position: "relative", display: "inline-flex" }}>
          <button
            ref={emojiBtnRef}
            onClick={handleEmojiClick}
            title="Emoji"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 24,
              background: emojiPicker ? "var(--accent-muted)" : "transparent",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "0 6px",
              cursor: "pointer",
              color: emojiPicker ? "var(--accent)" : "var(--text-secondary)",
              transition: "background 0.1s, color 0.1s",
            }}
            onMouseEnter={(e) => {
              if (!emojiPicker) {
                e.currentTarget.style.background = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!emojiPicker) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            <Smile size={14} />
          </button>
          {emojiPicker && (
            <EmojiPicker
              onSelect={handleEmoji}
              onClose={() => setEmojiPicker(false)}
              buttonRef={emojiBtnRef}
            />
          )}
        </div>
        <div style={{ width: 1, height: 16, background: "var(--border-subtle)", margin: "0 4px" }} />
        <button
          onClick={() => setAiDialogOpen(true)}
          title="Edit with AI"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 24,
            background: aiDialogOpen ? "var(--accent-muted)" : "transparent",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "0 6px",
            cursor: "pointer",
            color: aiDialogOpen ? "var(--accent)" : "var(--text-secondary)",
            fontSize: 12,
            transition: "background 0.1s, color 0.1s",
          }}
          onMouseEnter={(e) => {
            if (!aiDialogOpen) {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!aiDialogOpen) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }
          }}
        >
          <Sparkles size={13} />
        </button>
      </div>
      {aiDialogOpen && <BlockAiDialog blockId={blockId} onClose={() => setAiDialogOpen(false)} />}
      {linkDialog && linkPos && (
        <LinkDialog
          initialUrl={linkDialog.url}
          position={linkPos}
          onApply={applyLink}
          onRemove={activeFormats["link"] ? () => applyLink("") : undefined}
          onCancel={() => setLinkDialog(null)}
        />
      )}
    </>
  );
}
