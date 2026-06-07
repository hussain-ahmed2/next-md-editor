"use client";

import { useState, useRef } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts } from "@/utils/editorShortcuts";
import { useBlockFocus } from "@/hooks/useBlockFocus";
import { type GridImage, DEFAULT_IMAGES } from "./image-grid/types";
import { ImageGridControls } from "./image-grid/ImageGridControls";
import { ImageEditForm } from "./image-grid/ImageEditForm";
import { ImageGridItem } from "./image-grid/ImageGridItem";

export function ImageGridBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const images = (block.props.images as GridImage[]) ?? DEFAULT_IMAGES;
  const cols = (block.props.cols as number) ?? 2;
  const showCaptions = (block.props.showCaptions as boolean) ?? true;

  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [inputAlt, setInputAlt] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useBlockFocus(ref, block.id, selectedBlockIds);

  const handleUpdateCols = (newCols: number) => {
    updateBlock(block.id, {
      cols: newCols,
      images,
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
      showCaptions,
    });
  };

  const handleRemoveImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = images.filter((img) => img.id !== id);
    updateBlock(block.id, {
      cols,
      images: filtered.length ? filtered : DEFAULT_IMAGES,
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
        );
      }}
      style={{
        outline: "none",
        width: "100%",
        padding: "12px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <ImageGridControls
        cols={cols}
        showCaptions={showCaptions}
        onUpdateCols={handleUpdateCols}
        onUpdateShowCaptions={(show) =>
          updateBlock(block.id, {
            cols,
            images,
            showCaptions: show,
          })
        }
        onAddImage={handleAddImage}
      />

      {editingImageId && (
        <ImageEditForm
          inputUrl={inputUrl}
          setInputUrl={setInputUrl}
          inputAlt={inputAlt}
          setInputAlt={setInputAlt}
          onCancel={() => setEditingImageId(null)}
          onSave={handleSaveEdit}
        />
      )}

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
          <ImageGridItem
            key={img.id}
            img={img}
            showCaptions={showCaptions}
            onStartEdit={handleStartEdit}
            onRemove={handleRemoveImage}
          />
        ))}
      </div>
    </div>
  );
}
