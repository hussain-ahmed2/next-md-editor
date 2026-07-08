import { Bold, Italic, Code, Link as LinkIcon, Strikethrough } from "lucide-react";
import { FormatButton } from "./FormatButton";
import { EmojiToolbarButton } from "./EmojiToolbarButton";
import { AiToolbarButton } from "../shared/AiToolbarButton";

export function TableFormatToolbar({
	blockId,
	activeFormats,
	updateFormats,
}: {
	blockId: string;
	activeFormats: Record<string, boolean>;
	updateFormats: () => void;
}) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 2,
				padding: "4px 0 8px",
				marginBottom: 8,
				borderBottom: "1px solid var(--border-subtle)",
			}}
		>
			{[
				{ icon: <Bold size={14} />, command: "bold", label: "Bold" },
				{ icon: <Italic size={14} />, command: "italic", label: "Italic" },
				{ icon: <Code size={14} />, command: "code", label: "Code" },
				{ icon: <Strikethrough size={14} />, command: "strikeThrough", label: "Strikethrough" },
				{ icon: <LinkIcon size={14} />, command: "link", label: "Link" },
			].map((btn) => (
				<FormatButton
					key={btn.command}
					command={btn.command}
					label={btn.label}
					icon={btn.icon}
					active={activeFormats[btn.command]}
					onUpdateFormats={updateFormats}
				/>
			))}

			<EmojiToolbarButton />
			<AiToolbarButton blockId={blockId} />
		</div>
	);
}
