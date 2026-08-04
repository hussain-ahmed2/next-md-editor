"use client";

import dynamic from "next/dynamic";
import type { Block } from "@next-md-editor/types";

/**
 * CodeBlock pulls in CodeMirror (~1 MB with its language grammars). Loading
 * it on demand keeps it out of the initial editor bundle; the skeleton below
 * reserves the same space so the canvas doesn't jump while the chunk loads.
 */
const CodeBlockSkeleton = () => (
  <div
    style={{
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-sm)",
      background: "var(--bg-surface)",
      minHeight: 96,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--text-muted)",
      fontSize: 12,
      fontFamily: "var(--font-mono)",
    }}
  >
    Loading code editor…
  </div>
);

const CodeBlockImpl = dynamic(
  () => import("./CodeBlock").then((m) => m.CodeBlock),
  { ssr: false, loading: CodeBlockSkeleton },
);

export function CodeBlockLazy({ block }: { block: Block }) {
  return <CodeBlockImpl block={block} />;
}
