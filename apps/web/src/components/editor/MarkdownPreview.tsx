"use client";

import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useUIStore } from "@/store/uiStore";
import { serializeToMarkdown } from "@/features/markdown/serializer";
import { PreviewHeader } from "./markdown-preview/PreviewHeader";
import { FONT_MONO, getMarkdownComponents, getTableComponents } from "./markdown-preview/previewComponents";

export function MarkdownPreview({ scrollRef }: { scrollRef?: React.Ref<HTMLDivElement> }) {
	const blocks = useEditorStore((s) => s.blocks);
	const previewRatio = useUIStore((s) => s.previewRatio);
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
				flex: `${Math.round(previewRatio * 100)} 1 0`,
				background: "var(--bg-surface)",
				borderLeft: "1px solid var(--border-subtle)",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				padding: "12px",
				gap: 8,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					fontSize: 12,
					color: "var(--text-secondary)",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
					<span style={{ color: "var(--text-muted)" }}>next-md-editor</span>
					<span style={{ color: "var(--text-muted)" }}>/</span>
					<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>document.md</span>
				</div>
				<span
					style={{
						padding: "2px 6px",
						borderRadius: "var(--radius-sm)",
						background: "var(--accent-muted)",
						color: "var(--accent)",
						fontSize: 10,
						fontWeight: 600,
						letterSpacing: "0.02em",
						textTransform: "uppercase",
					}}
				>
					GitHub GFM View
				</span>
			</div>

      <div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					background: "var(--bg-base)",
					border: "1px solid var(--border-subtle)",
					borderRadius: "var(--radius-sm)",
					overflow: "hidden",
				}}
			>
				<PreviewHeader blockCount={blocks.length} activeTab={activeTab} onTabChange={setActiveTab} />
				<div ref={scrollRef} style={{ flex: 1, overflow: "auto" }}>
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
								rehypePlugins={[rehypeRaw]}
								components={{ ...markdownComponents, ...tableComponents }}
							>
								{markdown}
							</ReactMarkdown>
						</div>
					)}
				</div>
			</div>
		</aside>
	);
}
