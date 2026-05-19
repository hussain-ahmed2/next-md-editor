"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts } from "@/utils/editorShortcuts";
import { Trash2, Plus, LayoutGrid } from "lucide-react";

interface GridImage {
  id: string;
  url: string;
  alt: string;
}

const DEFAULT_IMAGES = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
    alt: "Fluid abstract shapes",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop",
    alt: "Glossy 3D composition",
  },
];

/**
 * Premium keyboard helper for input fields to support Ctrl+B / Ctrl+I text wrapping.
 */
function handleInputShortcuts(
  e: React.KeyboardEvent<HTMLInputElement>,
  value: string,
  onChange: (newValue: string) => void,
) {
  const hasMeta = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();

  if (hasMeta && (key === "i" || key === "b")) {
    e.preventDefault();
    e.stopPropagation();

    const input = e.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;

    const selected = value.substring(start, end);
    const wrapper = key === "b" ? "**" : "_";

    let newSelected = "";
    if (selected.startsWith(wrapper) && selected.endsWith(wrapper)) {
      newSelected = selected.slice(wrapper.length, -wrapper.length);
    } else {
      newSelected = `${wrapper}${selected}${wrapper}`;
    }

    const newValue =
      value.substring(0, start) + newSelected + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      input.focus();
      const offset = wrapper.length;
      if (selected.startsWith(wrapper) && selected.endsWith(wrapper)) {
        input.setSelectionRange(start, end - offset * 2);
      } else {
        input.setSelectionRange(start, end + offset * 2);
      }
    }, 0);
  }
}

export function ImageGridBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const indentBlocks = useEditorStore((s) => s.indentBlocks);
  const outdentBlocks = useEditorStore((s) => s.outdentBlocks);

  const images = (block.props.images as GridImage[]) ?? DEFAULT_IMAGES;
  const cols = (block.props.cols as number) ?? 2;
  const title = (block.props.title as string) ?? "";
  const description = (block.props.description as string) ?? "";
  const showCaptions = (block.props.showCaptions as boolean) ?? true;

  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [inputAlt, setInputAlt] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isSelected =
      selectedBlockIds[selectedBlockIds.length - 1] === block.id;
    if (isSelected && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [selectedBlockIds, block.id]);

  const handleUpdateCols = (newCols: number) => {
    updateBlock(block.id, {
      cols: newCols,
      images,
      title,
      description,
      showCaptions,
    });
  };

  const handleAddImage = () => {
    const newImage: GridImage = {
      id: Math.random().toString(36).substring(7),
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop",
      alt: "New architectural design",
    };
    updateBlock(block.id, {
      cols,
      images: [...images, newImage],
      title,
      description,
      showCaptions,
    });
  };

  const handleRemoveImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = images.filter((img) => img.id !== id);
    updateBlock(block.id, {
      cols,
      images: filtered.length ? filtered : DEFAULT_IMAGES,
      title,
      description,
      showCaptions,
    });
  };

  const handleStartEdit = (img: GridImage, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingImageId(img.id);
    setInputUrl(img.url);
    setInputAlt(img.alt);
  };

  const handleSaveEdit = () => {
    const updated = images.map((img) =>
      img.id === editingImageId
        ? { ...img, url: inputUrl, alt: inputAlt }
        : img,
    );
    updateBlock(block.id, {
      cols,
      images: updated,
      title,
      description,
      showCaptions,
    });
    setEditingImageId(null);
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && editingImageId) {
          e.preventDefault();
          handleSaveEdit();
          return;
        }
        handleEditorKeyboardShortcuts(
          e,
          block,
          blocks,
          selectedBlockIds,
          addBlock,
          removeBlocks,
          updateBlock,
          selectBlock,
          indentBlocks,
          outdentBlocks,
        );
      }}
      style={{
        outline: "none",
        width: "100%",
        padding: "12px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)",
        background: "rgba(255, 255, 255, 0.01)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Control panel bar */}
      <div
        contentEditable={false}
        className="image-grid-controls"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 8px",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="image-grid-title-wrapper"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <LayoutGrid size={14} style={{ color: "var(--accent)" }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            IMAGE GRID
          </span>
        </div>

        <div
          className="image-grid-actions"
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        >
          {/* Show Captions Toggle */}
          <label
            className="image-grid-captions-label"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={showCaptions}
              onChange={(e) =>
                updateBlock(block.id, {
                  cols,
                  images,
                  title,
                  description,
                  showCaptions: e.target.checked,
                })
              }
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: 14,
                height: 14,
                accentColor: "var(--accent)",
                cursor: "pointer",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              CAPTIONS
            </span>
          </label>

          {/* Custom Column Stepper */}
          <div
            className="image-grid-cols-wrapper"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              COLS:
            </span>
            <input
              type="number"
              min={1}
              max={8}
              value={cols}
              onChange={(e) => {
                const val = Math.max(
                  1,
                  Math.min(8, parseInt(e.target.value) || 2),
                );
                handleUpdateCols(val);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: 48,
                padding: "2px 6px",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 4,
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                textAlign: "center",
                outline: "none",
              }}
            />
          </div>

          <button
            className="image-grid-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleAddImage();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-surface)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Plus size={11} /> Add Image
          </button>
        </div>
      </div>

      {/* Grid Header Fields */}
      <div
        contentEditable={false}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "4px 4px 8px 4px",
          borderBottom: "1px dashed var(--border-subtle)",
        }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) =>
            updateBlock(block.id, {
              cols,
              images,
              title: e.target.value,
              description,
              showCaptions,
            })
          }
          onKeyDown={(e) => {
            e.stopPropagation();
            handleInputShortcuts(e, title, (val) => {
              updateBlock(block.id, {
                cols,
                images,
                title: val,
                description,
                showCaptions,
              });
            });
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Grid Title (optional)..."
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
            background: "transparent",
            border: "none",
            outline: "none",
            width: "100%",
          }}
        />
        <input
          type="text"
          value={description}
          onChange={(e) =>
            updateBlock(block.id, {
              cols,
              images,
              title,
              description: e.target.value,
              showCaptions,
            })
          }
          onKeyDown={(e) => {
            e.stopPropagation();
            handleInputShortcuts(e, description, (val) => {
              updateBlock(block.id, {
                cols,
                images,
                title,
                description: val,
                showCaptions,
              });
            });
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Grid Description (optional)..."
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            background: "transparent",
            border: "none",
            outline: "none",
            width: "100%",
          }}
        />
      </div>

      {/* Editor Modal for single Image properties */}
      {editingImageId && (
        <div
          contentEditable={false}
          style={{
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--bg-surface)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              IMAGE URL
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="https://example.com/image.png"
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: 12,
                outline: "none",
                fontFamily: "var(--font-mono)",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ALT TEXT
            </label>
            <input
              type="text"
              value={inputAlt}
              onChange={(e) => setInputAlt(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                handleInputShortcuts(e, inputAlt, setInputAlt);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Image description..."
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: 12,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingImageId(null);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveEdit();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: "5px 16px",
                borderRadius: 6,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Grid container */}
      <div
        contentEditable={false}
        className="image-grid-container"
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
              position: "relative",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              overflow: "hidden",
              background: "rgba(255,255,255,0.01)",
              display: "flex",
              flexDirection: "column",
              aspectRatio: showCaptions ? undefined : "16/10",
            }}
          >
            <div
              style={{
                position: "relative",
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

              {/* Hover actions menu bar */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(10, 10, 10, 0.4)",
                  opacity: 0,
                  transition: "opacity 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                <button
                  onClick={(e) => handleStartEdit(img, e)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "#161b22",
                    color: "#c9d1d9",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => handleRemoveImage(img.id, e)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid rgba(255,100,100,0.2)",
                    background: "rgba(248, 81, 73, 0.15)",
                    color: "#ff7b72",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            </div>

            {/* Bottom Caption Label Text */}
            {showCaptions && (
              <div
                style={{
                  padding: "8px 10px",
                  background: "var(--bg-elevated)",
                  borderTop: "1px solid var(--border-subtle)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
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
