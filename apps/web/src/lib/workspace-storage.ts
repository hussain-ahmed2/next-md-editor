import type { Block, FileContent, FileNode, WorkspaceMeta } from "@next-md-editor/types";
import { v4 as uuid } from "uuid";

/**
 * Pure localStorage-backed workspace persistence.
 * Metadata (tree, tabs) lives under one key; file contents live under
 * per-file keys so a keystroke only rewrites one small entry.
 */

export const WORKSPACE_KEY = "nme:workspace:v1";
export const LEGACY_BLOCKS_KEY = "next-md-editor-blocks";
export const FILE_KEY_PREFIX = "nme:file:";

/** Minimal Storage surface so tests can inject an in-memory fake. */
export interface KVStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): KVStorage {
  return window.localStorage;
}

export const fileKey = (id: string) => `${FILE_KEY_PREFIX}${id}`;

// ── File-name helpers ─────────────────────────────────────────────────────────

export function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(idx + 1).toLowerCase() : "";
}

export function isMarkdownFile(name: string): boolean {
  const ext = getExtension(name);
  return ext === "md" || ext === "markdown";
}

export function getFileFormat(name: string): "blocks" | "text" {
  return isMarkdownFile(name) ? "blocks" : "text";
}

const INVALID_NAME = /[\\/:*?"<>|]/;

export function isValidNodeName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 255 && !INVALID_NAME.test(trimmed);
}

/** "README.md" → "README (2).md" until unique among siblings. */
export function uniqueSiblingName(
  nodes: Record<string, FileNode>,
  parentId: string | null,
  desired: string,
): string {
  const siblings = new Set(
    Object.values(nodes)
      .filter((n) => n.parentId === parentId)
      .map((n) => n.name.toLowerCase()),
  );
  if (!siblings.has(desired.toLowerCase())) return desired;
  const idx = desired.lastIndexOf(".");
  const stem = idx > 0 ? desired.slice(0, idx) : desired;
  const ext = idx > 0 ? desired.slice(idx) : "";
  for (let i = 2; ; i++) {
    const candidate = `${stem} (${i})${ext}`;
    if (!siblings.has(candidate.toLowerCase())) return candidate;
  }
}

// ── Tree helpers ──────────────────────────────────────────────────────────────

export function collectDescendantIds(nodes: Record<string, FileNode>, id: string): string[] {
  const result: string[] = [];
  const queue = [id];
  while (queue.length) {
    const current = queue.shift()!;
    for (const node of Object.values(nodes)) {
      if (node.parentId === current) {
        result.push(node.id);
        queue.push(node.id);
      }
    }
  }
  return result;
}

export function isDescendantOf(
  nodes: Record<string, FileNode>,
  candidateId: string,
  ancestorId: string,
): boolean {
  let current = nodes[candidateId]?.parentId ?? null;
  while (current !== null) {
    if (current === ancestorId) return true;
    current = nodes[current]?.parentId ?? null;
  }
  return false;
}

/** Repo-style path for a node, e.g. "docs/getting-started.md". */
export function buildNodePath(nodes: Record<string, FileNode>, id: string): string {
  const parts: string[] = [];
  let current: FileNode | undefined = nodes[id];
  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? nodes[current.parentId] : undefined;
  }
  return parts.join("/");
}

/** Sorted children for display: folders first, then case-insensitive by name. */
export function sortedChildren(nodes: Record<string, FileNode>, parentId: string | null): FileNode[] {
  return Object.values(nodes)
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
}

export function makeNode(
  name: string,
  kind: FileNode["kind"],
  parentId: string | null,
  order = 0,
): FileNode {
  const now = Date.now();
  return { id: uuid(), parentId, name, kind, order, createdAt: now, updatedAt: now };
}

// ── Persistence ───────────────────────────────────────────────────────────────

export function loadWorkspaceMeta(storage: KVStorage = defaultStorage()): WorkspaceMeta | null {
  try {
    const raw = storage.getItem(WORKSPACE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceMeta;
    if (parsed?.version !== 1 || typeof parsed.nodes !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveWorkspaceMeta(meta: WorkspaceMeta, storage: KVStorage = defaultStorage()): void {
  storage.setItem(WORKSPACE_KEY, JSON.stringify(meta));
}

export function loadFileContent(id: string, storage: KVStorage = defaultStorage()): FileContent | null {
  try {
    const raw = storage.getItem(fileKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FileContent;
    if (parsed?.format === "blocks" && Array.isArray(parsed.blocks)) return parsed;
    if (parsed?.format === "text" && typeof parsed.text === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveFileContent(
  id: string,
  content: FileContent,
  storage: KVStorage = defaultStorage(),
): void {
  storage.setItem(fileKey(id), JSON.stringify(content));
}

export function deleteFileContent(id: string, storage: KVStorage = defaultStorage()): void {
  storage.removeItem(fileKey(id));
}

export function emptyFileContent(name: string): FileContent {
  return getFileFormat(name) === "blocks" ? { format: "blocks", blocks: [] } : { format: "text", text: "" };
}

// ── Bootstrap & migration ─────────────────────────────────────────────────────

function freshWorkspace(readme: FileNode): WorkspaceMeta {
  return {
    version: 1,
    nodes: { [readme.id]: readme },
    openTabIds: [readme.id],
    activeFileId: readme.id,
    expandedFolderIds: [],
  };
}

/**
 * Load the workspace, migrating the pre-workspace single-document key if
 * present, or creating a default workspace with an empty README.md.
 */
export function loadOrCreateWorkspace(storage: KVStorage = defaultStorage()): WorkspaceMeta {
  const existing = loadWorkspaceMeta(storage);
  if (existing) return existing;

  const readme = makeNode("README.md", "file", null);
  const meta = freshWorkspace(readme);

  // Migrate the legacy single-document blocks key into README.md.
  try {
    const legacy = storage.getItem(LEGACY_BLOCKS_KEY);
    if (legacy) {
      const blocks = JSON.parse(legacy) as Block[];
      if (Array.isArray(blocks)) {
        saveFileContent(readme.id, { format: "blocks", blocks }, storage);
        // Keep a backup rather than deleting outright.
        storage.setItem(`${LEGACY_BLOCKS_KEY}.bak`, legacy);
        storage.removeItem(LEGACY_BLOCKS_KEY);
      }
    }
  } catch {
    // Corrupt legacy data — start clean.
  }

  saveWorkspaceMeta(meta, storage);
  return meta;
}
