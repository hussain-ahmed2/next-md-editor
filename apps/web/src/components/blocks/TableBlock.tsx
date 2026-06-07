"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { useState, useRef, useEffect } from "react";
import { htmlToMarkdown } from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";
import { PlusCircle, MinusCircle, Columns2, Rows2 } from "lucide-react";

export function TableBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const blocks = useEditorStore((s) => s.blocks);
  const myBlock = blocks.find((b) => b.id === block.id) ?? block;
  const rows = (myBlock.props.rows as string[][]) ?? [["Column 1", "Column 2"], ["Cell 1", "Cell 2"]];
  const [focusedCell, setFocusedCell] = useState<{ rIdx: number; cIdx: number } | null>(null);

  // A map of refs keyed by "rIdx-cIdx" for imperative DOM access
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());

  const setCellRef = (rIdx: number, cIdx: number) => (el: HTMLElement | null) => {
    const key = `${rIdx}-${cIdx}`;
    if (el) cellRefs.current.set(key, el);
    else cellRefs.current.delete(key);
  };

  // When focus changes to a new cell, imperatively populate its innerHTML
  // so React's removal of dangerouslySetInnerHTML doesn't clear the content
  useEffect(() => {
    if (focusedCell) {
      const { rIdx, cIdx } = focusedCell;
      const key = `${rIdx}-${cIdx}`;
      const el = cellRefs.current.get(key);
      const cellValue = rows[rIdx]?.[cIdx] ?? "";
      if (el) {
        el.innerHTML = renderInlineMarkdown(cellValue);
        // Move caret to end
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }, [focusedCell]);

  // Sync cell content when rows change from outside (undo/redo)
  useEffect(() => {
    rows.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        const key = `${rIdx}-${cIdx}`;
        const el = cellRefs.current.get(key);
        if (el && document.activeElement !== el) {
          const currentMarkdown = htmlToMarkdown(el.innerHTML);
          if (currentMarkdown !== cell) {
            el.innerHTML = renderInlineMarkdown(cell);
          }
        }
      });
    });
  }, [rows]);

  const handleCellInput = (rIdx: number, cIdx: number, html: string) => {
    const markdownValue = htmlToMarkdown(html);
    const nextRows = rows.map((r, ri) =>
      ri === rIdx ? r.map((c, ci) => (ci === cIdx ? markdownValue : c)) : r
    );
    updateBlock(block.id, { rows: nextRows });
  };

  const handleCellBlur = (rIdx: number, cIdx: number, html: string) => {
    setFocusedCell(null);
    const markdownValue = htmlToMarkdown(html);
    const nextRows = rows.map((r, ri) =>
      ri === rIdx ? r.map((c, ci) => (ci === cIdx ? markdownValue : c)) : r
    );
    updateBlock(block.id, { rows: nextRows });
  };

  // Add a new row to the table
  const addRow = () => {
    const colCount = rows[0]?.length || 2;
    const newRows = [...rows, Array(colCount).fill("New Cell")];
    updateBlock(block.id, { rows: newRows });
  };

  // Delete the last row (keep header + at least 1 data row)
  const deleteRow = () => {
    if (rows.length <= 2) return;
    updateBlock(block.id, { rows: rows.slice(0, -1) });
  };

  // Add a new column
  const addColumn = () => {
    const newRows = rows.map((r, idx) => [...r, idx === 0 ? `Column ${r.length + 1}` : "New Cell"]);
    updateBlock(block.id, { rows: newRows });
  };

  // Delete the last column
  const deleteColumn = () => {
    if (rows[0]?.length <= 1) return;
    updateBlock(block.id, { rows: rows.map((r) => r.slice(0, -1)) });
  };

  const renderCellContent = (rIdx: number, cIdx: number, cell: string, isHeader: boolean) => {
    const isCellFocused = focusedCell?.rIdx === rIdx && focusedCell?.cIdx === cIdx;
    const Tag = isHeader ? "th" : "td";

    return (
      <Tag
        key={cIdx}
        // @ts-ignore - ref callback for map
        ref={setCellRef(rIdx, cIdx)}
        contentEditable
        data-block-id={block.id}
        suppressContentEditableWarning
        onFocus={() => setFocusedCell({ rIdx, cIdx })}
        onBlur={(e) => handleCellBlur(rIdx, cIdx, e.currentTarget.innerHTML)}
        onInput={(e) => handleCellInput(rIdx, cIdx, e.currentTarget.innerHTML)}
        style={{
          padding: "10px 12px",
          fontWeight: isHeader ? 600 : 400,
          color: isHeader ? "var(--text-primary)" : "var(--text-secondary)",
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
            <tr style={{ borderBottom: "2px solid var(--border)", background: "var(--bg-elevated)" }}>
              {rows[0]?.map((cell, cIdx) => renderCellContent(0, cIdx, cell, true))}
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
                    background: rIdx % 2 === 0 ? "var(--bg-hover)" : "transparent",
                  }}
                >
                  {row.map((cell, cIdx) => renderCellContent(rIdx, cIdx, cell, false))}
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
        background: "var(--bg-elevated)",
        border: "1px dashed var(--border)",
        borderRadius: 6,
      }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginRight: 4 }}>GRID CONTROLS:</span>
        {[
          { label: "Add Row",    icon: <><PlusCircle size={12} /> Row</>,     action: addRow },
          { label: "Delete Row", icon: <><MinusCircle size={12} /> Row</>,    action: deleteRow },
          { label: "Add Col",    icon: <><Columns2 size={12} /> Add Col</>,   action: addColumn },
          { label: "Delete Col", icon: <><Rows2 size={12} /> Del Col</>,      action: deleteColumn },
        ].map(({ label, icon, action }) => (
          <button
            key={label}
            onClick={action}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
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
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
