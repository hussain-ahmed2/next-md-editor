import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import type { FileNode } from "@next-md-editor/types";
import { buildNodePath } from "@/lib/workspace-storage";

/** One file inside a project archive, path relative to the archive root. */
export interface ZipEntry {
  path: string;
  text: string;
}

/**
 * Collect the workspace tree into zip entries.
 * `getFileText` renders a file node to its on-disk text (markdown for block
 * documents, raw text otherwise).
 */
export function collectZipEntries(
  nodes: Record<string, FileNode>,
  getFileText: (node: FileNode) => string,
): ZipEntry[] {
  return Object.values(nodes)
    .filter((n) => n.kind === "file")
    .map((n) => ({ path: buildNodePath(nodes, n.id), text: getFileText(n) }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function createZip(entries: ZipEntry[]): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    files[entry.path] = strToU8(entry.text);
  }
  return zipSync(files, { level: 6 });
}

/**
 * Normalize + validate a zip member path. Returns null for entries that
 * must be skipped (directories, traversal attempts, absolute paths).
 */
export function sanitizeZipPath(path: string): string | null {
  const normalized = path.replace(/\\/g, "/");
  if (normalized.endsWith("/")) return null; // directory entry
  const parts = normalized.split("/").filter((p) => p.length > 0);
  if (parts.length === 0) return null;
  if (parts.some((p) => p === "." || p === ".." || /[:*?"<>|]/.test(p))) return null;
  return parts.join("/");
}

export function extractZip(data: Uint8Array): ZipEntry[] {
  const unzipped = unzipSync(data);
  const entries: ZipEntry[] = [];
  for (const [path, bytes] of Object.entries(unzipped)) {
    const clean = sanitizeZipPath(path);
    if (!clean) continue;
    // Skip binary-looking content (contains NUL) — the workspace stores text
    const text = strFromU8(bytes);
    if (text.includes("\0")) continue;
    entries.push({ path: clean, text });
  }
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

export function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
