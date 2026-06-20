"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Sparkles, Send, Square, FileDown, X, Brain, User } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useEditorStore } from "@next-md-editor/editor-core";
import { parseMarkdown } from "@/features/markdown/serializer";
import { v4 as uuidv4 } from "uuid";

interface Message {
  role: "user" | "assistant";
  content: string;
}

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
    } else {
      setMessages([]);
    }
  }, [isOpen]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

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
  }, [input, messages, streaming]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  if (!isOpen) return null;

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

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9997 }} onClick={() => setOpen(false)} />
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
          display: "flex",
          flexDirection: "column",
          animation: "slideIn 0.2s ease",
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
            <div
              style={{
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 12,
                padding: "40px 20px",
                lineHeight: 1.6,
              }}
            >
              <Sparkles size={24} style={{ color: "var(--accent)", marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                Ask me anything
              </div>
              <div>
                Write a paragraph, generate code, create a table,<br />
                or ask for edits to previous responses.
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
          {messages.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 6,
                padding: "4px 0",
              }}
            >
              <button
                onClick={handleInsertAll}
                disabled={!messages.some((m) => m.role === "assistant" && m.content)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                  fontFamily: "inherit",
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
