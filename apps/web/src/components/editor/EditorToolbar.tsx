"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { UndoRedoButtons } from "./toolbar/UndoRedoButtons";
import { ModeToggle } from "./toolbar/ModeToggle";
import { TemplateMenu } from "./toolbar/TemplateMenu";
import { FileActions } from "./toolbar/FileActions";
import { Divider } from "./toolbar/ToolbarButton";

export function EditorToolbar() {
  const saveStatus = useUIStore((s) => s.saveStatus);

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      height: 52,
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "linear-gradient(135deg, var(--accent), #a78bfa)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          color: "#fff",
          boxShadow: "0 2px 8px var(--accent-glow)",
        }}>M</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          next-md-editor
        </span>
      </div>

      {/* Save Status Indicator */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "var(--text-secondary)",
        marginLeft: 16,
        marginRight: "auto",
        transition: "opacity 0.2s ease",
      }}>
        {saveStatus === "saving" && (
          <>
            <Loader2 size={13} style={{ color: "var(--warning)", animation: "spin 1s linear infinite" }} />
            <span className="save-status-label" style={{ color: "var(--text-secondary)", opacity: 0.8, fontWeight: 500 }}>Saving changes…</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <CheckCheck size={13} style={{ color: "var(--success)" }} />
            <span className="save-status-label" style={{ color: "var(--text-secondary)", opacity: 0.8, fontWeight: 500 }}>Saved to browser</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <UndoRedoButtons />
        <Divider />
        <TemplateMenu />
        <ModeToggle />
        <FileActions />
      </div>
    </header>
  );
}
