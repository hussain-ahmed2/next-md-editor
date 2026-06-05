"use client";

import React from "react";
import { Undo2, Redo2 } from "lucide-react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { ToolbarButton } from "./ToolbarButton";

export function UndoRedoButtons() {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  return (
    <>
      <ToolbarButton onClick={undo} id="btn-undo" tooltip="Undo (Ctrl+Z)">
        <Undo2 size={14} />
        <span className="btn-label">Undo</span>
      </ToolbarButton>
      <ToolbarButton onClick={redo} id="btn-redo" tooltip="Redo (Ctrl+Y)">
        <Redo2 size={14} />
        <span className="btn-label">Redo</span>
      </ToolbarButton>
    </>
  );
}
