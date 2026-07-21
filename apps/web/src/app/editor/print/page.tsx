"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { initRegistry } from "@/registry";
import { loadFileContent, loadWorkspaceMeta } from "@/lib/workspace-storage";
import { serializeToMarkdown } from "@/features/markdown/serializer";
import { GITHUB_LIKE_CSS, markdownToHtml } from "@/lib/export-html";

/**
 * Print-friendly render of a workspace file, used for "Export as PDF".
 * The browser's print dialog produces a vector PDF with real text and
 * working links — no rasterization libraries involved.
 */
function PrintView() {
  const params = useSearchParams();
  const fileId = params.get("file");
  const [html, setHtml] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!fileId) return;
    // Deferred so state updates never run synchronously inside the effect
    const timer = setTimeout(() => {
      initRegistry();
      const meta = loadWorkspaceMeta();
      const node = meta?.nodes[fileId];
      const content = loadFileContent(fileId);
      if (!node || !content) {
        setHtml("<p>File not found. Close this tab and try again.</p>");
        return;
      }
      const markdown =
        content.format === "blocks" ? serializeToMarkdown(content.blocks) : content.text;
      setName(node.name);
      setHtml(markdownToHtml(markdown));
    }, 0);
    return () => clearTimeout(timer);
  }, [fileId]);

  useEffect(() => {
    if (html === null || !name) return;
    document.title = name.replace(/\.(md|markdown)$/i, "");
    // Small delay lets images/badges start loading before the dialog opens
    const timer = setTimeout(() => window.print(), 500);
    return () => clearTimeout(timer);
  }, [html, name]);

  return (
    <>
      <style>{GITHUB_LIKE_CSS}</style>
      <style>{`
        body { background: #ffffff !important; }
        .print-hint { text-align: center; color: #59636e; font-size: 13px; padding: 12px; font-family: sans-serif; }
        @media print { .print-hint { display: none; } }
      `}</style>
      <div className="print-hint">
        Use your browser&apos;s print dialog and choose “Save as PDF”. This banner is not printed.
      </div>
      {html === null ? (
        <p className="print-hint">Preparing document…</p>
      ) : (
        <article className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={null}>
      <PrintView />
    </Suspense>
  );
}
