import { Sparkles, X } from "lucide-react";

interface AiDialogHeaderProps {
  blockLabel: string;
  onClose: () => void;
}

export function AiDialogHeader({ blockLabel, onClose }: AiDialogHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={14} style={{ color: "var(--accent)" }} />
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
          AI Block Editor
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            padding: "1px 6px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {blockLabel}
        </span>
      </div>
      <button onClick={onClose} title="Close" className="ws-icon-btn">
        <X size={14} />
      </button>
    </div>
  );
}
