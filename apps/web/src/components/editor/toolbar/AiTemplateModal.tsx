"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Sparkles, Loader2, Square, Check, FileDown } from "lucide-react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { parseMarkdown } from "@/features/markdown/serializer";
import { v4 as uuidv4 } from "uuid";

interface AiTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiTemplateModal({ isOpen, onClose }: AiTemplateModalProps) {
  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const setBlocks = useEditorStore((s) => s.setBlocks);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prompt.trim() || streaming) return;
    
    setStreaming(true);
    setResult("");
    setError(null);
    
    const abort = new AbortController();
    abortRef.current = abort;

    const fullPrompt = `Generate a comprehensive, beautifully formatted README.md for my project. Use standard markdown. Do not wrap the whole response in a single markdown code block. The project is about: ${prompt}`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: fullPrompt }],
        }),
        signal: abort.signal,
      });

      if (!res.ok) throw new Error(`API error (${res.status})`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let generatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        generatedText += decoder.decode(value, { stream: true });
        setResult(generatedText);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to generate README.");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleInsert = useCallback(() => {
    if (!result) return;
    const parsed = parseMarkdown(result).map((b) => ({
      ...b,
      id: uuidv4(),
    }));
    setBlocks(parsed);
    onClose();
  }, [result, setBlocks, onClose]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 540,
          maxWidth: "100%",
          maxHeight: "85vh",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={18} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
              Generate AI README
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
          {!result && !streaming && !error ? (
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Describe your project briefly. The AI will generate a comprehensive README document complete with installation steps, usage examples, and structure.
              </div>
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="E.g., A Next.js block-based markdown editor with real-time collaboration..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: 14,
                  fontFamily: "inherit",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  background: "var(--bg-base)",
                  color: "var(--text-primary)",
                  resize: "none",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    opacity: prompt.trim() ? 1 : 0.5,
                  }}
                >
                  <Sparkles size={14} />
                  Generate
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div
                style={{
                  flex: 1,
                  padding: 20,
                  overflowY: "auto",
                  background: "var(--bg-base)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {error ? (
                  <div style={{ color: "var(--danger)" }}>{error}</div>
                ) : (
                  result || "Generating..."
                )}
              </div>
              
              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12 }}>
                  {streaming ? (
                    <>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      Generating content...
                    </>
                  ) : error ? (
                    "Failed to generate."
                  ) : (
                    <>
                      <Check size={14} style={{ color: "var(--success)" }} />
                      Generation complete.
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {streaming ? (
                    <button
                      onClick={handleStop}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: "var(--danger)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Square size={12} fill="currentColor" />
                      Stop
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setResult("");
                          setError(null);
                          setTimeout(() => inputRef.current?.focus(), 100);
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                          background: "transparent",
                          color: "var(--text-primary)",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Try Again
                      </button>
                      {!error && (
                        <button
                          onClick={handleInsert}
                          style={{
                            padding: "6px 16px",
                            borderRadius: 6,
                            border: "none",
                            background: "var(--accent)",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <FileDown size={14} />
                          Load into Editor
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
