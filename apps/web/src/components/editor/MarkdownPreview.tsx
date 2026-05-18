"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { serializeToMarkdown } from "@/features/markdown/serializer";
import { useState } from "react";

export function MarkdownPreview() {
  const blocks = useEditorStore((s) => s.blocks);
  const markdown = serializeToMarkdown(blocks);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

  return (
    <aside style={{
      width: 360,
      background: "var(--bg-surface)",
      borderLeft: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      overflow: "hidden",
    }}>
      {/* Header and Tab Switcher */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: 48,
        borderBottom: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "inline-block",
          }} />
          Preview
        </div>
        <div style={{
          display: "flex",
          gap: 4,
          background: "var(--bg-base)",
          padding: 3,
          borderRadius: 6,
          border: "1px solid var(--border)",
        }}>
          <button
            onClick={() => setActiveTab("preview")}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 4,
              border: "none",
              background: activeTab === "preview" ? "var(--bg-elevated)" : "transparent",
              color: activeTab === "preview" ? "var(--text-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Rendered
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 4,
              border: "none",
              background: activeTab === "raw" ? "var(--bg-elevated)" : "transparent",
              color: activeTab === "raw" ? "var(--text-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Raw MD
          </button>
        </div>
      </div>

      {/* Preview Content Container */}
      <div style={{
        flex: 1,
        overflow: "auto",
        padding: "24px 20px",
      }}>
        {blocks.length === 0 ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "var(--text-muted)",
            fontSize: 13,
            fontStyle: "italic",
            textAlign: "center",
          }}>
            Add blocks to see active preview…
          </div>
        ) : activeTab === "raw" ? (
          <pre style={{
            margin: 0,
            fontSize: 12.5,
            lineHeight: 1.7,
            fontFamily: "var(--font-mono)",
            color: "var(--text-secondary)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {markdown}
          </pre>
        ) : (
          <div className="github-gfm-preview" style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            color: "#e6edf3",
          }}>
            {blocks.map((block) => {
              switch (block.type) {
                case "heading": {
                  const level = (block.props.level as number) ?? 1;
                  const text = (block.props.text as string) ?? "";
                  const fontSize = level === 1 ? "2em" : level === 2 ? "1.5em" : "1.25em";
                  const borderBottom = level <= 2 ? "1px solid #30363d" : "none";
                  const paddingBottom = level <= 2 ? "0.3em" : "0";

                  return (
                    <div
                      key={block.id}
                      style={{
                        fontSize,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        color: "#f0f6fc",
                        borderBottom,
                        paddingBottom,
                        marginTop: 12,
                        wordBreak: "break-word",
                      }}
                    >
                      {text || <span style={{ color: "rgba(255,255,255,0.15)", fontStyle: "italic" }}>Heading {level}</span>}
                    </div>
                  );
                }
                case "paragraph": {
                  const text = (block.props.text as string) ?? "";
                  return (
                    <p
                      key={block.id}
                      style={{
                        margin: 0,
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: "#e6edf3",
                        wordBreak: "break-word",
                      }}
                    >
                      {text || <span style={{ color: "rgba(255,255,255,0.15)", fontStyle: "italic" }}>Empty paragraph</span>}
                    </p>
                  );
                }
                case "quote": {
                  const text = (block.props.text as string) ?? "";
                  return (
                    <blockquote
                      key={block.id}
                      style={{
                        margin: 0,
                        padding: "0 1em",
                        color: "#8b949e",
                        borderLeft: "4px solid #30363d",
                      }}
                    >
                      {text.split("\n").map((line, idx) => (
                        <p key={idx} style={{ margin: 0, lineHeight: 1.6, fontSize: 15 }}>
                          {line || <span style={{ color: "rgba(255,255,255,0.1)", fontStyle: "italic" }}>Empty quote line</span>}
                        </p>
                      ))}
                    </blockquote>
                  );
                }
                case "code": {
                  const code = (block.props.code as string) ?? "";
                  const lang = (block.props.language as string) ?? "";
                  return (
                    <div
                      key={block.id}
                      style={{
                        position: "relative",
                        borderRadius: 6,
                        background: "#161b22",
                        border: "1px solid #30363d",
                        padding: 16,
                        overflow: "auto",
                      }}
                    >
                      {lang && (
                        <span style={{
                          position: "absolute",
                          top: 6,
                          right: 12,
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          color: "#8b949e",
                          userSelect: "none",
                        }}>{lang}</span>
                      )}
                      <pre style={{
                        margin: 0,
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "#e6edf3",
                        whiteSpace: "pre",
                      }}>{code || "// Empty code block"}</pre>
                    </div>
                  );
                }
                case "divider": {
                  return (
                    <hr
                      key={block.id}
                      style={{
                        height: "0.25em",
                        padding: 0,
                        margin: "12px 0",
                        backgroundColor: "#30363d",
                        border: 0,
                      }}
                    />
                  );
                }
                default:
                  return null;
              }
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
