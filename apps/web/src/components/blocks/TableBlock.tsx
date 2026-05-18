"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { useState, useRef } from "react";
import { htmlToMarkdown } from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";

export function TableBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const rows = (block.props.rows as string[][]) ?? [["Column 1", "Column 2"], ["Cell 1", "Cell 2"]];
  const [focusedCell, setFocusedCell] = useState<{ rIdx: number; cIdx: number } | null>(null);

  // Add a new row to the table
  const addRow = () => {
    const colCount = rows[0]?.length || 2;
    const newRows = [...rows, Array(colCount).fill("New Cell")];
    updateBlock(block.id, { rows: newRows });
  };

  // Delete the last row
  const deleteRow = () => {
    if (rows.length <= 2) return; // Prevent deleting headers & first row
    const newRows = rows.slice(0, -1);
    updateBlock(block.id, { rows: newRows });
  };

  // Add a new column
  const addColumn = () => {
    const newRows = rows.map((r, idx) => [...r, idx === 0 ? `Column ${r.length + 1}` : "New Cell"]);
    updateBlock(block.id, { rows: newRows });
  };

  // Delete the last column
  const deleteColumn = () => {
    if (rows[0]?.length <= 1) return; // Retain at least 1 column
    const newRows = rows.map((r) => r.slice(0, -1));
    updateBlock(block.id, { rows: newRows });
  };

  const handleCellInput = (rIdx: number, cIdx: number, html: string) => {
    const markdownValue = htmlToMarkdown(html);
    const nextRows = rows.map((r, ri) =>
      ri === rIdx ? r.map((c, ci) => (ci === cIdx ? markdownValue : c)) : r
    );
    updateBlock(block.id, { rows: nextRows });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "8px 0" }}>
      {/* Visual Table Container */}
      <div style={{
        overflowX: "auto",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--bg-surface)",
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
          textAlign: "left",
        }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
              {rows[0]?.map((cell, cIdx) => {
                const isCellFocused = focusedCell?.rIdx === 0 && focusedCell?.cIdx === cIdx;
                return (
                  <th
                    key={cIdx}
                    contentEditable
                    suppressContentEditableWarning
                    onFocus={() => setFocusedCell({ rIdx: 0, cIdx })}
                    onBlur={() => setFocusedCell(null)}
                    onInput={(e) => handleCellInput(0, cIdx, e.currentTarget.innerHTML)}
                    style={{
                      padding: "10px 12px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      borderRight: "1px solid var(--border-subtle)",
                      outline: "none",
                      minWidth: 80,
                    }}
                    {...(!isCellFocused
                      ? {
                          dangerouslySetInnerHTML: {
                            __html: renderInlineMarkdown(cell) || "",
                          },
                        }
                      : {})}
                  />
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, rOffset) => {
              const rIdx = rOffset + 1;
              return (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    background: rIdx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                  }}
                >
                  {row.map((cell, cIdx) => {
                    const isCellFocused = focusedCell?.rIdx === rIdx && focusedCell?.cIdx === cIdx;
                    return (
                      <td
                        key={cIdx}
                        contentEditable
                        suppressContentEditableWarning
                        onFocus={() => setFocusedCell({ rIdx, cIdx })}
                        onBlur={() => setFocusedCell(null)}
                        onInput={(e) => handleCellInput(rIdx, cIdx, e.currentTarget.innerHTML)}
                        style={{
                          padding: "10px 12px",
                          color: "var(--text-secondary)",
                          borderRight: "1px solid var(--border-subtle)",
                          outline: "none",
                        }}
                        {...(!isCellFocused
                          ? {
                              dangerouslySetInnerHTML: {
                                __html: renderInlineMarkdown(cell) || "",
                              },
                            }
                          : {})}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Glassmorphic Action Bar */}
      <div style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "4px 8px",
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed var(--border)",
        borderRadius: 6,
      }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginRight: 4 }}>GRID CONTROLS:</span>
        <button
          onClick={addRow}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          ➕ Row
        </button>
        <button
          onClick={deleteRow}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          ➖ Row
        </button>
        <button
          onClick={addColumn}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          ➕ Col
        </button>
        <button
          onClick={deleteColumn}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          ➖ Col
        </button>
      </div>
    </div>
  );
}
