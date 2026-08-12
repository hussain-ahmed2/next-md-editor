"use client";

/**
 * Import/export actions shared by the menu bar and the toolbar Share menu.
 * All functions read current state from the stores so callers stay simple.
 */
import { useEditorStore } from "@next-md-editor/editor-core";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { serializeToMarkdown, parseMarkdown } from "@/features/markdown/serializer";
import { getFileFormat, isMarkdownFile, loadFileContent } from "@/lib/workspace-storage";
import { collectZipEntries, createZip, downloadBlob, extractZip } from "@/lib/project-zip";
import { buildStandaloneHtml } from "@/lib/export-html";
import { flushPendingSave } from "@/lib/persistence-bridge";
import type { FileNode } from "@next-md-editor/types";

function activeNode(): FileNode | null {
  const s = useWorkspaceStore.getState();
  return s.activeFileId ? (s.nodes[s.activeFileId] ?? null) : null;
}

function activeIsMarkdown(): boolean {
  const node = activeNode();
  return node ? getFileFormat(node.name) === "blocks" : false;
}

function activeMarkdown(): string {
  return activeIsMarkdown()
    ? serializeToMarkdown(useEditorStore.getState().blocks)
    : useUIStore.getState().plainText;
}

export function canExportDocument(): boolean {
  return activeIsMarkdown();
}

export async function copyActiveAsMarkdown(): Promise<void> {
  await navigator.clipboard.writeText(activeMarkdown());
}

export function downloadActiveFile(): void {
  const node = activeNode();
  if (!node) return;
  const type = activeIsMarkdown() ? "text/markdown" : "text/plain";
  downloadBlob(node.name, new Blob([activeMarkdown()], { type }));
}

export function exportActiveAsHtml(): void {
  const node = activeNode();
  if (!node || !activeIsMarkdown()) return;
  const title = node.name.replace(/\.(md|markdown)$/i, "");
  const html = buildStandaloneHtml(title, activeMarkdown());
  downloadBlob(`${title}.html`, new Blob([html], { type: "text/html" }));
}

export function exportActiveAsPdf(): void {
  const node = activeNode();
  if (!node || !activeIsMarkdown()) return;
  flushPendingSave();
  window.open(`/editor/print?file=${node.id}`, "_blank", "noopener");
}

export function exportProjectZip(): void {
  flushPendingSave();
  const { nodes } = useWorkspaceStore.getState();
  const entries = collectZipEntries(nodes, (node) => {
    const content = loadFileContent(node.id);
    if (!content) return "";
    return content.format === "blocks" ? serializeToMarkdown(content.blocks) : content.text;
  });
  if (entries.length === 0) return;
  const zipped = createZip(entries);
  const buffer = new Uint8Array(zipped).buffer as ArrayBuffer;
  downloadBlob("workspace.zip", new Blob([buffer], { type: "application/zip" }));
}

export async function importSingleFile(file: File): Promise<void> {
  const text = await file.text();
  const { importFile } = useWorkspaceStore.getState();
  if (isMarkdownFile(file.name)) {
    importFile(null, file.name, { format: "blocks", blocks: parseMarkdown(text) });
  } else {
    importFile(null, file.name, { format: "text", text });
  }
}

export async function importProjectZipFile(file: File): Promise<void> {
  const data = new Uint8Array(await file.arrayBuffer());
  const entries = extractZip(data);
  const rootName = file.name.replace(/\.zip$/i, "") || "imported";
  useWorkspaceStore.getState().importProject(
    rootName,
    entries.map((entry) => ({
      path: entry.path,
      content: isMarkdownFile(entry.path)
        ? { format: "blocks" as const, blocks: parseMarkdown(entry.text) }
        : { format: "text" as const, text: entry.text },
    })),
  );
}
