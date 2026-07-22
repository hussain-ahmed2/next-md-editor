"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { AiToolbarButton } from "../shared/AiToolbarButton";
import { POPULAR_LANGUAGES, HLJS_LANGUAGES } from "./languages";

interface CodeBlockHeaderProps {
	blockId: string;
	lang: string;
}

export function CodeBlockHeader({ blockId, lang }: CodeBlockHeaderProps) {
	const updateBlock = useEditorStore((s) => s.updateBlock);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				height: 32,
				padding: "0 8px 0 12px",
				borderBottom: "1px solid var(--border-subtle)",
				background: "var(--bg-surface)",
			}}
		>
			<span
				style={{
					fontSize: 11,
					fontWeight: 600,
					letterSpacing: "0.06em",
					textTransform: "uppercase",
					color: "var(--text-muted)",
				}}
			>
				Code
			</span>
			<div style={{ display: "flex", gap: 4, alignItems: "center" }}>
				<AiToolbarButton blockId={blockId} />
				<select
					value={lang}
					onChange={(e) => {
						e.stopPropagation();
						updateBlock(blockId, { language: e.target.value });
					}}
					className="ide-select"
					style={{
						height: 24,
						fontSize: 12,
						minWidth: 120,
						maxWidth: 180,
					}}
				>
					<optgroup label="Popular">
						{POPULAR_LANGUAGES.map((l) => (
							<option key={l} value={l}>
								{l}
							</option>
						))}
					</optgroup>
					<optgroup label="All Languages">
						{HLJS_LANGUAGES.filter((l) => !POPULAR_LANGUAGES.includes(l)).map((l) => (
							<option key={l} value={l}>
								{l}
							</option>
						))}
					</optgroup>
				</select>
			</div>
		</div>
	);
}
