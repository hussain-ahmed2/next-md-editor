"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles, Square, RotateCw, Check, X } from "lucide-react";
import { parseMarkdown } from "@/features/markdown/serializer";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { v4 as uuidv4 } from "uuid";

type BlockState = "input" | "streaming" | "done" | "error";

const QUICK_PROMPTS = [
  { label: "Paragraph", prompt: "Write a concise paragraph explaining " },
  { label: "List", prompt: "Generate a numbered list of best practices for " },
  { label: "Code example", prompt: "Write an example code snippet showing how to " },
  { label: "Table", prompt: "Create a markdown table comparing " },
  { label: "Summary", prompt: "Summarize the key points of " },
];

export function AiContentBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const replaceBlock = useEditorStore((s) => s.replaceBlock);
  const addBlock = useEditorStore((s) => s.addBlock);

  const [state, setState] = useState<BlockState>("input");
  const [prompt, setPrompt] = useState((block.props.prompt as string) || "");
  const [accumulated, setAccumulated] = useState((block.props.generated as string) || "");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const scrollPreview = useCallback(() => {
    requestAnimationFrame(() => {
      previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight });
    });
  }, []);

  const handleGenerate = useCallback(async (promptText: string) => {
    if (!promptText.trim()) return;
    setPrompt(promptText);
    setState("streaming");
    setAccumulated("");
    setError(null);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
        signal: abort.signal,
      });

      if (!res.ok) throw new Error(`API error (${res.status})`);

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
  }, [scrollPreview]);

  const handleStop = useCallback(() => abortRef.current?.abort(), []);

  const handleApply = useCallback(() => {
    if (!accumulated) return;
    const index = blocks.findIndex((b) => b.id === block.id);
    const parsed = parseMarkdown(accumulated).map((b) => ({
      ...b,
      id: b.id || uuidv4(),
    }));
    replaceBlock(block.id, {
      type: "paragraph",
      props: { content: [] },
    });
    for (let i = parsed.length - 1; i >= 0; i--) {
      addBlock(parsed[i], index + 1);
    }
  }, [accumulated, block.id, blocks, replaceBlock, addBlock]);

  const handleRegenerate = useCallback(() => {
    handleGenerate(prompt);
  }, [prompt, handleGenerate]);

  const handleDiscard = useCallback(() => {
    setState("input");
    setAccumulated("");
    setError(null);
  }, []);

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-surface)",
        overflow: "hidden",
      }}
      data-block-id={block.id}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <Sparkles size={12} style={{ color: "var(--accent)" }} />
        AI Content
      </div>

      {/* Body */}
      <div style={{ padding: 12 }}>
        {state === "input" && (
          <>
            {/* Quick prompts */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => {
                    setPrompt(q.prompt);
                    handleGenerate(q.prompt);
                  }}
                  style={{
                    ...btnBase,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: 11,
                    padding: "4px 10px",
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate..."
              rows={3}
              style={{
                width: "100%",
                padding: 8,
                fontSize: 13,
                fontFamily: "inherit",
                border: "1px solid var(--border)",
                borderRadius: 5,
                background: "var(--bg-base)",
                color: "var(--text-primary)",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {/* Generate */}
            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
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
                <Sparkles size={13} />
                Generate
              </button>
            </div>
          </>
        )}

        {state === "streaming" && (
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
              Generating...
            </div>
            <div
              ref={previewRef}
              style={{
                maxHeight: 300,
                overflow: "auto",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.5,
                padding: 8,
                background: "var(--bg-base)",
                borderRadius: 5,
                border: "1px solid var(--border)",
              }}
            >
              {accumulated || "Waiting..."}
            </div>
          </div>
        )}

        {state === "done" && (
          <div>
            <div style={{ fontSize: 11, color: "var(--success)", marginBottom: 6 }}>
              Complete
            </div>
            <div
              ref={previewRef}
              style={{
                maxHeight: 300,
                overflow: "auto",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.5,
                padding: 8,
                background: "var(--bg-base)",
                borderRadius: 5,
                border: "1px solid var(--border)",
              }}
            >
              {accumulated}
            </div>
          </div>
        )}

        {state === "error" && (
          <div style={{ fontSize: 12, color: "var(--danger)" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Generation failed</div>
            <div style={{ color: "var(--text-secondary)", marginBottom: 8, fontSize: 11 }}>
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {(state === "streaming" || state === "done" || state === "error") && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 6,
            padding: "8px 12px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {state === "streaming" && (
            <button onClick={handleStop} style={{ ...btnBase, background: "var(--danger)", color: "#fff" }}>
              <Square size={12} /> Stop
            </button>
          )}
          {state === "done" && (
            <>
              <button
                onClick={handleDiscard}
                style={{ ...btnBase, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <X size={12} /> Discard
              </button>
              <button
                onClick={handleRegenerate}
                style={{ ...btnBase, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <RotateCw size={12} /> Regenerate
              </button>
              <button onClick={handleApply} style={{ ...btnBase, background: "var(--accent)", color: "#fff" }}>
                <Check size={12} /> Apply
              </button>
            </>
          )}
          {state === "error" && (
            <button
              onClick={() => setState("input")}
              style={{ ...btnBase, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
