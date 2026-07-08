"use client";

import type { Block, RichText } from "@next-md-editor/types";
import { richTextToHtml } from "@next-md-editor/markdown";
import { LexicalRichText } from "@/components/editor/LexicalRichText";

export function ParagraphBlock({ block }: { block: Block }) {
	const content: string = typeof block.props.content === "string" 
		? block.props.content 
		: richTextToHtml(block.props.content as RichText || []);

	return (
		<div style={{ position: "relative", width: "100%", fontSize: "1rem", lineHeight: 1.75, color: "var(--text-primary)" }}>
			<LexicalRichText 
				blockId={block.id} 
				initialHtml={content} 
				placeholder="Start typing…" 
			/>
		</div>
	);
}
