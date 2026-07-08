"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { useTheme } from "@/hooks/useTheme";

import { CM_LANG_MAP } from "./code/languages";
import { CodeBlockHeader } from "./code/CodeBlockHeader";

export function CodeBlock({ block }: { block: Block }) {
	const { theme } = useTheme();
	const updateBlock = useEditorStore((s) => s.updateBlock);
	const blocks = useEditorStore((s) => s.blocks);
	// Read own data directly from store to bypass prop chain issues
	const myBlock = blocks.find((b) => b.id === block.id) ?? block;
	const code = (myBlock.props.code as string) ?? "";
	const lang = (myBlock.props.language as string) ?? "ts";

	const onChange = useCallback(
		(val: string) => {
			updateBlock(block.id, { code: val });
		},
		[block.id, updateBlock],
	);

	// Map the selected language to a codemirror extension
	const mappedLang = CM_LANG_MAP[lang] ?? lang;
	const languageExtension = loadLanguage(mappedLang as Parameters<typeof loadLanguage>[0]);
	const extensions = languageExtension ? [languageExtension] : [];

	return (
		<div
			style={{
				borderRadius: 6,
				border: "1px solid var(--border)",
				overflow: "hidden",
				background: "var(--bg-surface)",
			}}
		>
			<CodeBlockHeader blockId={block.id} lang={lang} />

			{/* Code area - Using uiw/react-codemirror */}
			<div style={{ position: "relative" }} className="next-md-cm-wrapper">
				<CodeMirror
					value={code}
					theme={theme === "light" ? githubLight : githubDark}
					extensions={extensions}
					onChange={onChange}
					onKeyDown={(e) => {
						const isMeta = e.ctrlKey || e.metaKey;
						// Prevent custom undo/redo if within CodeMirror as it has its own history
						if (isMeta && (e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) {
							e.stopPropagation();
						}
					}}
					basicSetup={{
						lineNumbers: false,
						foldGutter: false,
						highlightActiveLine: false,
						dropCursor: false,
						allowMultipleSelections: false,
						indentOnInput: true,
					}}
					style={{
						fontSize: 13,
						fontFamily: "var(--font-mono)",
					}}
				/>
				<style>{`
          .next-md-cm-wrapper .cm-editor {
            background-color: transparent !important;
          }
          .next-md-cm-wrapper .cm-scroller {
            padding: 14px 16px;
            font-family: var(--font-mono);
          }
          .next-md-cm-wrapper .cm-content {
            padding: 0;
          }
        `}</style>
			</div>
		</div>
	);
}
