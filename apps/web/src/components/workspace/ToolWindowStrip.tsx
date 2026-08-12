"use client";

import { Blocks, FolderTree } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export function ToolWindowStrip() {
  const activeToolWindow = useUIStore((s) => s.activeToolWindow);
  const toggleToolWindow = useUIStore((s) => s.toggleToolWindow);

  return (
    <div className="ws-strip">
      <button
        className={`ws-strip-btn${activeToolWindow === "project" ? " active" : ""}`}
        title="Project files"
        onClick={() => toggleToolWindow("project")}
      >
        <FolderTree size={17} />
      </button>
      <button
        className={`ws-strip-btn${activeToolWindow === "blocks" ? " active" : ""}`}
        title="Block palette"
        onClick={() => toggleToolWindow("blocks")}
      >
        <Blocks size={17} />
      </button>
    </div>
  );
}
