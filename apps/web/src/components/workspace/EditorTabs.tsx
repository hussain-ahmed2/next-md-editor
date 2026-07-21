"use client";

import { X } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

export function EditorTabs() {
  const openTabIds = useWorkspaceStore((s) => s.openTabIds);
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const dirtyFileIds = useWorkspaceStore((s) => s.dirtyFileIds);
  const openFile = useWorkspaceStore((s) => s.openFile);
  const closeTab = useWorkspaceStore((s) => s.closeTab);

  if (openTabIds.length === 0) return null;

  return (
    <div className="ws-tabs" role="tablist">
      {openTabIds.map((id) => {
        const node = nodes[id];
        if (!node) return null;
        const isActive = id === activeFileId;
        const isDirty = dirtyFileIds.includes(id);
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            className={`ws-tab${isActive ? " active" : ""}`}
            onClick={() => openFile(id)}
            onAuxClick={(e) => {
              // Middle-click closes the tab
              if (e.button === 1) {
                e.preventDefault();
                closeTab(id);
              }
            }}
            title={node.name}
          >
            {isDirty && <span className="ws-tab-dirty" title="Unsaved changes" />}
            <span>{node.name}</span>
            <span
              className="ws-tab-close"
              role="button"
              aria-label={`Close ${node.name}`}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(id);
              }}
            >
              <X size={12} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
