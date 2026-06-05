"use client";

import React from "react";
import type { Components } from "react-markdown";
import { highlightCodeHtml } from "@/features/markdown/highlighter";
import { CALLOUT_TYPES } from "@/constants/calloutTypes";

export const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';
export const FONT_MONO = "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace";

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) return extractText((node.props as { children?: React.ReactNode }).children);
  return "";
}

function findImgInNode(node: React.ReactNode): React.ReactElement | null {
  const children = React.Children.toArray(node);
  for (const child of children) {
    if (!React.isValidElement(child)) continue;
    if (child.type === "img") return child;
    const found = findImgInNode((child.props as any)?.children);
    if (found) return found;
  }
  return null;
}

export const getMarkdownComponents = (): Components => {
  return {
    h1: ({ children }) => (
      <h1
        style={{
          fontSize: "2em",
          fontWeight: 600,
          lineHeight: 1.25,
          color: "#f0f6fc",
          borderBottom: "1px solid #30363d",
          paddingBottom: "0.3em",
          margin: "16px 0 12px",
        }}
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        style={{
          fontSize: "1.5em",
          fontWeight: 600,
          lineHeight: 1.25,
          color: "#f0f6fc",
          borderBottom: "1px solid #30363d",
          paddingBottom: "0.3em",
          margin: "16px 0 12px",
        }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ fontSize: "1.25em", fontWeight: 600, color: "#f0f6fc", margin: "16px 0 8px" }}>{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 style={{ fontSize: "1.1em", fontWeight: 600, color: "#f0f6fc", margin: "12px 0 6px" }}>{children}</h4>
    ),
    h5: ({ children }) => (
      <h5 style={{ fontSize: "1em", fontWeight: 600, color: "#f0f6fc", margin: "12px 0 6px" }}>{children}</h5>
    ),
    h6: ({ children }) => (
      <h6 style={{ fontSize: "0.85em", fontWeight: 600, color: "#8b949e", margin: "12px 0 6px" }}>{children}</h6>
    ),

    p: ({ children }) => (
      <p style={{ margin: "0 0 8px", fontSize: 15, lineHeight: 1.6, color: "#e6edf3", wordBreak: "break-word" }}>
        {children}
      </p>
    ),

    blockquote: ({ children }) => {
      const rawText = extractText(children).trimStart();
      const alertMatch = rawText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
      if (alertMatch) {
        const type = alertMatch[1].toLowerCase() as keyof typeof CALLOUT_TYPES;
        const theme = CALLOUT_TYPES[type] ?? CALLOUT_TYPES.note;
        let hasStripped = false;
        const bodyChildren = React.Children.toArray(children).map((child) => {
          if (!React.isValidElement(child) || hasStripped) return child;
          hasStripped = true;
          const pKids = React.Children.toArray((child.props as { children?: React.ReactNode }).children)
            .map((c, ci) =>
              ci === 0 && typeof c === "string"
                ? c.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, "").trimStart()
                : c,
            )
            .filter((c) => c !== "");
          return React.cloneElement(child as React.ReactElement<{ children?: React.ReactNode }>, {}, ...pKids);
        });
        return (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 6,
              borderLeft: `4px solid ${theme.previewBorder}`,
              border: `1px solid ${theme.previewBorder}33`,
              borderLeftWidth: 4,
              background: theme.previewBg,
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
                color: theme.previewColor,
                marginBottom: 6,
              }}
            >
              {theme.icon}
              <span>{theme.label}</span>
            </div>
            <div style={{ color: "#e6edf3", fontSize: 14, lineHeight: 1.6 }}>{bodyChildren}</div>
          </div>
        );
      }
      return (
        <blockquote
          style={{ margin: "0 0 8px", padding: "0 1em", color: "#8b949e", borderLeft: "4px solid #30363d" }}
        >
          {children}
        </blockquote>
      );
    },

    code: ({ children, className }) => {
      const lang = (className ?? "").replace("language-", "");
      const rawStr = String(children);
      const codeStr = rawStr.replace(/\n$/, "");
      if (className || rawStr.includes("\n")) {
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
            <pre
              style={{
                margin: 0,
                fontFamily: FONT_MONO,
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: "pre",
                color: "#e6edf3",
              }}
            >
              <code dangerouslySetInnerHTML={{ __html: highlightCodeHtml(codeStr, lang || "ts") }} />
            </pre>
          </div>
        );
      }
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

    hr: () => <hr style={{ height: "0.25em", padding: 0, margin: "12px 0", backgroundColor: "#30363d", border: 0 }} />,

    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="preview-link"
        style={{ color: "#58a6ff", textDecoration: "none", fontWeight: 500 }}
      >
        {children}
      </a>
    ),

    img: ({ src, alt }) => {
      const isShieldsBadge = typeof src === "string" && src.startsWith("https://img.shields.io/badge/");
      if (isShieldsBadge) {
        return (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={alt}
            style={{ display: "inline-block", height: 28, margin: "2px 2px" }}
          />
        );
      }
      /* eslint-disable-next-line @next/next/no-img-element */
      return (
        <img
          src={src}
          alt={alt}
          style={{ display: "block", margin: "12px auto", maxWidth: "100%", height: "auto", borderRadius: 6, border: "1px solid #30363d" }}
        />
      );
    },

    ul: ({ children }) => (
      <ul
        style={{
          margin: "0 0 8px",
          paddingLeft: 24,
          color: "#e6edf3",
          fontSize: 15,
          lineHeight: 1.6,
          listStyleType: "disc",
        }}
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol
        style={{
          margin: "0 0 8px",
          paddingLeft: 24,
          color: "#e6edf3",
          fontSize: 15,
          lineHeight: 1.6,
          listStyleType: "decimal",
        }}
      >
        {children}
      </ol>
    ),
    li: ({ children }) => <li style={{ marginBottom: 2, lineHeight: 1.6 }}>{children}</li>,

    strong: ({ children }) => <strong style={{ fontWeight: 600, color: "#f0f6fc" }}>{children}</strong>,
    em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
    del: ({ children }) => <del style={{ color: "#8b949e" }}>{children}</del>,
  };
};

export const getTableComponents = (isImageGrid: boolean, hasHiddenCaptions: boolean): Components => {
  if (!isImageGrid) {
    return {
      table: ({ children }) => (
        <div style={{ overflowX: "auto", margin: "12px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left", border: "1px solid #30363d" }}>
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => <thead style={{ borderBottom: "2px solid #30363d", background: "#161b22" }}>{children}</thead>,
      tbody: ({ children }) => <tbody>{children}</tbody>,
      tr: ({ children }) => <tr style={{ borderBottom: "1px solid #30363d" }}>{children}</tr>,
      th: ({ children }) => (
        <th style={{ padding: "8px 12px", fontWeight: 600, borderRight: "1px solid #30363d", color: "#f0f6fc" }}>
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td style={{ padding: "8px 12px", borderRight: "1px solid #30363d", color: "#c9d1d9" }}>
          {children}
        </td>
      ),
    };
  }

  return {
    table: ({ children }) => {
      const kids = React.Children.toArray(children);
      const tbody = kids.find(
        (c): c is React.ReactElement<{ children: React.ReactNode }> =>
          React.isValidElement(c) && c.type === "tbody"
      );

      const bodyChildren = tbody
        ? React.Children.toArray((tbody as any).props.children)
        : kids.filter((c): c is React.ReactElement => React.isValidElement(c) && c.type === "tr");

      if (!bodyChildren.length) {
        return (
          <div style={{ overflowX: "auto", margin: "12px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left", border: "1px solid #30363d" }}>
              {children}
            </table>
          </div>
        );
      }

      const bodyRows = bodyChildren;
      if (!bodyRows.length) {
        return (
          <div style={{ overflowX: "auto", margin: "12px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left", border: "1px solid #30363d" }}>
              {children}
            </table>
          </div>
        );
      }

      const cols = Math.max(...bodyRows.map((r: any) =>
        React.Children.count(r.props.children)
      ), 1);

      return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, margin: "12px 0" }}>
          {bodyRows.flatMap((row: any) =>
            React.Children.toArray(row.props.children).map((cell: any, ci: number) => {
              const imgEl = findImgInNode(cell.props.children);
              if (!imgEl) return null;
              const p = imgEl.props as any;
              return (
                <div key={ci} style={{ display: "flex", flexDirection: "column", borderRadius: 6, border: "1px solid #30363d", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt || "Image"} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block" }} />
                  {!hasHiddenCaptions && (
                    <div style={{ padding: "8px 10px", fontSize: 11, fontWeight: 600, color: "#8b949e", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", background: "rgba(255,255,255,0.03)", borderTop: "1px solid #30363d" }}>
                      {p.alt || "Untitled Image"}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      );
    },
    thead: ({ children }) => <thead style={{ borderBottom: "2px solid #30363d", background: "#161b22" }}>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr style={{ borderBottom: "1px solid #30363d" }}>{children}</tr>,
    th: ({ children }) => (
      <th style={{ padding: "8px 12px", fontWeight: 600, borderRight: "1px solid #30363d", color: "#f0f6fc" }}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td style={{ padding: "8px 12px", borderRight: "1px solid #30363d", color: "#c9d1d9" }}>
        {children}
      </td>
    ),
  };
};
