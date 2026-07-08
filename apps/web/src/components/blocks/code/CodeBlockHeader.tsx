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
				padding: "6px 12px",
				borderBottom: "1px solid var(--border)",
				background: "var(--bg-elevated)",
			}}
		>
			<div style={{ display: "flex", gap: 6 }}>
				<span
					style={{
						width: 10,
						height: 10,
						borderRadius: "50%",
						background: "#f87171",
						display: "inline-block",
					}}
				/>
				<span
					style={{
						width: 10,
						height: 10,
						borderRadius: "50%",
						background: "#fbbf24",
						display: "inline-block",
					}}
				/>
				<span
					style={{
						width: 10,
						height: 10,
						borderRadius: "50%",
						background: "#4ade80",
						display: "inline-block",
					}}
				/>
			</div>
			<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
				<AiToolbarButton blockId={blockId} />
				<select
					value={lang}
					onChange={(e) => {
						e.stopPropagation();
						updateBlock(blockId, { language: e.target.value });
					}}
					style={{
						background: "transparent",
						border: "none",
						color: "var(--text-muted)",
						fontSize: 11,
						fontFamily: "var(--font-mono)",
						outline: "none",
						minWidth: 120,
						maxWidth: 180,
						textAlign: "right",
						textAlignLast: "right",
						cursor: "pointer",
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
