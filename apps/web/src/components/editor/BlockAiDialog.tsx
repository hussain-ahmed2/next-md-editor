"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles, Square, RotateCw, FileDown, X } from "lucide-react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { parseMarkdown } from "@/features/markdown/serializer";
import { v4 as uuidv4 } from "uuid";
import type { Block } from "@next-md-editor/types";

interface BlockAiDialogProps {
  blockId: string;
  onClose: () => void;
}

type DialogState = "input" | "streaming" | "done" | "error";

export const TEXT_BLOCK_TYPES = new Set([
  "heading", "paragraph", "quote", "code", "bullet-list", "numbered-list",
  "callout", "collapsible", "table",
]);

function getBlockContentText(block: Block): string {
  switch (block.type) {
    case "heading":
      return (block.props.text as string) ?? "";
    case "paragraph": {
      const content = block.props.content;
      if (Array.isArray(content)) {
        return content.map((s: Record<string, unknown>) => s.text ?? "").join("");
      }
      return (block.props.text as string) ?? "";
    }
    case "quote":
      return (block.props.text as string) ?? "";
    case "code":
      return "```" + (block.props.language ?? "") + "\n" + (block.props.code ?? "") + "\n```";
    case "bullet-list":
    case "numbered-list": {
      const items = block.props.items as { content?: { text?: string }[]; text?: string }[] | undefined;
      if (!items) return "";
      const prefix = block.type === "bullet-list" ? "- " : "1. ";
      return items.map((item) => {
        if (item.content) {
          return prefix + item.content.map((s) => s.text ?? "").join("");
        }
        return prefix + (item.text ?? "");
      }).join("\n");
    }
    case "callout":
      return "> [" + (block.props.type ?? "note") + "] " + (block.props.text ?? "");
    case "collapsible":
      return "<details>\n<summary>" + (block.props.summary ?? "") + "</summary>\n" + (block.props.content ?? "") + "\n</details>";
    default:
      return JSON.stringify(block.props);
  }
}

function extractContentProps(block: Block): Record<string, unknown> {
  switch (block.type) {
    case "paragraph":
      return { text: block.props.text ?? "", content: block.props.content ?? [] };
    case "heading":
      return { text: block.props.text ?? "" };
    case "quote":
      return { text: block.props.text ?? "" };
    case "code":
      return { code: block.props.code ?? "", language: block.props.language ?? "text" };
    case "bullet-list":
    case "numbered-list":
      return { items: block.props.items ?? [] };
    case "callout":
      return { text: block.props.text ?? "", type: block.props.type ?? "note" };
    case "collapsible":
      return { summary: block.props.summary ?? "", content: block.props.content ?? "" };
    default:
      return { ...block.props };
  }
}

export function BlockAiDialog({ blockId, onClose }: BlockAiDialogProps) {
  const blocks = useEditorStore((s) => s.blocks);
  const block = blocks.find((b) => b.id === blockId);
  const { updateBlock, replaceBlock, addBlock } = useEditorStore.getState();

  const [state, setState] = useState<DialogState>("input");
  const [prompt, setPrompt] = useState("");
  const [accumulated, setAccumulated] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const scrollPreview = useCallback(() => {
    requestAnimationFrame(() => {
      if (previewRef.current) {
        previewRef.current.scrollTop = previewRef.current.scrollHeight;
      }
    });
  }, []);

  const findBlockIndex = useCallback(() => {
    return blocks.findIndex((b) => b.id === blockId);
  }, [blocks, blockId]);

  const handleGenerate = useCallback(async (promptText: string) => {
    if (!promptText.trim() || !block) return;

    setState("streaming");
    setAccumulated("");
    setError(null);

    const abort = new AbortController();
    abortRef.current = abort;

    const contentText = getBlockContentText(block);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a content editor. The user will provide their current block content and a modification request. "
                + "Respond with ONLY the modified content as markdown. Do not include explanations or metadata.",
            },
            {
              role: "user",
              content: "Block type: " + block.type + "\n\nCurrent content:\n---\n" + contentText + "\n---\n\nModification request: " + promptText,
            },
          ],
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "API error (" + res.status + ")");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAccumulated(text);
        scrollPreview();
      }

      setState("done");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setState("input");
        return;
      }
      setError(err instanceof Error ? err.message : "Generation failed");
      setState("error");
    } finally {
      abortRef.current = null;
    }
  }, [block, scrollPreview]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleUpdate = useCallback(() => {
    if (!accumulated || !block) return;

    const parsed = parseMarkdown(accumulated);
    if (parsed.length === 0) return;

    const index = findBlockIndex();
    if (index === -1) return;

    if (parsed.length === 1) {
      const p = parsed[0];
      if (p.type === block.type) {
        updateBlock(blockId, extractContentProps(p));
      } else {
        replaceBlock(blockId, { type: p.type, props: p.props });
      }
    } else {
      replaceBlock(blockId, { type: parsed[0].type, props: parsed[0].props });
      for (let i = 1; i < parsed.length; i++) {
        addBlock({ ...parsed[i], id: uuidv4() }, index + i);
      }
    }

    onClose();
  }, [accumulated, block, blockId, findBlockIndex, updateBlock, replaceBlock, addBlock, onClose]);

  const handleTryAgain = useCallback(() => {
    setState("input");
    setError(null);
  }, []);

  const blockLabel = block?.type ?? "block";

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.15s ease",
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 9998,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: 560,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100vh - 32px)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
              AI Block Editor
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                background: "var(--bg-surface)",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {blockLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
              borderRadius: 4,
              display: "flex",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 18px", overflowY: "auto", flex: 1 }}>
          {/* Current content preview */}
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
            Current content
          </div>
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 12,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 120,
              overflow: "auto",
              lineHeight: 1.5,
              marginBottom: 16,
              fontFamily: "inherit",
            }}
          >
            {block ? getBlockContentText(block) || <span style={{ fontStyle: "italic", opacity: 0.5 }}>Empty</span> : "Block not found"}
          </div>

          {state === "input" && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                How should I modify it?
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g. "Make this more concise", "Turn into a question", "Add bullet points", "Rewrite in a formal tone"...'
                rows={3}
                style={{
                  width: "100%",
                  padding: 10,
                  fontSize: 13,
                  fontFamily: "inherit",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  onClick={onClose}
                  style={{
                    ...btnBase,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGenerate(prompt)}
                  disabled={!prompt.trim()}
                  style={{
                    ...btnBase,
                    background: "var(--accent)",
                    color: "#fff",
                    opacity: prompt.trim() ? 1 : 0.5,
                  }}
                >
                  <Sparkles size={14} />
                  Generate
                </button>
              </div>
            </>
          )}

          {state === "streaming" && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                Generating...
              </div>
              <div
                ref={previewRef}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 300,
                  overflow: "auto",
                  lineHeight: 1.5,
                }}
              >
                {accumulated || "Waiting for response..."}
              </div>
            </>
          )}

          {state === "done" && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--success)", marginBottom: 6 }}>
                Generation complete
              </div>
              <div
                ref={previewRef}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 300,
                  overflow: "auto",
                  lineHeight: 1.5,
                }}
              >
                {accumulated}
              </div>
            </>
          )}

          {state === "error" && (
            <div style={{ padding: "8px 0" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)", marginBottom: 4 }}>
                Generation failed
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
                {error || "An unknown error occurred."}
              </div>
              <button
                onClick={handleTryAgain}
                style={{
                  ...btnBase,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <RotateCw size={14} />
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {(state === "streaming" || state === "done") && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              padding: "12px 18px",
              borderTop: "1px solid var(--border)",
            }}
          >
            {state === "streaming" && (
              <button
                onClick={handleStop}
                style={{
                  ...btnBase,
                  background: "var(--danger)",
                  color: "#fff",
                }}
              >
                <Square size={14} />
                Stop
              </button>
            )}
            {state === "done" && (
              <>
                <button
                  onClick={() => handleGenerate(prompt)}
                  style={{
                    ...btnBase,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <RotateCw size={14} />
                  Regenerate
                </button>
                <button
                  onClick={handleUpdate}
                  style={{
                    ...btnBase,
                    background: "var(--accent)",
                    color: "#fff",
                  }}
                >
                  <FileDown size={14} />
                  Update Block
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
