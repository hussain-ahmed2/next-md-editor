"use client";

import { ChevronRight } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { buildNodePath } from "@/lib/workspace-storage";
import { FileTypeIcon } from "./FileTypeIcon";

/**
 * PyCharm-style breadcrumb bar shown below the editor tabs: the active
 * file's path through the project tree (workspace root → folders → file).
 */
export function Breadcrumbs() {
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const openFile = useWorkspaceStore((s) => s.openFile);
  const setExpanded = useWorkspaceStore((s) => s.setExpanded);

  if (!activeFileId || !nodes[activeFileId]) return null;

  const path = buildNodePath(nodes, activeFileId).split("/");
  const activeName = nodes[activeFileId].name;

  // Resolve each path segment back to a node id so folder crumbs can expand
  const segmentIds: (string | null)[] = [];
  let parentId: string | null = null;
  for (const segName of path) {
    const match = Object.values(nodes).find(
      (n) => n.parentId === parentId && n.name === segName,
    );
    segmentIds.push(match?.id ?? null);
    parentId = match?.id ?? null;
  }

  return (
    <div className="ide-breadcrumbs" aria-label="Breadcrumbs">
      <span className="ide-breadcrumb-seg" style={{ color: "var(--text-muted)" }}>
        Project
      </span>
      {path.map((seg, i) => {
        const isLast = i === path.length - 1;
        const id = segmentIds[i];
        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ChevronRight size={13} className="ide-breadcrumb-sep" />
            {isLast ? (
              <span
                className="ide-breadcrumb-seg current"
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <FileTypeIcon name={activeName} size={13} />
                {seg}
              </span>
            ) : (
              <span
                className="ide-breadcrumb-seg"
                style={{ cursor: id ? "pointer" : "default" }}
                onClick={() => {
                  if (id) setExpanded(id, true);
                }}
              >
                {seg}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
