"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { loadLanguage, type LanguageName } from "@uiw/codemirror-extensions-langs";
import { useTheme } from "@/hooks/useTheme";
import { useUIStore } from "@/store/uiStore";
import { getExtension } from "@/lib/workspace-storage";

const EXT_TO_LANG: Record<string, LanguageName> = {
  js: "js",
  jsx: "jsx",
  ts: "ts",
  tsx: "tsx",
  json: "json",
  css: "css",
  html: "html",
  xml: "xml",
  yml: "yaml",
  yaml: "yaml",
  py: "python",
  sh: "bash",
  bash: "bash",
  toml: "toml",
  sql: "sql",
  go: "go",
};

/** CodeMirror editor for non-markdown files in the workspace. */
export function PlainFileEditor({ fileName }: { fileName: string }) {
  const plainText = useUIStore((s) => s.plainText);
  const setPlainText = useUIStore((s) => s.setPlainText);
  const { theme } = useTheme();

  const extensions = useMemo(() => {
    const langName = EXT_TO_LANG[getExtension(fileName)];
    if (!langName) return [];
    const lang = loadLanguage(langName);
    return lang ? [lang] : [];
  }, [fileName]);

  return (
    <main
      className="next-md-source-cm-wrapper"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        background: "var(--bg-base)",
        minWidth: 0,
      }}
    >
      <CodeMirror
        value={plainText}
        theme={theme === "light" ? githubLight : githubDark}
        extensions={extensions}
        onChange={(val) => setPlainText(val)}
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
          fontFamily:
            "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
        }}
      />
    </main>
  );
}
