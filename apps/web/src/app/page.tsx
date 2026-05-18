"use client";

import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { MarkdownPreview } from "@/components/editor/MarkdownPreview";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useEffect, useState } from "react";
import { initRegistry } from "@/registry";

export default function EditorPage() {
  const [previewOpen, setPreviewOpen] = useState(true);

  useEffect(() => {
    initRegistry();
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden",
      background: "var(--bg-base)",
    }}>
      <EditorToolbar previewOpen={previewOpen} onTogglePreview={() => setPreviewOpen(v => !v)} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <EditorSidebar />
        <EditorCanvas />
        {previewOpen && <MarkdownPreview />}
      </div>
    </div>
  );
}
