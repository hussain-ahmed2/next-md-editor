"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { v4 as uuidv4 } from "uuid";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Display pass only — walk every <li>, run renderInlineMarkdown on its
 * inline text so the editor shows **bold** → <strong>bold</strong>.
 * Nested ul/ol are detached and re-attached so innerHTML replacement
 * doesn't blow them away.
 *
 * We NEVER read back from a DOM that has passed through here.
 * saveToStore() always re-reads the live DOM via normalizeListForStorage.
 */
function renderListMarkdown(container: HTMLDivElement) {
	const lis = container.querySelectorAll("li");
	lis.forEach((li) => {
		const subLists: ChildNode[] = [];
		let rawHtml = "";

		Array.from(li.childNodes).forEach((node) => {
			const el = node as Element;
			if (el.nodeName === "UL" || el.nodeName === "OL") {
				subLists.push(node);
			} else {
				rawHtml += node.nodeType === Node.TEXT_NODE ? (node.textContent ?? "") : (el.outerHTML ?? "");
			}
		});

		li.innerHTML = hasHtmlTags(rawHtml) ? rawHtml : renderInlineMarkdown(rawHtml);
		subLists.forEach((sl) => li.appendChild(sl));
	});
}

/** Quick check: does the string contain any HTML tag? */
function hasHtmlTags(s: string): boolean {
	return /<[a-zA-Z\/][^>]*>/.test(s);
}

/**
 * Save pass — clone the container and collect each <li>'s inline content
 * preserving real HTML tags (<strong>, <em>, <code>, <a> etc.) exactly
 * as the browser rendered them. Nested lists are preserved untouched.
 *
 * The serializer's inlineHtmlToMarkdown() will later convert these tags
 * back to **bold**, *italic*, `code` etc. for the markdown output,
 * which ReactMarkdown then parses natively.
 */
function normalizeListForStorage(container: HTMLDivElement): string {
	const clone = container.cloneNode(true) as HTMLDivElement;
	const lis = clone.querySelectorAll("li");

	lis.forEach((li) => {
		const subLists: Node[] = [];
		let inlineHtml = "";

		Array.from(li.childNodes).forEach((node) => {
			const el = node as Element;
			if (el.nodeName === "UL" || el.nodeName === "OL") {
				subLists.push(node.cloneNode(true));
			} else {
				inlineHtml += node.nodeType === Node.TEXT_NODE ? (node.textContent ?? "") : (el.outerHTML ?? "");
			}
		});

		li.innerHTML = inlineHtml;
		subLists.forEach((sl) => li.appendChild(sl));
	});

	return clone.innerHTML;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ListBlock({ block }: { block: Block }) {
	const blocks = useEditorStore((s) => s.blocks);
	const addBlock = useEditorStore((s) => s.addBlock);
	const removeBlocks = useEditorStore((s) => s.removeBlocks);
	const updateBlock = useEditorStore((s) => s.updateBlock);
	const selectBlock = useEditorStore((s) => s.selectBlock);
	const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

	const styleType = (block.props.style as "bullet" | "numbered") ?? "bullet";
	const html =
		(block.props.html as string) ??
		(styleType === "bullet" ? "<ul><li>Item 1</li></ul>" : "<ol><li>Item 1</li></ol>");

	const [isFocused, setIsFocused] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const lastStoredRef = useRef<string>(html);

	// ── Focus sync ──────────────────────────────────────────────────────────────
	useEffect(() => {
		const isSelected = selectedBlockIds[selectedBlockIds.length - 1] === block.id;
		if (isSelected && ref.current && document.activeElement !== ref.current) {
			ref.current.focus();
		}
	}, [selectedBlockIds, block.id]);

	// ── DOM sync ────────────────────────────────────────────────────────────────
	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const isFocusedNow = document.activeElement === el;
		const isEmpty = el.innerHTML.trim() === "" || el.innerHTML === "<br>";

		if (isFocusedNow && !isEmpty) {
			if (html !== lastStoredRef.current) {
				el.innerHTML = html;
				renderListMarkdown(el);
				lastStoredRef.current = html;
			}
		} else {
			el.innerHTML = html;
			renderListMarkdown(el);
			lastStoredRef.current = html;
		}
	}, [html]);

	// ── Save to store ───────────────────────────────────────────────────────────
	function saveToStore() {
		if (!ref.current) return;
		const normalized = normalizeListForStorage(ref.current);
		lastStoredRef.current = normalized;
		updateBlock(block.id, { html: normalized });
	}

	const handleInput = () => saveToStore();

	const handleBlur = () => {
		setIsFocused(false);
		saveToStore();
	};

	// ── Keyboard ────────────────────────────────────────────────────────────────
	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Tab") {
			e.preventDefault();
			document.execCommand(e.shiftKey ? "outdent" : "indent", false);
			saveToStore();
			return;
		}

		if (e.key === "Enter") {
			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				let node: Node | null = range.startContainer;

				while (node && node !== ref.current) {
					if (node.nodeName === "LI") {
						const li = node as HTMLLIElement;

						if (li.textContent?.trim() === "") {
							const allLis = ref.current?.querySelectorAll("li") ?? [];
							const isLastLi = allLis[allLis.length - 1] === li;
							const isNested = li.parentNode?.parentNode !== ref.current;

							if (isNested) {
								e.preventDefault();
								document.execCommand("outdent", false);
								saveToStore();
								return;
							}

							if (allLis.length > 1 && isLastLi) {
								e.preventDefault();
								li.parentNode?.removeChild(li);
								saveToStore();

								const nextBlockId = uuidv4();
								const curIndex = blocks.findIndex((b) => b.id === block.id);
								addBlock({ id: nextBlockId, type: "paragraph", props: { text: "" } }, curIndex + 1);
								setTimeout(() => selectBlock(nextBlockId), 10);
								return;
							}
						}
						break;
					}
					node = node.parentNode;
				}
			}
		}

		if (e.key === "Backspace") {
			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				let node: Node | null = range.startContainer;

				while (node && node !== ref.current) {
					if (node.nodeName === "LI") {
						const li = node as HTMLLIElement;
						const preRange = range.cloneRange();
						preRange.selectNodeContents(li);
						preRange.setEnd(range.startContainer, range.startOffset);
						const isAtStart = preRange.toString().length === 0;
						const isNested = li.parentNode?.parentNode !== ref.current;

						if (isAtStart && isNested) {
							e.preventDefault();
							document.execCommand("outdent", false);
							saveToStore();
							return;
						}
						break;
					}
					node = node.parentNode;
				}
			}

			if ((ref.current?.textContent?.trim() ?? "") === "") {
				e.preventDefault();
				removeBlocks([block.id]);
				return;
			}
		}
	};

	return (
		<div
			style={{
				position: "relative",
				padding: "4px 8px",
				borderRadius: "var(--radius-md)",
				background: isFocused ? "var(--bg-elevated)" : "transparent",
				transition: "background 0.2s",
			}}
		>
			<div
				ref={ref}
				contentEditable
				suppressContentEditableWarning
				data-block-id={block.id}
				onFocus={() => setIsFocused(true)}
				onBlur={handleBlur}
				onInput={handleInput}
				onKeyDown={handleKeyDown}
				style={{
					outline: "none",
					fontSize: "15px",
					lineHeight: "1.7",
					color: "var(--text-primary)",
					minHeight: "24px",
				}}
				className="rich-list-content"
			/>
		</div>
	);
}
