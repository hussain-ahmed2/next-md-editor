"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronsDownUp,
  Copy,
  FilePlus,
  FileText,
  File as FileIcon,
  FileCode,
  FileJson,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import type { FileNode } from "@next-md-editor/types";
import { useDraggable, useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { getExtension, isMarkdownFile, sortedChildren } from "@/lib/workspace-storage";
import { useUIStore } from "@/store/uiStore";

export const TREE_ROOT_DROP_ID = "tree-root-drop";
export const TREE_NODE_TYPE = "tree-node";

const CODE_EXTS = new Set(["js", "jsx", "ts", "tsx", "css", "html", "yml", "yaml", "sh", "py", "toml", "xml"]);

function FileTypeIcon({ name, size = 15 }: { name: string; size?: number }) {
  if (isMarkdownFile(name)) return <FileText size={size} />;
  const ext = getExtension(name);
  if (ext === "json") return <FileJson size={size} />;
  if (CODE_EXTS.has(ext)) return <FileCode size={size} />;
  return <FileIcon size={size} />;
}

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string | null; // null = tree background (root scope)
}

interface CreatingState {
  parentId: string | null;
  kind: "file" | "folder";
}

function InlineNameInput({
  defaultValue,
  onCommit,
  onCancel,
}: {
  defaultValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    // Select the stem, not the extension — the IDE rename convention.
    const dot = defaultValue.lastIndexOf(".");
    input.setSelectionRange(0, dot > 0 ? dot : defaultValue.length);
  }, [defaultValue]);

  const commit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    const value = inputRef.current?.value.trim() ?? "";
    if (value) onCommit(value);
    else onCancel();
  };

  return (
    <input
      ref={inputRef}
      className="ws-tree-input"
      defaultValue={defaultValue}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          committedRef.current = true;
          onCancel();
        }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

interface FileTreeRowProps {
  node: FileNode;
  depth: number;
  isExpanded: boolean;
  isActive: boolean;
  isFocused: boolean;
  isRenaming: boolean;
  onRowClick: () => void;
  onRowDoubleClick: () => void;
  onRowContextMenu: (e: React.MouseEvent) => void;
  onRenameCommit: (value: string) => void;
  onRenameCancel: () => void;
}

function FileTreeRow({
  node,
  depth,
  isExpanded,
  isActive,
  isFocused,
  isRenaming,
  onRowClick,
  onRowDoubleClick,
  onRowContextMenu,
  onRenameCommit,
  onRenameCancel,
}: FileTreeRowProps) {
  const isFolder = node.kind === "folder";

  const { ref: dragRef, isDragging } = useDraggable({
    id: `tree-${node.id}`,
    type: TREE_NODE_TYPE,
    data: { isTreeNode: true, nodeId: node.id, nodeName: node.name, nodeKind: node.kind },
    disabled: isRenaming,
  });

  // Folders are drop targets for other tree nodes. Higher collision
  // priority than the tree background so a folder row wins over "root".
  const { ref: dropRef, isDropTarget } = useDroppable({
    id: `treedrop-${node.id}`,
    accept: TREE_NODE_TYPE,
    disabled: !isFolder,
    collisionPriority: CollisionPriority.High,
    data: { isTreeFolderDrop: true, folderId: node.id },
  });

  const setRefs = (el: HTMLDivElement | null) => {
    (dragRef as (el: Element | null) => void)(el);
    if (isFolder) (dropRef as (el: Element | null) => void)(el);
  };

  return (
    <div
      ref={setRefs}
      className={`ws-tree-row${isActive ? " active" : ""}${isFocused && !isActive ? " focused" : ""}${
        isDropTarget ? " drop-target" : ""
      }`}
      style={{ paddingLeft: 8 + depth * 14, opacity: isDragging ? 0.4 : 1 }}
      data-tree-node-id={node.id}
      onClick={onRowClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onRowDoubleClick();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRowContextMenu(e);
      }}
    >
      <span className={`ws-tree-chevron${isExpanded ? " expanded" : ""}`}>
        {isFolder && <ChevronRight size={13} />}
      </span>
      <span className="ws-tree-icon">
        {isFolder ? (
          isExpanded ? (
            <FolderOpen size={15} />
          ) : (
            <Folder size={15} />
          )
        ) : (
          <FileTypeIcon name={node.name} />
        )}
      </span>
      {isRenaming ? (
        <InlineNameInput
          defaultValue={node.name}
          onCommit={onRenameCommit}
          onCancel={onRenameCancel}
        />
      ) : (
        <span className="ws-tree-name">{node.name}</span>
      )}
    </div>
  );
}

export function FileTree() {
  const nodes = useWorkspaceStore((s) => s.nodes);
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);
  const expandedFolderIds = useWorkspaceStore((s) => s.expandedFolderIds);
  const renamingNodeId = useWorkspaceStore((s) => s.renamingNodeId);
  const openFile = useWorkspaceStore((s) => s.openFile);
  const toggleFolder = useWorkspaceStore((s) => s.toggleFolder);
  const createFile = useWorkspaceStore((s) => s.createFile);
  const createFolder = useWorkspaceStore((s) => s.createFolder);
  const renameNode = useWorkspaceStore((s) => s.renameNode);
  const deleteNode = useWorkspaceStore((s) => s.deleteNode);
  const duplicateFile = useWorkspaceStore((s) => s.duplicateFile);
  const setRenamingNodeId = useWorkspaceStore((s) => s.setRenamingNodeId);
  const setExpanded = useWorkspaceStore((s) => s.setExpanded);
  const isMobile = useUIStore((s) => s.isMobile);
  const setMobileTab = useUIStore((s) => s.setMobileTab);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [creating, setCreating] = useState<CreatingState | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  // The tree background is a drop target meaning "move to root"
  const { ref: rootDropRef, isDropTarget: isRootDropTarget } = useDroppable({
    id: TREE_ROOT_DROP_ID,
    accept: TREE_NODE_TYPE,
    collisionPriority: CollisionPriority.Low,
    data: { isTreeRootDrop: true },
  });

  const expanded = new Set(expandedFolderIds);

  // Flattened list of visible nodes, in render order (for keyboard nav)
  const visible: { node: FileNode; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const node of sortedChildren(nodes, parentId)) {
      visible.push({ node, depth });
      if (node.kind === "folder" && expanded.has(node.id)) walk(node.id, depth + 1);
    }
  };
  walk(null, 0);

  const closeMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (!contextMenu) return;
    const onDown = () => closeMenu();
    window.addEventListener("mousedown", onDown);
    window.addEventListener("blur", onDown);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("blur", onDown);
    };
  }, [contextMenu, closeMenu]);

  const handleOpenFile = (id: string) => {
    openFile(id);
    if (isMobile) setMobileTab("editor");
  };

  const startCreate = (parentId: string | null, kind: "file" | "folder") => {
    if (parentId) setExpanded(parentId, true);
    setCreating({ parentId, kind });
    closeMenu();
  };

  const confirmDelete = (id: string) => {
    const node = nodes[id];
    if (!node) return;
    const label = node.kind === "folder" ? `folder "${node.name}" and everything in it` : `"${node.name}"`;
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      deleteNode(id);
    }
    closeMenu();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (renamingNodeId || creating) return;
    const idx = visible.findIndex((v) => v.node.id === focusedId);
    const focusAt = (i: number) => {
      const clamped = Math.max(0, Math.min(i, visible.length - 1));
      if (visible[clamped]) setFocusedId(visible[clamped].node.id);
    };
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(idx < 0 ? 0 : idx + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusAt(idx < 0 ? 0 : idx - 1);
        break;
      case "ArrowRight": {
        e.preventDefault();
        const node = visible[idx]?.node;
        if (node?.kind === "folder") setExpanded(node.id, true);
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        const node = visible[idx]?.node;
        if (node?.kind === "folder" && expanded.has(node.id)) setExpanded(node.id, false);
        else if (node?.parentId) setFocusedId(node.parentId);
        break;
      }
      case "Enter": {
        e.preventDefault();
        const node = visible[idx]?.node;
        if (!node) break;
        if (node.kind === "folder") toggleFolder(node.id);
        else handleOpenFile(node.id);
        break;
      }
      case "F2": {
        e.preventDefault();
        if (focusedId) setRenamingNodeId(focusedId);
        break;
      }
      case "Delete": {
        e.preventDefault();
        if (focusedId) confirmDelete(focusedId);
        break;
      }
    }
  };

  const renderCreatingRow = (depth: number) => {
    if (!creating) return null;
    const { kind, parentId } = creating;
    return (
      <div className="ws-tree-row" style={{ paddingLeft: 8 + depth * 14 }}>
        <span className="ws-tree-chevron" />
        <span className="ws-tree-icon">
          {kind === "folder" ? <Folder size={15} /> : <FileIcon size={15} />}
        </span>
        <InlineNameInput
          defaultValue={kind === "file" ? "untitled.md" : ""}
          onCommit={(value) => {
            if (kind === "file") {
              const id = createFile(parentId, value);
              if (id && isMobile) setMobileTab("editor");
            } else {
              createFolder(parentId, value);
            }
            setCreating(null);
          }}
          onCancel={() => setCreating(null)}
        />
      </div>
    );
  };

  const renderNode = (node: FileNode, depth: number): React.ReactNode => {
    const isFolder = node.kind === "folder";
    const isExpanded = isFolder && expanded.has(node.id);

    return (
      <div key={node.id}>
        <FileTreeRow
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          isActive={node.id === activeFileId}
          isFocused={node.id === focusedId}
          isRenaming={node.id === renamingNodeId}
          onRowClick={() => {
            setFocusedId(node.id);
            if (isFolder) toggleFolder(node.id);
            else handleOpenFile(node.id);
          }}
          onRowDoubleClick={() => setRenamingNodeId(node.id)}
          onRowContextMenu={(e) => {
            setFocusedId(node.id);
            setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
          }}
          onRenameCommit={(value) => {
            renameNode(node.id, value);
            setRenamingNodeId(null);
          }}
          onRenameCancel={() => setRenamingNodeId(null)}
        />
        {isFolder && isExpanded && (
          <div>
            {creating && creating.parentId === node.id && renderCreatingRow(depth + 1)}
            {sortedChildren(nodes, node.id).map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootNodes = sortedChildren(nodes, null);
  const menuNode = contextMenu?.nodeId ? nodes[contextMenu.nodeId] : null;
  const menuScopeParent = menuNode
    ? menuNode.kind === "folder"
      ? menuNode.id
      : menuNode.parentId
    : null;

  return (
    <>
      <div className="ws-toolwindow-header">
        <span>Project</span>
        <span className="ws-toolwindow-actions">
          <button
            className="ws-icon-btn"
            title="New file"
            onClick={() => startCreate(null, "file")}
          >
            <FilePlus size={14} />
          </button>
          <button
            className="ws-icon-btn"
            title="New folder"
            onClick={() => startCreate(null, "folder")}
          >
            <FolderPlus size={14} />
          </button>
          <button
            className="ws-icon-btn"
            title="Collapse all"
            onClick={() => {
              for (const id of expandedFolderIds) setExpanded(id, false);
            }}
          >
            <ChevronsDownUp size={14} />
          </button>
        </span>
      </div>
      <div
        ref={(el) => {
          treeRef.current = el;
          (rootDropRef as (node: Element | null) => void)(el);
        }}
        className="ws-tree"
        style={isRootDropTarget ? { background: "var(--accent-muted)" } : undefined}
        tabIndex={0}
        role="tree"
        onKeyDown={handleKeyDown}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, nodeId: null });
        }}
      >
        {creating && creating.parentId === null && renderCreatingRow(0)}
        {rootNodes.length === 0 && !creating ? (
          <div className="ws-tree-empty">
            No files yet.
            <br />
            Create your first markdown file with the buttons above.
          </div>
        ) : (
          rootNodes.map((node) => renderNode(node, 0))
        )}
      </div>

      {contextMenu && (
        <div
          className="ws-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button className="ws-context-item" onClick={() => startCreate(menuScopeParent, "file")}>
            <FilePlus size={14} /> New File
          </button>
          <button className="ws-context-item" onClick={() => startCreate(menuScopeParent, "folder")}>
            <FolderPlus size={14} /> New Folder
          </button>
          {menuNode && (
            <>
              <div className="ws-context-sep" />
              <button
                className="ws-context-item"
                onClick={() => {
                  setRenamingNodeId(menuNode.id);
                  closeMenu();
                }}
              >
                <Pencil size={14} /> Rename <span className="ws-context-shortcut">F2</span>
              </button>
              {menuNode.kind === "file" && (
                <button
                  className="ws-context-item"
                  onClick={() => {
                    duplicateFile(menuNode.id);
                    closeMenu();
                  }}
                >
                  <Copy size={14} /> Duplicate
                </button>
              )}
              <div className="ws-context-sep" />
              <button className="ws-context-item danger" onClick={() => confirmDelete(menuNode.id)}>
                <Trash2 size={14} /> Delete <span className="ws-context-shortcut">Del</span>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
