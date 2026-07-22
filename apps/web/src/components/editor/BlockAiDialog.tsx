"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles, Square, RotateCw, FileDown } from "lucide-react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { parseMarkdown, serializeToMarkdown } from "@/features/markdown/serializer";
import { v4 as uuidv4 } from "uuid";
import type { Block } from "@next-md-editor/types";
import { AiDialogHeader } from "./ai-dialog/AiDialogHeader";

interface BlockAiDialogProps {
  blockId: string;
  onClose: () => void;
}

type DialogState = "input" | "streaming" | "done" | "error";

export const TEXT_BLOCK_TYPES = new Set([
  "heading", "paragraph", "quote", "code", "bullet-list", "numbered-list",
  "callout", "collapsible", "table",
]);

function extractContentProps(block: Block): Record<string, unknown> {
  switch (block.type) {
    case "paragraph":
      return { text: block.props.text ?? "", content: block.props.content ?? [] };
    case "heading":
      return { text: block.props.text ?? "", level: block.props.level ?? 1 };
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

    const contentText = serializeToMarkdown([block]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are an expert markdown editor. The user will provide their current markdown block and a modification request. "
                + "Respond with ONLY the modified content as raw markdown. "
                + "Keep the SAME markdown structure as the original (e.g., if the original is a table, output a table; if it's a heading, output a heading). "
                + "Only change the structure if the user explicitly asks you to. "
                + "Do not include markdown code block wrappers (like ```markdown) unless the original block was a code block. "
                + "Do not include explanations or metadata.",
            },
            {
              role: "user",
              content: "Current markdown:\n---\n" + contentText + "\n---\n\nModification request: " + promptText,
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

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 9998,
        }}
        onClick={onClose}
      />
      <div
        onClick={(e) => e.stopPropagation()}
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
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <AiDialogHeader blockLabel={blockLabel} onClose={onClose} />

        {/* Body */}
        <div style={{ padding: 12, overflowY: "auto", flex: 1 }}>
          {/* Current content preview */}
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Current content
          </div>
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 10px",
              fontSize: 12,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 120,
              overflow: "auto",
              lineHeight: 1.5,
              marginBottom: 12,
              fontFamily: "inherit",
            }}
          >
            {block ? serializeToMarkdown([block]) || <span style={{ fontStyle: "italic", opacity: 0.5 }}>Empty</span> : "Block not found"}
          </div>

          {state === "input" && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                How should I modify it?
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g. "Make this more concise", "Turn into a question", "Add bullet points", "Rewrite in a formal tone"...'
                rows={3}
                className="ide-input"
                style={{
                  width: "100%",
                  height: "auto",
                  minHeight: 64,
                  padding: "6px 8px",
                  lineHeight: 1.5,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 6 }}>
                <button
                  onClick={onClose}
                  className="ide-btn"
                  style={{ border: "1px solid var(--border)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGenerate(prompt)}
                  disabled={!prompt.trim()}
                  className="ide-btn primary"
                  style={{ opacity: prompt.trim() ? 1 : 0.5 }}
                >
                  <Sparkles size={13} />
                  Generate
                </button>
              </div>
            </>
          )}

          {state === "streaming" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Generating
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <style>
                    {`
                      .ai_bounce { animation: ai_bounce_anim 1.05s infinite; fill: var(--accent); }
                      .ai_bounce_2 { animation-delay: .1s; }
                      .ai_bounce_3 { animation-delay: .2s; }
                      @keyframes ai_bounce_anim {
                        0%, 57.14% { animation-timing-function: cubic-bezier(0.33,.66,.66,1); transform: translateY(0); }
                        28.57% { animation-timing-function: cubic-bezier(0.33,0,.66,.33); transform: translateY(-4px); }
                        100% { transform: translateY(0); }
                      }
                    `}
                  </style>
                  <circle className="ai_bounce" cx="4" cy="12" r="2.5" />
                  <circle className="ai_bounce ai_bounce_2" cx="12" cy="12" r="2.5" />
                  <circle className="ai_bounce ai_bounce_3" cx="20" cy="12" r="2.5" />
                </svg>
              </div>
              <div
                ref={previewRef}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 10px",
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
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Generation complete
              </div>
              <div
                ref={previewRef}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 10px",
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
                className="ide-btn"
                style={{ border: "1px solid var(--border)" }}
              >
                <RotateCw size={13} />
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
              gap: 6,
              padding: "8px 12px",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            {state === "streaming" && (
              <button
                onClick={handleStop}
                className="ide-btn"
                style={{ background: "var(--danger)", color: "#fff" }}
              >
                <Square size={13} />
                Stop
              </button>
            )}
            {state === "done" && (
              <>
                <button
                  onClick={() => handleGenerate(prompt)}
                  className="ide-btn"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <RotateCw size={13} />
                  Regenerate
                </button>
                <button onClick={handleUpdate} className="ide-btn primary">
                  <FileDown size={13} />
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
