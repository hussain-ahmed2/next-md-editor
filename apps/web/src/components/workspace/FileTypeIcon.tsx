"use client";

import { File as FileIcon, FileCode, FileJson, FileText } from "lucide-react";
import { getExtension, isMarkdownFile } from "@/lib/workspace-storage";

const CODE_EXTS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "css",
  "html",
  "yml",
  "yaml",
  "sh",
  "py",
  "toml",
  "xml",
]);

/** Small file-type glyph used by the project tree and editor tabs. */
export function FileTypeIcon({ name, size = 15 }: { name: string; size?: number }) {
  if (isMarkdownFile(name)) return <FileText size={size} />;
  const ext = getExtension(name);
  if (ext === "json") return <FileJson size={size} />;
  if (CODE_EXTS.has(ext)) return <FileCode size={size} />;
  return <FileIcon size={size} />;
}
