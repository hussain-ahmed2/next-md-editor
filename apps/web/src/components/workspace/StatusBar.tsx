"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { buildNodePath, getFileFormat } from "@/lib/workspace-storage";
import { getDocStats } from "@/features/document-stats";

export function StatusBar() {
  const saveStatus = useUIStore((s) => s.saveStatus);
  const plainText = useUIStore((s) => s.plainText);
  const blocks = useEditorStore((s) => s.blocks);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);

  const activeNode = activeFileId ? nodes[activeFileId] : null;
  const path = activeNode ? buildNodePath(nodes, activeNode.id) : null;
  const isText = activeNode ? getFileFormat(activeNode.name) === "text" : false;
  const stats = !isText ? getDocStats(blocks) : null;

  return (
    <footer className="ws-statusbar">
      <div className="ws-statusbar-group">
        <span className="ws-statusbar-path">{path ?? "No file open"}</span>
      </div>
      <div className="ws-statusbar-group">
        {isText && activeNode ? (
          <span className="ws-statusbar-item">{plainText.length} chars</span>
        ) : stats && stats.words > 0 ? (
          <>
            <span className="ws-statusbar-item">{blocks.length} blocks</span>
            <span className="ws-statusbar-item">
              {stats.words} words · {stats.readingTime}
            </span>
          </>
        ) : null}
        {saveStatus === "saving" && (
          <span className="ws-statusbar-item" style={{ color: "var(--warning)" }}>
            <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
            Saving…
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="ws-statusbar-item" style={{ color: "var(--success)" }}>
            <CheckCheck size={11} />
            Saved to browser
          </span>
        )}
      </div>
    </footer>
  );
}
