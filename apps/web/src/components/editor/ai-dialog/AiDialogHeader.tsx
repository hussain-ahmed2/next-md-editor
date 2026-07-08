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
        padding: "14px 18px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={16} style={{ color: "var(--accent)" }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
          AI Block Editor
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            background: "var(--bg-surface)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {blockLabel}
        </span>
      </div>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          padding: 4,
          borderRadius: 4,
          display: "flex",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
