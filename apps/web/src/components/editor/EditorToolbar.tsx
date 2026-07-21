"use client";

import { useState } from "react";
import Link from "next/link";
import { ListTree, Search, Sparkles } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { UndoRedoButtons } from "./toolbar/UndoRedoButtons";
import { ModeToggle } from "./toolbar/ModeToggle";
import { TemplateMenu } from "./toolbar/TemplateMenu";
import { ExportMenu } from "./toolbar/ExportMenu";
import { Divider, ToolbarButton } from "./toolbar/ToolbarButton";
import { ThemeToggle } from "./toolbar/ThemeToggle";
import { TableOfContents } from "./TableOfContents";

export function EditorToolbar() {
  const [tocOpen, setTocOpen] = useState(false);

  return (
    <header className="toolbar-header" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      height: 44,
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)",
      flexShrink: 0,
    }}>
      {/* Logo — links back to the landing page */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          marginRight: "auto",
        }}
        title="Back to home"
      >
        <div style={{
          width: 26,
          height: 26,
          borderRadius: "var(--radius-sm)",
          background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          color: "#fff",
          boxShadow: "0 2px 8px var(--accent-glow)",
        }}>M</div>
        <span className="app-name" style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          next-md-editor
        </span>
      </Link>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <UndoRedoButtons />
        <ToolbarButton
          onClick={() => useUIStore.getState().setSearchOpen(true)}
          tooltip="Search in document (Ctrl+F)"
        >
          <Search size={14} />
        </ToolbarButton>
        <Divider />
        <TemplateMenu />
        <ModeToggle />
        <div style={{ position: "relative" }}>
          <ToolbarButton
            onClick={() => setTocOpen((o) => !o)}
            tooltip="Table of contents"
          >
            <ListTree size={14} />
          </ToolbarButton>
          {tocOpen && (
            <>
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 99,
                }}
                onClick={() => setTocOpen(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  zIndex: 100,
                  width: 240,
                  maxHeight: 360,
                  overflow: "auto",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <div
                  style={{
                    padding: "8px 16px 4px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Table of Contents
                </div>
                <TableOfContents onClose={() => setTocOpen(false)} />
              </div>
            </>
          )}
        </div>
        <ToolbarButton
          onClick={() => useUIStore.getState().setAiChatOpen(true)}
          tooltip="AI Assistant — chat and generate content"
        >
          <Sparkles size={14} />
          <span className="btn-label">AI Chat</span>
        </ToolbarButton>
        <ThemeToggle />
        <ExportMenu />
      </div>
    </header>
  );
}
