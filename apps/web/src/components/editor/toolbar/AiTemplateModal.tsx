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
        background: "rgba(0, 0, 0, 0.55)",
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
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="ws-toolwindow-header"
          style={{ background: "var(--bg-surface)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={13} style={{ color: "var(--accent)" }} />
            <span>Generate AI README</span>
          </div>
          <button
            className="ide-btn"
            onClick={onClose}
            style={{ width: 24, height: 24, padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
          {!result && !streaming && !error ? (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Describe your project briefly. The AI will generate a comprehensive README document complete with installation steps, usage examples, and structure.
              </div>
              <textarea
                ref={inputRef}
                className="ide-input"
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
                  height: "auto",
                  padding: "6px 8px",
                  lineHeight: 1.5,
                  resize: "none",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                <button className="ide-btn" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="ide-btn primary"
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  style={{ opacity: prompt.trim() ? 1 : 0.5 }}
                >
                  <Sparkles size={13} />
                  Generate
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div
                style={{
                  flex: 1,
                  padding: 12,
                  overflowY: "auto",
                  background: "var(--bg-base)",
                  fontSize: 12,
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
                  padding: "8px 12px",
                  borderTop: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 12 }}>
                  {streaming ? (
                    <>
                      <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                      Generating content...
                    </>
                  ) : error ? (
                    "Failed to generate."
                  ) : (
                    <>
                      <Check size={13} style={{ color: "var(--success)" }} />
                      Generation complete.
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {streaming ? (
                    <button
                      onClick={handleStop}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 26,
                        padding: "0 10px",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--danger)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: "var(--font-sans)",
                        cursor: "pointer",
                      }}
                    >
                      <Square size={11} fill="currentColor" />
                      Stop
                    </button>
                  ) : (
                    <>
                      <button
                        className="ide-btn"
                        onClick={() => {
                          setResult("");
                          setError(null);
                          setTimeout(() => inputRef.current?.focus(), 100);
                        }}
                      >
                        Try Again
                      </button>
                      {!error && (
                        <button className="ide-btn primary" onClick={handleInsert}>
                          <FileDown size={13} />
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
