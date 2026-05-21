"use client";

import React from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { serializeToMarkdown } from "@/features/markdown/serializer";
import { useState } from "react";
import { highlightCodeHtml } from "@/features/markdown/highlighter";
import {
  Info,
  Lightbulb,
  Megaphone,
  TriangleAlert,
  OctagonX,
  FileText,
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// ── GitHub-style alert themes (mirrors CalloutBlock.tsx) ──────────────────────
const ALERT_THEMES: Record<
  string,
  { label: string; icon: React.ReactNode; border: string; bg: string; color: string }
> = {
  note: { label: "Note", icon: <Info size={14} />, border: "#388bfd", bg: "rgba(56,139,253,0.08)", color: "#58a6ff" },
  tip: { label: "Tip", icon: <Lightbulb size={14} />, border: "#3fb950", bg: "rgba(63,185,80,0.08)", color: "#56d364" },
  important: { label: "Important", icon: <Megaphone size={14} />, border: "#a371f7", bg: "rgba(163,113,247,0.08)", color: "#bc8cff" },
  warning: { label: "Warning", icon: <TriangleAlert size={14} />, border: "#d29922", bg: "rgba(210,153,34,0.08)", color: "#e3b341" },
  caution: { label: "Caution", icon: <OctagonX size={14} />, border: "#f85149", bg: "rgba(248,113,113,0.08)", color: "#ff7b72" },
};

// ── Helper: extract all text content from a React node tree ──────────────────
function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) return extractText((node.props as { children?: React.ReactNode }).children);
  return "";
}

// ── Helper: process table cells to render both raw HTML <img> and standard markdown images beautifully ─
function processTableImage(children: React.ReactNode): React.ReactNode {
  // 1. Try to parse from raw HTML string
  const text = extractText(children).trim();
  const htmlImgMatch = text.match(/<img\s+[^>]*src="([^"]+)"[^>]*>/i);
  if (htmlImgMatch) {
    const src = htmlImgMatch[1];
    const altMatch = text.match(/alt="([^"]*)"/i);
    const alt = altMatch ? altMatch[1] : "Image";
    return (
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "200px",
          aspectRatio: "16/10",
          objectFit: "cover",
          borderRadius: 6,
          border: "1px solid #30363d",
          display: "block",
        }}
      />
    );
  }

  // 2. If it's react-markdown's standard image element, style it
  const styleImageElements = (node: React.ReactNode): React.ReactNode => {
    if (!node) return node;
    if (React.isValidElement(node)) {
      if (node.type === "img") {
        const props = node.props as any;
        return (
          <img
            src={props.src}
            alt={props.alt || "Image"}
            style={{
              width: "100%",
              height: "200px",
              aspectRatio: "16/10",
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid #30363d",
              display: "block",
            }}
          />
        );
      }
      if (node.props && (node.props as any).children) {
        const childrenList = React.Children.map((node.props as any).children, styleImageElements);
        return React.cloneElement(node, {}, childrenList);
      }
    }
    if (Array.isArray(node)) {
      return node.map(styleImageElements);
    }
    return node;
  };

  return styleImageElements(children);
}

// ── Shared GitHub-Dark prose styles ─────────────────────────────────────────
const FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';
const FONT_MONO =
  "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace";

// ── Custom react-markdown component overrides ─────────────────────────────────
const MD_COMPONENTS: Components = {
  // Headings
  h1: ({ children }) => (
    <h1 style={{ fontSize: "2em", fontWeight: 600, lineHeight: 1.25, color: "#f0f6fc", borderBottom: "1px solid #30363d", paddingBottom: "0.3em", margin: "16px 0 12px" }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: "1.5em", fontWeight: 600, lineHeight: 1.25, color: "#f0f6fc", borderBottom: "1px solid #30363d", paddingBottom: "0.3em", margin: "16px 0 12px" }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: "1.25em", fontWeight: 600, lineHeight: 1.25, color: "#f0f6fc", margin: "16px 0 8px" }}>
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 style={{ fontSize: "1.1em", fontWeight: 600, color: "#f0f6fc", margin: "12px 0 6px" }}>
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 style={{ fontSize: "1em", fontWeight: 600, color: "#f0f6fc", margin: "12px 0 6px" }}>
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 style={{ fontSize: "0.85em", fontWeight: 600, color: "#8b949e", margin: "12px 0 6px" }}>
      {children}
    </h6>
  ),

  // Paragraph
  p: ({ children }) => (
    <p style={{ margin: "0 0 8px", fontSize: 15, lineHeight: 1.6, color: "#e6edf3", wordBreak: "break-word" }}>
      {children}
    </p>
  ),

  // Blockquote — handles both plain quotes AND GitHub-style alerts (> [!TIP])
  blockquote: ({ children }) => {
    const childArr = React.Children.toArray(children);
    const rawText = extractText(children).trimStart();
    const alertMatch = rawText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

    if (alertMatch) {
      const type = alertMatch[1].toLowerCase();
      const theme = ALERT_THEMES[type] ?? ALERT_THEMES.note;
      // Strip the "[!TYPE]" line from display — it's rendered as the header
      let hasStripped = false;
      const bodyChildren = childArr.map((child) => {
        if (!React.isValidElement(child)) return child;
        if (!hasStripped) {
          hasStripped = true;
          const pKids = React.Children.toArray((child.props as { children?: React.ReactNode }).children);
          const filtered = pKids
            .map((c, ci) => {
              if (ci === 0 && typeof c === "string") {
                return c.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, "").trimStart();
              }
              return c;
            })
            .filter((c) => c !== "");
          return React.cloneElement(child as React.ReactElement<{ children?: React.ReactNode }>, {}, ...filtered);
        }
        return child;
      });

      return (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 6,
            borderLeft: `4px solid ${theme.border}`,
            border: `1px solid ${theme.border}33`,
            borderLeftWidth: 4,
            background: theme.bg,
            margin: "12px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: theme.color,
              marginBottom: 6,
            }}
          >
            {theme.icon}
            <span>{theme.label}</span>
          </div>
          <div style={{ color: "#e6edf3", fontSize: 14, lineHeight: 1.6 }}>
            {bodyChildren}
          </div>
        </div>
      );
    }

    // Plain blockquote
    return (
      <blockquote
        style={{
          margin: "0 0 8px",
          padding: "0 1em",
          color: "#8b949e",
          borderLeft: "4px solid #30363d",
        }}
      >
        {children}
      </blockquote>
    );
  },

  // Inline code + fenced code blocks
  code: ({ children, className }) => {
    const lang = (className ?? "").replace("language-", "");
    const codeStr = String(children).replace(/\n$/, "");

    // Block code (has a language class or contains newlines)
    if (className || codeStr.includes("\n")) {
      return (
        <div
          style={{
            position: "relative",
            borderRadius: 6,
            background: "#161b22",
            border: "1px solid #30363d",
            padding: 16,
            overflow: "auto",
            margin: "8px 0",
          }}
        >
          {lang && (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 12,
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                color: "#8b949e",
                userSelect: "none",
              }}
            >
              {lang}
            </span>
          )}
          <pre style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre", color: "#e6edf3" }}>
            <code dangerouslySetInnerHTML={{ __html: highlightCodeHtml(codeStr, lang || "ts") }} />
          </pre>
        </div>
      );
    }

    // Inline code
    return (
      <code
        style={{
          background: "rgba(110,118,129,0.3)",
          padding: "2px 4px",
          borderRadius: 4,
          fontFamily: FONT_MONO,
          fontSize: "85%",
          color: "#e6edf3",
        }}
      >
        {children}
      </code>
    );
  },

  // Horizontal rule
  hr: () => (
    <hr style={{ height: "0.25em", padding: 0, margin: "12px 0", backgroundColor: "#30363d", border: 0 }} />
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#58a6ff", textDecoration: "none", fontWeight: 500 }}
    >
      {children}
    </a>
  ),

  // Images
  img: ({ src, alt }) => (
    <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{ maxWidth: "100%", height: "auto", borderRadius: 6, border: "1px solid #30363d" }}
      />
    </div>
  ),

  // Lists
  ul: ({ children }) => (
    <ul style={{ margin: "0 0 8px", paddingLeft: 24, color: "#e6edf3", fontSize: 15, lineHeight: 1.6 }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: "0 0 8px", paddingLeft: 24, color: "#e6edf3", fontSize: 15, lineHeight: 1.6 }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li style={{ marginBottom: 2, lineHeight: 1.6 }}>{children}</li>
  ),

  // Bold / italic / strikethrough
  strong: ({ children }) => <strong style={{ fontWeight: 600, color: "#f0f6fc" }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
  del: ({ children }) => <del style={{ color: "#8b949e" }}>{children}</del>,

  // GFM Tables
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "12px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left", border: "1px solid #30363d" }}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead style={{ borderBottom: "2px solid #30363d", background: "#161b22" }}>{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr style={{ borderBottom: "1px solid #30363d" }}>{children}</tr>
  ),
  th: ({ children }) => (
    <th style={{ padding: "8px 12px", fontWeight: 600, borderRight: "1px solid #30363d", color: "#f0f6fc" }}>
      {children}
    </th>
  ),
  td: ({ children }) => {
    const rendered = processTableImage(children);
    return (
      <td style={{ padding: "8px 12px", borderRight: "1px solid #30363d", color: "#c9d1d9" }}>
        {rendered}
      </td>
    );
  },
};

// ── MarkdownPreview component ─────────────────────────────────────────────────
export function MarkdownPreview() {
  const blocks = useEditorStore((s) => s.blocks);
  const markdown = serializeToMarkdown(blocks);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

  const isMobile = useUIStore((s) => s.isMobile);
  const previewWidth = useUIStore((s) => s.previewWidth);
  const width = isMobile ? undefined : (previewWidth ?? 360);

  return (
    <aside
      style={{
        width,
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
        padding: "16px",
        gap: 12,
      }}
    >
      {/* File badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
          <span style={{ color: "var(--text-muted)" }}>next-md-editor</span>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>document.md</span>
        </div>
        <span style={{ padding: "2px 6px", borderRadius: 4, background: "var(--accent-muted)", color: "var(--accent)", fontSize: 10, fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase" }}>
          GitHub GFM View
        </span>
      </div>

      {/* GitHub Repository File Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        {/* File Box Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            background: "#161b22",
            borderBottom: "1px solid #30363d",
            height: 44,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#c9d1d9", fontWeight: 500 }}>
            <FileText size={14} style={{ color: "#7d8590" }} />
            <span>document.md</span>
            <span style={{ color: "#484f58", userSelect: "none" }}>|</span>
            <span style={{ fontSize: 11.5, color: "#8b949e" }}>{blocks.length} blocks</span>
          </div>
          <div style={{ display: "flex", border: "1px solid #30363d", borderRadius: 6, overflow: "hidden", background: "#0d1117", padding: 2 }}>
            {(["preview", "raw"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "3px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 4,
                  border: "none",
                  background: activeTab === tab ? "#21262d" : "transparent",
                  color: activeTab === tab ? "#c9d1d9" : "#8b949e",
                  cursor: "pointer",
                  transition: "all 0.1s ease",
                  textTransform: "capitalize",
                }}
              >
                {tab === "raw" ? "Code" : "Preview"}
              </button>
            ))}
          </div>
        </div>

        {/* File Box Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px", background: "#0d1117" }}>
          {blocks.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#8b949e",
                fontSize: 13,
                fontStyle: "italic",
                textAlign: "center",
              }}
            >
              Add blocks to see active GitHub preview…
            </div>
          ) : activeTab === "raw" ? (
            <pre
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: FONT_MONO,
                color: "#c9d1d9",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {markdown}
            </pre>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontFamily: FONT_SANS,
                fontSize: "15px",
                lineHeight: 1.6,
                color: "#e6edf3",
                wordWrap: "break-word",
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                {markdown}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
