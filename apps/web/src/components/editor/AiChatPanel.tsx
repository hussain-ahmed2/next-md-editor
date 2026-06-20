"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Sparkles, Send, Square, FileDown, X, Brain, User, RotateCw } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useEditorStore } from "@next-md-editor/editor-core";
import { parseMarkdown } from "@/features/markdown/serializer";
import { README_PROMPTS, type PromptTemplate } from "@/data/readme-prompts";
import { v4 as uuidv4 } from "uuid";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS: PromptTemplate[] = [
  ...README_PROMPTS,
  {
    label: "Paragraph",
    description: "Write a paragraph about any topic",
    prompt: "Write a well-crafted paragraph about ",
  },
  {
    label: "Code Example",
    description: "Generate a code snippet",
    prompt: "Write a code example showing how to ",
  },
  {
    label: "List",
    description: "Generate a bullet or numbered list",
    prompt: "Create a list of ",
  },
  {
    label: "Explain",
    description: "Explain a concept simply",
    prompt: "Explain ",
  },
];

export function AiChatPanel() {
  const isOpen = useUIStore((s) => s.isAiChatOpen);
  const setOpen = useUIStore((s) => s.setAiChatOpen);
  const blocks = useEditorStore((s) => s.blocks);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const addBlock = useEditorStore((s) => s.addBlock);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const sendPrompt = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const abort = new AbortController();
    abortRef.current = abort;

    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
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
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: text };
          return next;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Request failed"}`,
        };
        return next;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [messages, streaming]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    await sendPrompt(text);
  }, [input, streaming, sendPrompt]);

  const handlePromptChip = useCallback(async (prompt: string) => {
    await sendPrompt(prompt);
  }, [sendPrompt]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const handleRegenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      setMessages((prev) => prev.slice(0, -1));
      handlePromptChip(lastUser.content);
    }
  }, [messages, handlePromptChip]);

  const handleInsertAll = useCallback(() => {
    const full = messages
      .filter((m) => m.role === "assistant" && m.content)
      .map((m) => m.content)
      .join("\n\n");
    if (!full) return;
    const parsed = parseMarkdown(full).map((b) => ({
      ...b,
      id: b.id || uuidv4(),
    }));
    const focusedId = selectedBlockIds[selectedBlockIds.length - 1];
    const index = focusedId ? blocks.findIndex((b) => b.id === focusedId) : blocks.length - 1;
    for (let i = parsed.length - 1; i >= 0; i--) {
      addBlock(parsed[i], index + 1);
    }
    setOpen(false);
  }, [messages, blocks, selectedBlockIds, addBlock, setOpen]);

  const handleClear = useCallback(() => {
    setMessages([]);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const bubbleStyle = (role: "user" | "assistant"): React.CSSProperties => ({
    maxWidth: "85%",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: "inherit",
    background: role === "user" ? "var(--accent)" : "var(--bg-surface)",
    color: role === "user" ? "#fff" : "var(--text-primary)",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    border: role === "user" ? "none" : "1px solid var(--border)",
  });

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "5px 12px",
    fontSize: 11,
    fontWeight: 600,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.15s ease",
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.content);

  return (
    <>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9997 }} onClick={() => setOpen(false)} />
      )}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
          width: 380,
          maxWidth: "100vw",
          background: "var(--bg-elevated)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "var(--shadow-xl)",
          display: isOpen ? "flex" : "none",
          flexDirection: "column",
          animation: isOpen ? "slideIn 0.2s ease" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Brain size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
              AI Assistant
            </span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                title="Clear conversation"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                  borderRadius: 4,
                  display: "flex",
                  fontSize: 11,
                }}
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
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
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {messages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 12,
                  padding: "24px 20px 8px",
                  lineHeight: 1.6,
                }}
              >
                <Sparkles size={24} style={{ color: "var(--accent)", marginBottom: 8 }} />
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Ask me anything
                </div>
                <div>
                  Write content, generate code, create tables,<br />
                  or refine previous responses.
                </div>
              </div>

              {/* Quick prompts */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 4px 4px" }}>
                {QUICK_PROMPTS.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => handlePromptChip(t.prompt)}
                    style={{
                      padding: "6px 10px",
                      fontSize: 11,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      cursor: "pointer",
                      color: "var(--text-primary)",
                      textAlign: "left",
                      fontFamily: "inherit",
                      flex: "1 0 calc(50% - 6px)",
                      minWidth: 0,
                      transition: "border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 1 }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "user" ? <User size={10} /> : <Brain size={10} />}
                {msg.role === "user" ? "You" : "AI"}
              </div>
              <div style={bubbleStyle(msg.role)}>
                {msg.content || (msg.role === "assistant" ? "..." : "")}
              </div>
            </div>
          ))}

          {/* Action buttons */}
          {messages.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 6,
                padding: "4px 0",
                flexWrap: "wrap",
              }}
            >
              {lastAssistant && !streaming && (
                <button
                  onClick={handleRegenerate}
                  style={{
                    ...btnBase,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <RotateCw size={12} />
                  Regenerate
                </button>
              )}
              <button
                onClick={handleInsertAll}
                disabled={!messages.some((m) => m.role === "assistant" && m.content)}
                style={{
                  ...btnBase,
                  background: "var(--accent)",
                  color: "#fff",
                  opacity: messages.some((m) => m.role === "assistant" && m.content) ? 1 : 0.5,
                }}
              >
                <FileDown size={12} />
                Insert All
              </button>
            </div>
          )}
        </div>

        {/* Input */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for content, edits, or ask a question..."
            rows={2}
            style={{
              flex: 1,
              padding: "8px 10px",
              fontSize: 13,
              fontFamily: "inherit",
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              resize: "none",
              outline: "none",
            }}
          />
          {streaming ? (
            <button
              onClick={handleStop}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                background: "var(--danger)",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                background: "var(--accent)",
                color: "#fff",
                flexShrink: 0,
                opacity: input.trim() ? 1 : 0.5,
              }}
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
