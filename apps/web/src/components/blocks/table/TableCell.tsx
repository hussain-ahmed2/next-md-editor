import { useRef, useEffect } from "react";
import { htmlToMarkdown } from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";

export function TableCell({
	cellValue,
	rIdx,
	cIdx,
	isHeader,
	blockId,
	onInput,
}: {
	cellValue: string;
	rIdx: number;
	cIdx: number;
	isHeader: boolean;
	blockId: string;
	onInput: (rIdx: number, cIdx: number, html: string) => void;
}) {
	const Tag = isHeader ? "th" : "td";
	const ref = useRef<HTMLTableCellElement>(null);

	// Sync cell content when rows change from outside (undo/redo)
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const currentMarkdown = htmlToMarkdown(el.innerHTML);
		if (currentMarkdown !== cellValue) {
			let offset = 0;
			const selection = window.getSelection();
			let isFocused = false;
			if (document.activeElement === el && selection && selection.rangeCount > 0) {
				isFocused = true;
				const range = selection.getRangeAt(0);
				const preCaretRange = range.cloneRange();
				preCaretRange.selectNodeContents(el);
				preCaretRange.setEnd(range.endContainer, range.endOffset);
				offset = preCaretRange.toString().length;
			}

			el.innerHTML = renderInlineMarkdown(cellValue);

			if (isFocused && selection) {
				const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
				let currentOffset = 0;
				let targetNode = null;
				let targetOffset = 0;
				while (walker.nextNode()) {
					const node = walker.currentNode;
					const len = node.textContent?.length || 0;
					if (currentOffset + len >= offset) {
						targetNode = node;
						targetOffset = offset - currentOffset;
						break;
					}
					currentOffset += len;
				}
				if (targetNode) {
					const newRange = document.createRange();
					newRange.setStart(targetNode, targetOffset);
					newRange.collapse(true);
					selection.removeAllRanges();
					selection.addRange(newRange);
				}
			}
		}
	}, [cellValue]);

	// Initial render
	useEffect(() => {
		const el = ref.current;
		if (el && !el.innerHTML) {
			el.innerHTML = renderInlineMarkdown(cellValue);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Tag
			ref={ref as React.LegacyRef<HTMLTableCellElement>}
			contentEditable
			data-block-id={blockId}
			suppressContentEditableWarning
			onInput={(e) => onInput(rIdx, cIdx, e.currentTarget.innerHTML)}
			onKeyDown={(e) => {
				if (e.key === "ArrowRight") {
					const selection = window.getSelection();
					if (!selection || !selection.isCollapsed) return;
					const node = selection.anchorNode;
					if (!node || node.nodeType !== Node.TEXT_NODE) return;

					if (selection.anchorOffset === node.textContent?.length) {
						let formatNode: HTMLElement | null = null;
						let curr: Node | null = node;
						let isLastChild = true;
						
						while (curr && curr.parentNode && curr.parentNode !== e.currentTarget) {
							if (curr.nextSibling !== null) {
								isLastChild = false;
							}
							curr = curr.parentNode;
							if (["code", "b", "strong", "i", "em", "strike", "a"].includes(curr.nodeName.toLowerCase())) {
								formatNode = curr as HTMLElement;
								break;
							}
						}

						if (formatNode && isLastChild) {
							const next = formatNode.nextSibling;
							// If there is already a text node to step into natively, let the browser handle it
							if (next && next.nodeType === Node.TEXT_NODE && (next.textContent?.length ?? 0) > 0) {
								return;
							}
							
							e.preventDefault();
							// Inject a non-breaking space so we can escape the format block natively
							const spaceNode = document.createTextNode("\u00A0");
							if (formatNode.nextSibling) {
								formatNode.parentNode?.insertBefore(spaceNode, formatNode.nextSibling);
							} else {
								formatNode.parentNode?.appendChild(spaceNode);
							}
							
							const newRange = document.createRange();
							newRange.setStart(spaceNode, 1);
							newRange.collapse(true);
							selection.removeAllRanges();
							selection.addRange(newRange);
							
							e.currentTarget.dispatchEvent(new Event("input", { bubbles: true }));
						}
					}
				}
			}}
			style={{
				padding: "10px 12px",
				fontWeight: isHeader ? 600 : 400,
				color: isHeader ? "var(--text-primary)" : "var(--text-secondary)",
				borderRight: "1px solid var(--border-subtle)",
				outline: "none",
				minWidth: 80,
			}}
		/>
	);
}
