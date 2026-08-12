"use client";

import { create } from "zustand";
import type { FileContent, FileNode, WorkspaceMeta } from "@next-md-editor/types";
import {
  collectDescendantIds,
  deleteFileContent,
  emptyFileContent,
  isDescendantOf,
  isValidNodeName,
  loadFileContent,
  loadOrCreateWorkspace,
  makeNode,
  saveFileContent,
  saveWorkspaceMeta,
  uniqueSiblingName,
} from "@/lib/workspace-storage";
import { flushPendingSave } from "@/lib/persistence-bridge";

/**
 * `saveFileContent` throws when storage is full/unavailable so the editor can
 * avoid reporting a false "Saved". Tree operations, however, should still
 * complete (the node exists in memory) rather than aborting mid-mutation.
 */
function trySaveFileContent(id: string, content: FileContent): void {
  try {
    saveFileContent(id, content);
  } catch (e) {
    console.error("Failed to persist file content (storage full or unavailable):", e);
  }
}

interface WorkspaceState extends WorkspaceMeta {
  initialized: boolean;
  /** Files edited since their last localStorage write (drives tab dirty dots). */
  dirtyFileIds: string[];
  /** Node id currently being renamed inline in the tree, if any. */
  renamingNodeId: string | null;
  /** Pending "create node" request shown as an inline input in the tree
      (set from the tree itself or the File menu). */
  creatingIntent: { parentId: string | null; kind: "file" | "folder" } | null;

  init: () => void;
  createFile: (parentId: string | null, name: string) => string | null;
  createFolder: (parentId: string | null, name: string) => string | null;
  /** Create a file with the given content already in place, then open it. */
  importFile: (parentId: string | null, name: string, content: FileContent) => string | null;
  /**
   * Bulk-import a whole project (e.g. from a ZIP) under a new top-level
   * folder. `files` paths are archive-relative ("docs/intro.md").
   */
  importProject: (rootName: string, files: { path: string; content: FileContent }[]) => void;
  renameNode: (id: string, name: string) => boolean;
  deleteNode: (id: string) => void;
  duplicateFile: (id: string) => string | null;
  moveNode: (id: string, newParentId: string | null) => boolean;
  openFile: (id: string) => void;
  closeTab: (id: string) => void;
  toggleFolder: (id: string) => void;
  setExpanded: (id: string, expanded: boolean) => void;
  setRenamingNodeId: (id: string | null) => void;
  beginCreate: (parentId: string | null, kind: "file" | "folder") => void;
  clearCreate: () => void;
  markDirty: (id: string) => void;
  clearDirty: (id: string) => void;
}

function persist(state: WorkspaceState) {
  const meta: WorkspaceMeta = {
    version: 1,
    nodes: state.nodes,
    openTabIds: state.openTabIds,
    activeFileId: state.activeFileId,
    expandedFolderIds: state.expandedFolderIds,
  };
  try {
    saveWorkspaceMeta(meta);
  } catch (e) {
    console.error("Failed to save workspace metadata:", e);
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  version: 1,
  nodes: {},
  openTabIds: [],
  activeFileId: null,
  expandedFolderIds: [],
  initialized: false,
  dirtyFileIds: [],
  renamingNodeId: null,
  creatingIntent: null,

  init: () => {
    if (get().initialized) return;
    const meta = loadOrCreateWorkspace();
    // Drop tabs pointing at nodes that no longer exist (defensive).
    const openTabIds = meta.openTabIds.filter((id) => meta.nodes[id]);
    const activeFileId =
      meta.activeFileId && meta.nodes[meta.activeFileId] ? meta.activeFileId : (openTabIds[0] ?? null);
    set({ ...meta, openTabIds, activeFileId, initialized: true });
  },

  createFile: (parentId, name) => {
    if (!isValidNodeName(name)) return null;
    const state = get();
    const finalName = uniqueSiblingName(state.nodes, parentId, name.trim());
    const node = makeNode(finalName, "file", parentId);
    trySaveFileContent(node.id, emptyFileContent(finalName));
    flushPendingSave();
    set((s) => ({
      nodes: { ...s.nodes, [node.id]: node },
      openTabIds: s.openTabIds.includes(node.id) ? s.openTabIds : [...s.openTabIds, node.id],
      activeFileId: node.id,
      expandedFolderIds:
        parentId && !s.expandedFolderIds.includes(parentId)
          ? [...s.expandedFolderIds, parentId]
          : s.expandedFolderIds,
    }));
    persist(get());
    return node.id;
  },

  importFile: (parentId, name, content) => {
    if (!isValidNodeName(name)) return null;
    const state = get();
    const finalName = uniqueSiblingName(state.nodes, parentId, name.trim());
    const node = makeNode(finalName, "file", parentId);
    // Content must exist in storage before the persistence hook loads the file.
    trySaveFileContent(node.id, content);
    flushPendingSave();
    set((s) => ({
      nodes: { ...s.nodes, [node.id]: node },
      openTabIds: [...s.openTabIds, node.id],
      activeFileId: node.id,
      expandedFolderIds:
        parentId && !s.expandedFolderIds.includes(parentId)
          ? [...s.expandedFolderIds, parentId]
          : s.expandedFolderIds,
    }));
    persist(get());
    return node.id;
  },

  importProject: (rootName, files) => {
    if (files.length === 0) return;
    flushPendingSave();
    const state = get();
    const nodes = { ...state.nodes };

    const rootFolder = makeNode(uniqueSiblingName(nodes, null, rootName || "imported"), "folder", null);
    nodes[rootFolder.id] = rootFolder;
    const expandedFolderIds = [...state.expandedFolderIds, rootFolder.id];

    // Path segments → folder node id, so shared parents are created once
    const folderByPath = new Map<string, string>([["", rootFolder.id]]);
    const ensureFolder = (dirPath: string): string => {
      const known = folderByPath.get(dirPath);
      if (known) return known;
      const segments = dirPath.split("/");
      const name = segments[segments.length - 1];
      const parentId = ensureFolder(segments.slice(0, -1).join("/"));
      const folder = makeNode(uniqueSiblingName(nodes, parentId, name), "folder", parentId);
      nodes[folder.id] = folder;
      folderByPath.set(dirPath, folder.id);
      expandedFolderIds.push(folder.id);
      return folder.id;
    };

    let firstFileId: string | null = null;
    for (const file of files) {
      const segments = file.path.split("/");
      const fileName = segments[segments.length - 1];
      if (!isValidNodeName(fileName)) continue;
      const parentId = ensureFolder(segments.slice(0, -1).join("/"));
      const node = makeNode(uniqueSiblingName(nodes, parentId, fileName), "file", parentId);
      nodes[node.id] = node;
      trySaveFileContent(node.id, file.content);
      firstFileId ??= node.id;
    }

    set((s) => ({
      nodes,
      expandedFolderIds,
      openTabIds: firstFileId ? [...s.openTabIds, firstFileId] : s.openTabIds,
      activeFileId: firstFileId ?? s.activeFileId,
    }));
    persist(get());
  },

  createFolder: (parentId, name) => {
    if (!isValidNodeName(name)) return null;
    const state = get();
    const finalName = uniqueSiblingName(state.nodes, parentId, name.trim());
    const node = makeNode(finalName, "folder", parentId);
    set((s) => ({
      nodes: { ...s.nodes, [node.id]: node },
      expandedFolderIds: [...s.expandedFolderIds, node.id],
    }));
    persist(get());
    return node.id;
  },

  renameNode: (id, name) => {
    if (!isValidNodeName(name)) return false;
    const state = get();
    const node = state.nodes[id];
    if (!node) return false;
    const trimmed = name.trim();
    if (trimmed === node.name) return true;
    const finalName = uniqueSiblingName(
      Object.fromEntries(Object.entries(state.nodes).filter(([nid]) => nid !== id)),
      node.parentId,
      trimmed,
    );
    // A rename can change the file format (.md → .txt). Flush pending edits
    // first so they are written under the old format, then let the
    // persistence hook reload from storage.
    flushPendingSave();
    set((s) => ({
      nodes: { ...s.nodes, [id]: { ...node, name: finalName, updatedAt: Date.now() } },
    }));
    persist(get());
    return true;
  },

  deleteNode: (id) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return;
    flushPendingSave();
    const doomed = [id, ...collectDescendantIds(state.nodes, id)];
    const doomedSet = new Set(doomed);
    for (const nodeId of doomed) {
      if (state.nodes[nodeId]?.kind === "file") deleteFileContent(nodeId);
    }
    set((s) => {
      const nodes = { ...s.nodes };
      for (const nodeId of doomed) delete nodes[nodeId];
      const openTabIds = s.openTabIds.filter((tid) => !doomedSet.has(tid));
      let activeFileId = s.activeFileId;
      if (activeFileId && doomedSet.has(activeFileId)) {
        const oldIdx = s.openTabIds.indexOf(activeFileId);
        activeFileId =
          openTabIds[Math.min(Math.max(oldIdx - 1, 0), openTabIds.length - 1)] ?? null;
      }
      return {
        nodes,
        openTabIds,
        activeFileId,
        expandedFolderIds: s.expandedFolderIds.filter((fid) => !doomedSet.has(fid)),
        dirtyFileIds: s.dirtyFileIds.filter((fid) => !doomedSet.has(fid)),
      };
    });
    persist(get());
  },

  duplicateFile: (id) => {
    const state = get();
    const node = state.nodes[id];
    if (!node || node.kind !== "file") return null;
    flushPendingSave();
    const copyName = uniqueSiblingName(state.nodes, node.parentId, node.name);
    const copy = makeNode(copyName, "file", node.parentId);
    const content = loadFileContent(id) ?? emptyFileContent(node.name);
    trySaveFileContent(copy.id, content);
    set((s) => ({
      nodes: { ...s.nodes, [copy.id]: copy },
      openTabIds: [...s.openTabIds, copy.id],
      activeFileId: copy.id,
    }));
    persist(get());
    return copy.id;
  },

  moveNode: (id, newParentId) => {
    const state = get();
    const node = state.nodes[id];
    if (!node) return false;
    if (newParentId === id) return false;
    if (newParentId !== null) {
      const target = state.nodes[newParentId];
      if (!target || target.kind !== "folder") return false;
      // A folder cannot be moved into itself or its own descendants.
      if (node.kind === "folder" && (newParentId === id || isDescendantOf(state.nodes, newParentId, id)))
        return false;
    }
    if (node.parentId === newParentId) return true;
    const finalName = uniqueSiblingName(
      Object.fromEntries(Object.entries(state.nodes).filter(([nid]) => nid !== id)),
      newParentId,
      node.name,
    );
    set((s) => ({
      nodes: {
        ...s.nodes,
        [id]: { ...node, parentId: newParentId, name: finalName, updatedAt: Date.now() },
      },
      expandedFolderIds:
        newParentId && !s.expandedFolderIds.includes(newParentId)
          ? [...s.expandedFolderIds, newParentId]
          : s.expandedFolderIds,
    }));
    persist(get());
    return true;
  },

  openFile: (id) => {
    const state = get();
    const node = state.nodes[id];
    if (!node || node.kind !== "file") return;
    if (state.activeFileId === id) return;
    flushPendingSave();
    set((s) => ({
      openTabIds: s.openTabIds.includes(id) ? s.openTabIds : [...s.openTabIds, id],
      activeFileId: id,
    }));
    persist(get());
  },

  closeTab: (id) => {
    flushPendingSave();
    set((s) => {
      const idx = s.openTabIds.indexOf(id);
      if (idx === -1) return {};
      const openTabIds = s.openTabIds.filter((tid) => tid !== id);
      let activeFileId = s.activeFileId;
      if (activeFileId === id) {
        activeFileId = openTabIds[Math.min(Math.max(idx - 1, 0), openTabIds.length - 1)] ?? null;
      }
      return { openTabIds, activeFileId };
    });
    persist(get());
  },

  toggleFolder: (id) => {
    set((s) => ({
      expandedFolderIds: s.expandedFolderIds.includes(id)
        ? s.expandedFolderIds.filter((fid) => fid !== id)
        : [...s.expandedFolderIds, id],
    }));
    persist(get());
  },

  setExpanded: (id, expanded) => {
    set((s) => ({
      expandedFolderIds: expanded
        ? s.expandedFolderIds.includes(id)
          ? s.expandedFolderIds
          : [...s.expandedFolderIds, id]
        : s.expandedFolderIds.filter((fid) => fid !== id),
    }));
    persist(get());
  },

  setRenamingNodeId: (id) => set({ renamingNodeId: id }),

  beginCreate: (parentId, kind) => {
    set((s) => ({
      creatingIntent: { parentId, kind },
      expandedFolderIds:
        parentId && !s.expandedFolderIds.includes(parentId)
          ? [...s.expandedFolderIds, parentId]
          : s.expandedFolderIds,
    }));
  },

  clearCreate: () => set({ creatingIntent: null }),

  markDirty: (id) =>
    set((s) => (s.dirtyFileIds.includes(id) ? {} : { dirtyFileIds: [...s.dirtyFileIds, id] })),

  clearDirty: (id) =>
    set((s) =>
      s.dirtyFileIds.includes(id)
        ? { dirtyFileIds: s.dirtyFileIds.filter((fid) => fid !== id) }
        : {},
    ),
}));

/** Convenience selector: the active FileNode, or null. */
export function selectActiveFile(s: WorkspaceState): FileNode | null {
  return s.activeFileId ? (s.nodes[s.activeFileId] ?? null) : null;
}
