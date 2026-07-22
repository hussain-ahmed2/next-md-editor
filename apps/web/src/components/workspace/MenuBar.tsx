"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import {
  canExportDocument,
  copyActiveAsMarkdown,
  downloadActiveFile,
  exportActiveAsHtml,
  exportActiveAsPdf,
  exportProjectZip,
  importProjectZipFile,
  importSingleFile,
} from "@/lib/file-actions";

interface MenuEntry {
  label?: string;
  shortcut?: string;
  disabled?: boolean;
  action?: () => void;
  /** File-picker entries open a hidden input; handled in the click handler
      directly because ref access is only allowed inside event handlers. */
  picker?: "md" | "zip";
  separator?: boolean;
  heading?: string;
}

function currentTheme(): "light" | "dark" {
  return typeof document !== "undefined" && document.documentElement.dataset.theme === "light"
    ? "light"
    : "dark";
}

function toggleAppTheme(): void {
  const next = currentTheme() === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("md-editor-theme", next);
}

/** PyCharm-style application menu bar: File / Edit / View / Help. */
export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mdInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const editorMode = useUIStore((s) => s.editorMode);
  const previewOpen = useUIStore((s) => s.previewOpen);
  const activeToolWindow = useUIStore((s) => s.activeToolWindow);
  // Menus re-render every time one opens, so reading the DOM theme here
  // keeps the label fresh even when the toolbar ThemeToggle changed it.
  const theme = currentTheme();

  useEffect(() => {
    if (openMenu === null) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const showProjectTree = () => {
    useUIStore.getState().setActiveToolWindow("project");
  };

  const isDoc = canExportDocument();

  const menus: Record<string, MenuEntry[]> = {
    File: [
      {
        label: "New File…",
        shortcut: "in Project tree",
        action: () => {
          showProjectTree();
          useWorkspaceStore.getState().beginCreate(null, "file");
        },
      },
      {
        label: "New Folder…",
        action: () => {
          showProjectTree();
          useWorkspaceStore.getState().beginCreate(null, "folder");
        },
      },
      { separator: true },
      { label: "Import File…", picker: "md" },
      { label: "Import Project from ZIP…", picker: "zip" },
      { separator: true },
      { heading: "Export" },
      { label: "Download Active File", action: downloadActiveFile },
      { label: "Copy as Markdown", disabled: !isDoc, action: () => void copyActiveAsMarkdown() },
      { label: "Export as HTML", disabled: !isDoc, action: exportActiveAsHtml },
      { label: "Export as PDF (Print)", disabled: !isDoc, action: exportActiveAsPdf },
      { label: "Export Project as ZIP", action: exportProjectZip },
    ],
    Edit: [
      { label: "Undo", shortcut: "Ctrl+Z", action: undo },
      { label: "Redo", shortcut: "Ctrl+Shift+Z", action: redo },
      { separator: true },
      {
        label: "Find in Document",
        shortcut: "Ctrl+F",
        action: () => useUIStore.getState().setSearchOpen(true),
      },
      { separator: true },
      {
        label: "Move Block Up",
        shortcut: "Ctrl+Shift+↑",
        heading: undefined,
        disabled: true,
      },
      { label: "Move Block Down", shortcut: "Ctrl+Shift+↓", disabled: true },
      { label: "Duplicate Block", shortcut: "Ctrl+D", disabled: true },
    ],
    View: [
      {
        label: activeToolWindow === "project" ? "Hide Project Tool Window" : "Project Tool Window",
        action: () => useUIStore.getState().toggleToolWindow("project"),
      },
      {
        label: activeToolWindow === "blocks" ? "Hide Blocks Tool Window" : "Blocks Tool Window",
        action: () => useUIStore.getState().toggleToolWindow("blocks"),
      },
      { separator: true },
      {
        label: editorMode === "source" ? "Canvas Mode" : "Source Mode",
        action: () =>
          useUIStore.getState().setEditorMode(editorMode === "source" ? "canvas" : "source"),
      },
      {
        label: previewOpen ? "Hide Preview" : "Show Preview",
        action: () => useUIStore.getState().togglePreview(),
      },
      { separator: true },
      {
        label: theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme",
        action: toggleAppTheme,
      },
    ],
    Help: [
      { label: "Home Page", action: () => router.push("/") },
      {
        label: "GitHub Repository",
        action: () =>
          window.open("https://github.com/hussain-ahmed2/next-md-editor", "_blank", "noopener"),
      },
      {
        label: "Report an Issue",
        action: () =>
          window.open(
            "https://github.com/hussain-ahmed2/next-md-editor/issues",
            "_blank",
            "noopener",
          ),
      },
    ],
  };

  const handleFile =
    (handler: (file: File) => Promise<void>) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handler(file);
      e.target.value = "";
    };

  return (
    <div className="ide-menubar" ref={rootRef}>
      <input
        type="file"
        accept=".md,.markdown,.txt,.json,text/markdown,text/plain"
        ref={mdInputRef}
        onChange={handleFile(importSingleFile)}
        style={{ display: "none" }}
      />
      <input
        type="file"
        accept=".zip,application/zip"
        ref={zipInputRef}
        onChange={handleFile(importProjectZipFile)}
        style={{ display: "none" }}
      />
      {Object.entries(menus).map(([name, entries]) => (
        <div
          key={name}
          className={`ide-menubar-item${openMenu === name ? " open" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            setOpenMenu((m) => (m === name ? null : name));
          }}
          onMouseEnter={() => {
            if (openMenu !== null) setOpenMenu(name);
          }}
        >
          {name}
          {openMenu === name && (
            <div className="ide-menu" onMouseDown={(e) => e.stopPropagation()}>
              {entries.map((entry, i) => {
                if (entry.separator) return <div key={i} className="ide-menu-sep" />;
                if (entry.heading && !entry.label)
                  return (
                    <div key={i} className="ide-menu-label">
                      {entry.heading}
                    </div>
                  );
                return (
                  <button
                    key={i}
                    className={`ide-menu-item${entry.disabled ? " disabled" : ""}`}
                    onClick={() => {
                      setOpenMenu(null);
                      if (entry.picker === "md") mdInputRef.current?.click();
                      else if (entry.picker === "zip") zipInputRef.current?.click();
                      else entry.action?.();
                    }}
                  >
                    {entry.label}
                    {entry.shortcut && <span className="ide-menu-shortcut">{entry.shortcut}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
