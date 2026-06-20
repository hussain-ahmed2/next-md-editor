"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles, Square, RotateCw, FileDown, X } from "lucide-react";
import { README_PROMPTS } from "@/data/readme-prompts";
import { parseMarkdown } from "@/features/markdown/serializer";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useUIStore } from "@/store/uiStore";
import { v4 as uuidv4 } from "uuid";

type DialogState = "input" | "streaming" | "done" | "error";

export function AiReadmeDialog() {
  const isOpen = useUIStore((s) => s.isAiReadmeOpen);
  const setOpen = useUIStore((s) => s.setAiReadmeOpen);
  const addBlock = useEditorStore((s) => s.addBlock);
  const blocks = useEditorStore((s) => s.blocks);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<DialogState>("input");
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

  const handleGenerate = useCallback(async (promptText: string) => {
    if (!promptText.trim()) return;

    setPrompt(promptText);
    setState("streaming");
    setAccumulated("");
    setError(null);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch("/api/generate-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `API error (${res.status})`);
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
  }, [scrollPreview]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleInsert = useCallback(() => {
    if (!accumulated) return;
    const parsed = parseMarkdown(accumulated).map((b) => ({
      ...b,
      id: b.id || uuidv4(),
    }));
    const focusedId = selectedBlockIds[selectedBlockIds.length - 1];
    const index = focusedId ? blocks.findIndex((b) => b.id === focusedId) : blocks.length - 1;
    for (let i = parsed.length - 1; i >= 0; i--) {
      addBlock(parsed[i], index + 1);
    }
    setOpen(false);
  }, [accumulated, blocks, selectedBlockIds, addBlock, setOpen]);

  const handleTryAgain = useCallback(() => {
    setState("input");
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    setOpen(false);
  }, [setOpen]);

  if (!isOpen) return null;

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
        onClick={handleClose}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: 640,
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
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={18} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              AI Readme Generator
            </span>
          </div>
          <button
            onClick={handleClose}
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
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          {state === "input" && (
            <>
              {/* Prompt chips */}
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Choose a template or write your own:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {README_PROMPTS.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => handleGenerate(t.prompt)}
                    style={{
                      padding: "8px 12px",
                      fontSize: 12,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      cursor: "pointer",
                      color: "var(--text-primary)",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "border-color 0.15s ease",
                      flex: "1 0 calc(50% - 8px)",
                      minWidth: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.description}</div>
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>or</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* Custom prompt */}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your project and what you want in the README..."
                rows={4}
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

              {/* Generate button */}
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
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
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
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
                  maxHeight: 360,
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
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--success)", marginBottom: 8 }}>
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
                  maxHeight: 360,
                  overflow: "auto",
                  lineHeight: 1.5,
                }}
              >
                {accumulated}
              </div>
            </>
          )}

          {state === "error" && (
            <div style={{ padding: "12px 0" }}>
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
              padding: "12px 20px",
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
                  onClick={handleInsert}
                  style={{
                    ...btnBase,
                    background: "var(--accent)",
                    color: "#fff",
                  }}
                >
                  <FileDown size={14} />
                  Insert
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
