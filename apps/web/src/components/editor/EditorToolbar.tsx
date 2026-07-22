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
import { UserMenu } from "@/components/auth/UserMenu";
import { MenuBar } from "@/components/workspace/MenuBar";

export function EditorToolbar() {
  const [tocOpen, setTocOpen] = useState(false);
  const isMobile = useUIStore((s) => s.isMobile);

  return (
    <header className="toolbar-header ide-header">
      {/* Logo — links back to the landing page */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          marginRight: 6,
          flexShrink: 0,
        }}
        title="Back to home"
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "var(--radius-sm)",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          M
        </div>
        <span
          className="app-name"
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          next-md-editor
        </span>
      </Link>

      {/* Application menus */}
      {!isMobile && <MenuBar />}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "auto" }}>
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
          <ToolbarButton onClick={() => setTocOpen((o) => !o)} tooltip="Table of contents">
            <ListTree size={14} />
          </ToolbarButton>
          {tocOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
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
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px 4px",
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
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
        <UserMenu />
        <ExportMenu />
      </div>
    </header>
  );
}
