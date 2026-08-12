"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { serializeToMarkdown, parseMarkdown } from "@/features/markdown/serializer";
import { useUIStore } from "@/store/uiStore";
import { useEffect, useRef, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { useTheme } from "@/hooks/useTheme";

export function SourceEditor() {
  const blocks = useEditorStore((s) => s.blocks);
  const sourceText = useUIStore((s) => s.sourceText);
  const setSourceText = useUIStore((s) => s.setSourceText);
  const setEditorMode = useUIStore((s) => s.setEditorMode);
  const { theme } = useTheme();

  const blocksRef = useRef(blocks);
  const setSourceTextRef = useRef(setSourceText);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setSourceTextRef.current = setSourceText;
  }, [setSourceText]);

  useEffect(() => {
    setSourceTextRef.current(serializeToMarkdown(blocksRef.current));
  }, []);

  const handleApply = () => {
    const parsed = parseMarkdown(sourceText);
    useEditorStore.getState().setBlocks(parsed);
    setEditorMode("canvas");
  };

  const extensions = useMemo(() => {
    const mdLang = loadLanguage("markdown");
    return mdLang ? [mdLang] : [];
  }, []);

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--bg-base)",
      }}
    >
      <div className="ws-toolwindow-header" style={{ background: "var(--bg-surface)" }}>
        <span>MARKDOWN SOURCE</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={handleApply}
            className="ide-btn primary"
            style={{ height: 24, fontSize: 12, fontWeight: 600 }}
          >
            Apply Changes
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }} className="next-md-source-cm-wrapper">
        <CodeMirror
          value={sourceText}
          theme={theme === "light" ? githubLight : githubDark}
          extensions={extensions}
          onChange={(val) => setSourceText(val)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
          }}
          style={{
            flex: 1,
            fontSize: 13,
            fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
          }}
        />
        <style>{`
          .next-md-source-cm-wrapper {
            background-color: var(--bg-base);
          }
          .next-md-source-cm-wrapper .cm-editor {
            height: 100%;
            background-color: transparent !important;
          }
          .next-md-source-cm-wrapper .cm-scroller {
            font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
            padding: 16px 20px;
          }
          .next-md-source-cm-wrapper .cm-content {
            padding: 0;
          }
        `}</style>
      </div>
    </main>
  );
}
