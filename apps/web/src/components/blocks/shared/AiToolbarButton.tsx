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
				className={aiDialogOpen ? "ide-btn active" : "ide-btn"}
				style={{
					width: 24,
					height: 24,
					padding: 0,
					transition: "background 0.12s ease, color 0.12s ease",
				}}
			>
				<Sparkles size={13} />
			</button>
			{aiDialogOpen && <BlockAiDialog blockId={blockId} onClose={() => setAiDialogOpen(false)} />}
		</>
	);
}
