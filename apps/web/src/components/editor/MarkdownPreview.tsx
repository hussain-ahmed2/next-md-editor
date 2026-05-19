"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { serializeToMarkdown } from "@/features/markdown/serializer";
import { useState } from "react";
import {
  highlightCodeHtml,
  renderInlineMarkdown,
} from "@/features/markdown/highlighter";
import {
  Info,
  Lightbulb,
  Megaphone,
  TriangleAlert,
  OctagonX,
  FileText,
} from "lucide-react";

export function MarkdownPreview({ width = 360 }: { width?: number }) {
  const blocks = useEditorStore((s) => s.blocks);
  const markdown = serializeToMarkdown(blocks);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

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
      {/* File badge/status explorer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 500,
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>next-md-editor</span>
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            document.md
          </span>
        </div>
        <span
          style={{
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--accent-muted)",
            color: "var(--accent)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          GitHub GFM View
        </span>
      </div>

      {/* GitHub Repository File Container Box */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#0d1117", // Exact GitHub Dark Theme background
          border: "1px solid #30363d", // Exact GitHub Dark border
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        {/* GitHub File Box Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            background: "#161b22", // Exact GitHub Dark header background
            borderBottom: "1px solid #30363d",
            height: 44,
            flexShrink: 0,
          }}
        >
          {/* File information */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12.5,
              color: "#c9d1d9",
              fontWeight: 500,
            }}
          >
            {/* File Icon */}
            <FileText size={14} style={{ color: "#7d8590" }} />
            <span>document.md</span>
            <span style={{ color: "#484f58", userSelect: "none" }}>|</span>
            <span style={{ fontSize: 11.5, color: "#8b949e" }}>
              {blocks.length} blocks
            </span>
          </div>

          {/* GitHub Tab Selectors */}
          <div
            style={{
              display: "flex",
              border: "1px solid #30363d",
              borderRadius: 6,
              overflow: "hidden",
              background: "#0d1117",
              padding: 2,
            }}
          >
            <button
              onClick={() => setActiveTab("preview")}
              style={{
                padding: "3px 12px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 4,
                border: "none",
                background: activeTab === "preview" ? "#21262d" : "transparent",
                color: activeTab === "preview" ? "#c9d1d9" : "#8b949e",
                cursor: "pointer",
                transition: "all 0.1s ease",
              }}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              style={{
                padding: "3px 12px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 4,
                border: "none",
                background: activeTab === "raw" ? "#21262d" : "transparent",
                color: activeTab === "raw" ? "#c9d1d9" : "#8b949e",
                cursor: "pointer",
                transition: "all 0.1s ease",
              }}
            >
              Code
            </button>
          </div>
        </div>

        {/* GitHub File Box Body */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "32px",
            background: "#0d1117",
          }}
        >
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
                fontFamily:
                  "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
                color: "#c9d1d9",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {markdown}
            </pre>
          ) : (
            <div
              className="markdown-body"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
                fontSize: "15px",
                lineHeight: 1.6,
                color: "#e6edf3",
                wordWrap: "break-word",
              }}
            >
              {blocks.map((block) => {
                switch (block.type) {
                  case "heading": {
                    const level = (block.props.level as number) ?? 1;
                    const text = (block.props.text as string) ?? "";

                    const headingStyles: Record<
                      number,
                      {
                        fontSize: string;
                        borderBottom: string;
                        paddingBottom: string;
                        color: string;
                      }
                    > = {
                      1: {
                        fontSize: "2em",
                        borderBottom: "1px solid #30363d",
                        paddingBottom: "0.3em",
                        color: "#f0f6fc",
                      },
                      2: {
                        fontSize: "1.5em",
                        borderBottom: "1px solid #30363d",
                        paddingBottom: "0.3em",
                        color: "#f0f6fc",
                      },
                      3: {
                        fontSize: "1.25em",
                        borderBottom: "none",
                        paddingBottom: "0",
                        color: "#f0f6fc",
                      },
                      4: {
                        fontSize: "1.1em",
                        borderBottom: "none",
                        paddingBottom: "0",
                        color: "#f0f6fc",
                      },
                      5: {
                        fontSize: "1em",
                        borderBottom: "none",
                        paddingBottom: "0",
                        color: "#f0f6fc",
                      },
                      6: {
                        fontSize: "0.85em",
                        borderBottom: "none",
                        paddingBottom: "0",
                        color: "#8b949e",
                      },
                    };

                    const hStyle = headingStyles[level] ?? headingStyles[3];

                    return (
                      <div
                        key={block.id}
                        style={{
                          fontSize: hStyle.fontSize,
                          fontWeight: 600,
                          lineHeight: 1.25,
                          color: hStyle.color,
                          borderBottom: hStyle.borderBottom,
                          paddingBottom: hStyle.paddingBottom,
                          marginTop: 12,
                          wordBreak: "break-word",
                        }}
                      >
                        {text ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: renderInlineMarkdown(text),
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              color: "rgba(255,255,255,0.1)",
                              fontStyle: "italic",
                            }}
                          >
                            Heading {level}
                          </span>
                        )}
                      </div>
                    );
                  }
                  case "paragraph": {
                    const text = (block.props.text as string) ?? "";
                    const isBullet =
                      text.startsWith("- ") || text.startsWith("* ");
                    const numberMatch = text.match(/^(\d+)\.\s(.*)$/);

                    if (isBullet) {
                      const cleanText = text.slice(2);
                      return (
                        <div
                          key={block.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            fontSize: 15,
                            lineHeight: 1.6,
                            color: "#e6edf3",
                            paddingLeft: 8,
                          }}
                        >
                          <span
                            style={{ color: "#8b949e", userSelect: "none" }}
                          >
                            •
                          </span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: renderInlineMarkdown(cleanText),
                            }}
                            style={{ flex: 1, wordBreak: "break-word" }}
                          />
                        </div>
                      );
                    }

                    if (numberMatch) {
                      const num = numberMatch[1];
                      const cleanText = numberMatch[2];
                      return (
                        <div
                          key={block.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            fontSize: 15,
                            lineHeight: 1.6,
                            color: "#e6edf3",
                            paddingLeft: 8,
                          }}
                        >
                          <span
                            style={{
                              color: "#8b949e",
                              userSelect: "none",
                              minWidth: 16,
                            }}
                          >
                            {num}.
                          </span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: renderInlineMarkdown(cleanText),
                            }}
                            style={{ flex: 1, wordBreak: "break-word" }}
                          />
                        </div>
                      );
                    }

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
                        {text ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: renderInlineMarkdown(text),
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              color: "rgba(255,255,255,0.1)",
                              fontStyle: "italic",
                            }}
                          >
                            Empty paragraph
                          </span>
                        )}
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
                          <p
                            key={idx}
                            style={{ margin: 0, lineHeight: 1.6, fontSize: 15 }}
                          >
                            {line ? (
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: renderInlineMarkdown(line),
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  color: "rgba(255,255,255,0.06)",
                                  fontStyle: "italic",
                                }}
                              >
                                Empty quote line
                              </span>
                            )}
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
                            fontFamily:
                              "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: "#e6edf3",
                            whiteSpace: "pre",
                          }}
                        >
                          <code
                            dangerouslySetInnerHTML={{
                              __html: highlightCodeHtml(
                                code || "// Empty code block",
                                lang,
                              ),
                            }}
                          />
                        </pre>
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
                  case "image": {
                    const url = (block.props.url as string) ?? "";
                    const alt = (block.props.alt as string) ?? "";
                    return (
                      <div
                        key={block.id}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          margin: "12px 0",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={alt}
                          style={{
                            maxWidth: "100%",
                            height: "auto",
                            borderRadius: 6,
                            border: "1px solid #30363d",
                          }}
                        />
                      </div>
                    );
                  }
                  case "image-grid": {
                    const images = (block.props.images as any[]) ?? [];
                    const cols = (block.props.cols as number) ?? 2;
                    const title = (block.props.title as string) ?? "";
                    const description =
                      (block.props.description as string) ?? "";
                    const showCaptions =
                      (block.props.showCaptions as boolean) ?? true;
                    return (
                      <div
                        key={block.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          margin: "16px 0",
                        }}
                      >
                        {title.trim() && (
                          <h4
                            style={{
                              margin: "0 0 2px 0",
                              fontSize: "1.15em",
                              color: "#f0f6fc",
                              fontWeight: 600,
                            }}
                          >
                            {title.trim()}
                          </h4>
                        )}
                        {description.trim() && (
                          <div
                            style={{
                              margin: "0 0 6px 0",
                              fontSize: "0.9em",
                              color: "#8b949e",
                              fontStyle: "italic",
                            }}
                          >
                            {description.trim()}
                          </div>
                        )}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${cols}, 1fr)`,
                            gap: 12,
                            width: "100%",
                          }}
                        >
                          {images.map((img) => (
                            <div
                              key={img.id}
                              style={{
                                borderRadius: 6,
                                overflow: "hidden",
                                border: "1px solid #30363d",
                                display: "flex",
                                flexDirection: "column",
                                background: "#0d1117",
                                aspectRatio: showCaptions ? undefined : "16/10",
                              }}
                            >
                              <div
                                style={{
                                  width: "100%",
                                  aspectRatio: showCaptions ? "16/10" : "100%",
                                  height: showCaptions ? undefined : "100%",
                                  overflow: "hidden",
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img.url}
                                  alt={img.alt}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />
                              </div>
                              {showCaptions && (
                                <div
                                  style={{
                                    padding: "6px 8px",
                                    borderTop: "1px solid #30363d",
                                    fontSize: 11,
                                    fontWeight: 500,
                                    color: "#8b949e",
                                    textAlign: "center",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {img.alt || "Untitled Image"}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  case "table": {
                    const rows = (block.props.rows as string[][]) ?? [["", ""]];
                    return (
                      <div
                        key={block.id}
                        style={{ overflowX: "auto", margin: "12px 0" }}
                      >
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: 14,
                            textAlign: "left",
                            border: "1px solid #30363d",
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                borderBottom: "2px solid #30363d",
                                background: "#161b22",
                              }}
                            >
                              {rows[0]?.map((cell, cIdx) => (
                                <th
                                  key={cIdx}
                                  style={{
                                    padding: "8px 12px",
                                    fontWeight: 600,
                                    borderRight: "1px solid #30363d",
                                    color: "#f0f6fc",
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: renderInlineMarkdown(cell) || "",
                                  }}
                                />
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.slice(1).map((row, rOffset) => {
                              const rIdx = rOffset + 1;
                              return (
                                <tr
                                  key={rIdx}
                                  style={{
                                    borderBottom: "1px solid #30363d",
                                    background:
                                      rIdx % 2 === 0
                                        ? "#161b22"
                                        : "transparent",
                                  }}
                                >
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      style={{
                                        padding: "8px 12px",
                                        borderRight: "1px solid #30363d",
                                        color: "#c9d1d9",
                                      }}
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          renderInlineMarkdown(cell) || "",
                                      }}
                                    />
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  case "callout": {
                    const text = (block.props.text as string) ?? "";
                    const type = (
                      (block.props.type as string) ?? "note"
                    ).toLowerCase();

                    const alertThemes: Record<
                      string,
                      {
                        label: string;
                        icon: React.ReactNode;
                        border: string;
                        bg: string;
                        text: string;
                      }
                    > = {
                      note: {
                        label: "Note",
                        icon: <Info size={14} />,
                        border: "#388bfd",
                        bg: "rgba(56, 139, 253, 0.08)",
                        text: "#58a6ff",
                      },
                      tip: {
                        label: "Tip",
                        icon: <Lightbulb size={14} />,
                        border: "#3fb950",
                        bg: "rgba(63, 185, 80, 0.08)",
                        text: "#56d364",
                      },
                      important: {
                        label: "Important",
                        icon: <Megaphone size={14} />,
                        border: "#a371f7",
                        bg: "rgba(163, 113, 247, 0.08)",
                        text: "#bc8cff",
                      },
                      warning: {
                        label: "Warning",
                        icon: <TriangleAlert size={14} />,
                        border: "#d29922",
                        bg: "rgba(210, 153, 34, 0.08)",
                        text: "#e3b341",
                      },
                      caution: {
                        label: "Caution",
                        icon: <OctagonX size={14} />,
                        border: "#f85149",
                        bg: "rgba(248, 113, 113, 0.08)",
                        text: "#ff7b72",
                      },
                    };
                    const theme = alertThemes[type] ?? alertThemes.note;

                    return (
                      <div
                        key={block.id}
                        style={{
                          padding: "12px 16px",
                          borderRadius: 6,
                          border: "1px solid #30363d",
                          borderLeft: `4px solid ${theme.border}`,
                          background: theme.bg,
                          margin: "12px 0",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: theme.text,
                            marginBottom: 6,
                          }}
                        >
                          <span>{theme.icon}</span>
                          <span>{theme.label}</span>
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            lineHeight: 1.6,
                            color: "#c9d1d9",
                          }}
                        >
                          {text.split("\n").map((line, idx) => (
                            <p key={idx} style={{ margin: 0 }}>
                              {line ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: renderInlineMarkdown(line),
                                  }}
                                />
                              ) : (
                                <br />
                              )}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  case "bullet-list":
                  case "numbered-list": {
                    const html = (block.props.html as string) ?? "";
                    const pattern =
                      (block.props.pattern as string) ?? "decimal-alpha-roman";
                    return (
                      <div
                        key={block.id}
                        className={`rich-list-content pattern-${pattern}`}
                        style={{
                          fontSize: 15,
                          lineHeight: 1.6,
                          color: "#e6edf3",
                        }}
                        dangerouslySetInnerHTML={{ __html: html }}
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
      </div>
    </aside>
  );
}
