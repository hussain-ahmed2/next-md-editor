import { useState } from "react";
import { Sparkles } from "lucide-react";
import { BlockAiDialog } from "../../editor/BlockAiDialog";

export function AiToolbarButton({ blockId }: { blockId: string }) {
	const [aiDialogOpen, setAiDialogOpen] = useState(false);

	return (
		<>
			<div style={{ width: 1, height: 16, background: "var(--border-subtle)", margin: "0 4px" }} />
			<button
				onClick={() => setAiDialogOpen(true)}
				title="Edit with AI"
				style={{
					background: aiDialogOpen ? "var(--accent)" : "transparent",
					border: "none",
					borderRadius: 4,
					padding: "3px 7px",
					cursor: "pointer",
					color: aiDialogOpen ? "#fff" : "var(--text-secondary)",
					fontSize: 12,
					transition: "all 0.12s",
				}}
				onMouseEnter={(e) => {
					if (!aiDialogOpen) {
						e.currentTarget.style.background = "var(--bg-elevated)";
						e.currentTarget.style.color = "var(--text-primary)";
					}
				}}
				onMouseLeave={(e) => {
					if (!aiDialogOpen) {
						e.currentTarget.style.background = "transparent";
						e.currentTarget.style.color = "var(--text-secondary)";
					}
				}}
			>
				<Sparkles size={13} />
			</button>
			{aiDialogOpen && <BlockAiDialog blockId={blockId} onClose={() => setAiDialogOpen(false)} />}
		</>
	);
}
