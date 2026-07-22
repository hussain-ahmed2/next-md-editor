"use client";

import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { markdownSanitizeSchema } from "@/lib/sanitize-schema";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { serializeToMarkdown } from "@/features/markdown/serializer";
import { PreviewHeader } from "./markdown-preview/PreviewHeader";
import { FONT_MONO, getMarkdownComponents, getTableComponents } from "./markdown-preview/previewComponents";

export function MarkdownPreview({ scrollRef }: { scrollRef?: React.Ref<HTMLDivElement> }) {
	const blocks = useEditorStore((s) => s.blocks);
	const fileName = useWorkspaceStore((s) =>
		s.activeFileId ? (s.nodes[s.activeFileId]?.name ?? "document.md") : "document.md",
	);
	const markdown = serializeToMarkdown(blocks);
	const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

	const isImageGrid = markdown.includes("<!-- image-grid -->");

	const markdownComponents = useMemo(() => getMarkdownComponents(), []);
	const tableComponents = useMemo(
		() => getTableComponents(isImageGrid),
		[isImageGrid],
	);

	return (
		<aside
			style={{
				flex: 1,
				background: "var(--bg-surface)",
				borderLeft: "1px solid var(--border-subtle)",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				minWidth: 0,
			}}
		>
			<PreviewHeader
				fileName={fileName}
				blockCount={blocks.length}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
			<div ref={scrollRef} style={{ flex: 1, overflow: "auto", background: "var(--bg-base)" }}>
					{blocks.length === 0 ? (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								height: "100%",
								color: "var(--text-muted)",
								fontSize: 13,
								fontStyle: "italic",
								textAlign: "center",
							}}
						>
							Add blocks to see active GitHub preview…
						</div>
					) : activeTab === "raw" ? (
						<pre
							style={{
								margin: 0,
								padding: "32px",
								fontSize: 13,
								lineHeight: 1.6,
								fontFamily: FONT_MONO,
								color: "var(--text-primary)",
								whiteSpace: "pre-wrap",
								wordBreak: "break-word",
							}}
						>
							{markdown}
						</pre>
					) : (
						<div className="markdown-body" style={{ padding: "32px" }}>
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
								components={{ ...markdownComponents, ...tableComponents }}
							>
								{markdown}
							</ReactMarkdown>
						</div>
					)}
				</div>
		</aside>
	);
}
