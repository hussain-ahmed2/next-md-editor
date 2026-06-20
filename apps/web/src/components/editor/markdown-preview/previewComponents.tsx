"use client";

import React from "react";
import type { Components } from "react-markdown";
import { highlightCodeHtml } from "@/features/markdown/highlighter";
import { MermaidPreview } from "./MermaidPreview";
import { CALLOUT_TYPES } from "@/constants/calloutTypes";

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
            className="markdown-alert"
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
            <div style={{ color: "inherit", fontSize: 14, lineHeight: 1.6 }}>{bodyChildren}</div>
          </div>
        );
      }
      return <blockquote>{children}</blockquote>;
    },

    code: ({ children, className }) => {
      const lang = (className ?? "").replace("language-", "");
      const rawStr = String(children);
      const codeStr = rawStr.replace(/\n$/, "");
      if (lang === "mermaid") {
        return <MermaidPreview code={codeStr} />;
      }
      if (className || rawStr.includes("\n")) {
        return (
          <div style={{ position: "relative", overflow: "auto" }}>
            {lang && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 12,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  userSelect: "none",
                }}
              >
                {lang}
              </span>
            )}
            <pre>
              <code className={`language-${lang}`} dangerouslySetInnerHTML={{ __html: highlightCodeHtml(codeStr, lang || "ts") }} />
            </pre>
          </div>
        );
      }
      return <code>{children}</code>;
    },

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
      return <img src={src} alt={alt} />;
    },
  };
};

export const getTableComponents = (isImageGrid: boolean): Components => {
  if (!isImageGrid) {
    return {};
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
        return <table>{children}</table>;
      }

      const bodyRows = bodyChildren;
      if (!bodyRows.length) {
        return <table>{children}</table>;
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
                <div key={ci} style={{ display: "flex", flexDirection: "column", borderRadius: 6, border: "1px solid var(--border)", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt || "Image"} style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block" }} />
                </div>
              );
            })
          )}
        </div>
      );
    },
    thead: ({ children }) => <thead>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children }) => <th>{children}</th>,
    td: ({ children }) => <td>{children}</td>,
  };
};
