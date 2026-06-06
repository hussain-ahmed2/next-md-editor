"use client";

import React, { useState, useEffect, useMemo } from "react";
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
	const markdown = serializeToMarkdown(blocks);
	const [debouncedMarkdown, setDebouncedMarkdown] = useState(markdown);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedMarkdown(markdown);
		}, 150);
		return () => clearTimeout(timer);
	}, [markdown]);

	const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
	const isMobile = useUIStore((s) => s.isMobile);
	const previewWidth = useUIStore((s) => s.previewWidth);
	const width = isMobile ? undefined : (previewWidth ?? 360);

	const isImageGrid = debouncedMarkdown.includes("<!-- image-grid -->");
	const hasHiddenCaptions = debouncedMarkdown.includes("<!-- captions:hidden -->");

	const markdownComponents = useMemo(() => getMarkdownComponents(), []);
	const tableComponents = useMemo(
		() => getTableComponents(isImageGrid, hasHiddenCaptions),
		[isImageGrid, hasHiddenCaptions],
	);

	return (
		<aside
			style={{
				width,
				background: "var(--bg-surface)",
				borderLeft: "1px solid var(--border-subtle)",
				display: "flex",
				flexDirection: "column",
				flexShrink: 0,
				overflow: "hidden",
				padding: "16px",
				gap: 12,
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
						borderRadius: 4,
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
					background: "#0d1117",
					border: "1px solid #30363d",
					borderRadius: 6,
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
								color: "#8b949e",
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
								color: "#c9d1d9",
								whiteSpace: "pre-wrap",
								wordBreak: "break-word",
							}}
						>
							{debouncedMarkdown}
						</pre>
					) : (
						<div className="markdown-body" style={{ padding: "32px" }}>
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								rehypePlugins={[rehypeRaw]}
								components={{ ...markdownComponents, ...tableComponents }}
							>
								{debouncedMarkdown}
							</ReactMarkdown>
						</div>
					)}
				</div>
			</div>
		</aside>
	);
}
