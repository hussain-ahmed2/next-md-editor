"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useDragOperation } from "@dnd-kit/react";
import type { RichText, FormatFlags, Block } from "@next-md-editor/types";
import { getSelectionRichRange, getActiveFormats, toggleRichFormat, applyRichFormat } from "@next-md-editor/markdown";
import { LinkDialog } from "./LinkDialog";

type FormatAction = "bold" | "italic" | "code" | "strikethrough" | "link";

export function FloatingFormatToolbar() {
	const [visible, setVisible] = useState(false);
	const [pos, setPos] = useState({ top: 0, left: 0 });
	const [activeFormats, setActiveFormats] = useState<FormatFlags>({});
	const [linkDialog, setLinkDialog] = useState<{ url: string } | null>(null);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const blockIdRef = useRef<string | null>(null);
	const rangeRef = useRef<{ start: number; end: number } | null>(null);
	const elementRef = useRef<HTMLElement | null>(null);
	const isRichTextRef = useRef(false);

	// Hide toolbar while a DnD drag is in progress — dragging causes phantom
	// selectionchange events that make the toolbar flicker after a drop.
	const { source: dragSource } = useDragOperation();
	const isDragging = dragSource !== null;

	// Reset link dialog state when the toolbar becomes invisible
	useEffect(() => {
		if (!visible) {
			setLinkDialog(null);
		}
	}, [visible]);

	const update = useCallback(() => {
		// Suppress updates while a DnD drag is in flight
		if (isDragging) {
			setVisible(false);
			return;
		}
		// If the user is currently interacting with the LinkDialog or toolbar,
		// do not hide or reset the toolbar.
		if (
			containerRef.current &&
			document.activeElement &&
			containerRef.current.contains(document.activeElement)
		) {
			return;
		}

		const sel = window.getSelection();
		if (!sel || sel.isCollapsed || !sel.rangeCount) {
			setVisible(false);
			return;
		}

		let el: Node | null = sel.anchorNode;
		let contentEditable: HTMLElement | null = null;
		while (el) {
			if (el instanceof HTMLElement && el.isContentEditable && el.hasAttribute("data-block-id")) {
				contentEditable = el;
				break;
			}
			el = el.parentNode;
		}
		if (!contentEditable) {
			setVisible(false);
			return;
		}

		const bid = contentEditable.getAttribute("data-block-id");
		if (!bid) {
			setVisible(false);
			return;
		}

		elementRef.current = contentEditable;
		blockIdRef.current = bid;

		const blocks = useEditorStore.getState().blocks;
		const block = findBlockById(blocks, bid);

		if (block && Array.isArray(block.props.content)) {
			isRichTextRef.current = true;
			const content = block.props.content as RichText;
			const range = getSelectionRichRange(content, contentEditable);
			if (!range || range.start >= range.end) {
				setVisible(false);
				return;
			}
			const formats = getActiveFormats(content, range.start);
			setActiveFormats(formats);
			rangeRef.current = range;
		} else {
			isRichTextRef.current = false;
			rangeRef.current = null;
			setActiveFormats({
				bold: document.queryCommandState("bold"),
				italic: document.queryCommandState("italic"),
				strikethrough: document.queryCommandState("strikeThrough"),
				code: isInsideCodeElement(contentEditable),
			});
		}

		const selRect = sel.getRangeAt(0).getBoundingClientRect();
		const h = toolbarRef.current?.offsetHeight ?? 40;
		let top = selRect.top - h - 8;
		let left = selRect.left + selRect.width / 2;
		if (top < 8) top = selRect.bottom + 8;
		const maxLeft = window.innerWidth - 20;
		if (left > maxLeft) left = maxLeft;
		if (left < 20) left = 20;

		setPos({ top, left });
		setVisible(true);
	}, [isDragging]);

	// Immediately hide toolbar when drag starts
	useEffect(() => {
		if (isDragging) {
			setVisible(false);
		}
	}, [isDragging]);

	useEffect(() => {
		document.addEventListener("selectionchange", update);
		window.addEventListener("scroll", update, true);
		window.addEventListener("resize", update);
		return () => {
			document.removeEventListener("selectionchange", update);
			window.removeEventListener("scroll", update, true);
			window.removeEventListener("resize", update);
		};
	}, [update]);

	const apply = useCallback((action: FormatAction) => {
		const bid = blockIdRef.current;
		if (!bid) return;

		if (isRichTextRef.current) {
			if (!rangeRef.current) return;
			const blocks = useEditorStore.getState().blocks;
			const block = findBlockById(blocks, bid);
			if (!block || !Array.isArray(block.props.content)) return;
			const content = block.props.content as RichText;
			const { start, end } = rangeRef.current;

			let format: FormatFlags;
			if (action === "link") {
				const currentUrl = (activeFormats.link as string) || "https://";
				setLinkDialog({ url: currentUrl });
				return;
			} else if (action === "code") {
				format = { code: true };
			} else if (action === "bold") {
				format = { bold: true };
			} else if (action === "italic") {
				format = { italic: true };
			} else if (action === "strikethrough") {
				format = { strikethrough: true };
			} else {
				return;
			}

			const newContent = toggleRichFormat(content, start, end, format);
			useEditorStore.getState().updateBlock(bid, { content: newContent });
		} else {
			const el = elementRef.current;
			if (!el) return;
			el.focus();

			if (action === "code") {
				const sel = window.getSelection();
				if (!sel || !sel.rangeCount) return;
				const range = sel.getRangeAt(0);
				const text = range.toString();
				if (!text) return;

				if (isInsideCodeElement(elementRef.current!)) {
					const codeEl = findAncestorCodeElement(elementRef.current!, sel.anchorNode);
					if (codeEl && codeEl.parentNode) {
						const txt = document.createTextNode(codeEl.textContent || "");
						codeEl.parentNode.replaceChild(txt, codeEl);
						const newRange = document.createRange();
						newRange.setStartAfter(txt);
						newRange.collapse(true);
						sel.removeAllRanges();
						sel.addRange(newRange);
					}
				} else {
					range.deleteContents();
					const code = document.createElement("code");
					code.textContent = text;
					range.insertNode(code);
					range.setStartAfter(code);
					range.collapse(true);
					sel.removeAllRanges();
					sel.addRange(range);
				}
			} else if (action === "link") {
				const currentUrl = (activeFormats.link as string) || "https://";
				setLinkDialog({ url: currentUrl });
				return;
			} else if (action === "bold") {
				document.execCommand("bold");
			} else if (action === "italic") {
				document.execCommand("italic");
			} else if (action === "strikethrough") {
				document.execCommand("strikeThrough");
			}
		}
	}, []);

	const applyLink = useCallback(
		(url: string) => {
			const bid = blockIdRef.current;
			if (!bid || !url) return;

			if (isRichTextRef.current) {
				if (!rangeRef.current) return;
				const blocks = useEditorStore.getState().blocks;
				const block = findBlockById(blocks, bid);
				if (!block || !Array.isArray(block.props.content)) return;
				const content = block.props.content as RichText;
				const { start, end } = rangeRef.current;

				const isEdit = !!activeFormats.link;
				const newContent = isEdit
					? applyRichFormat(content, start, end, { link: url })
					: toggleRichFormat(content, start, end, { link: url });
				useEditorStore.getState().updateBlock(bid, { content: newContent });
			} else {
				const el = elementRef.current;
				if (!el) return;
				el.focus();

				const sel = window.getSelection();
				if (!sel || !sel.rangeCount) return;
				const range = sel.getRangeAt(0);
				const selectedText = range.toString();
				if (!selectedText) return;

				range.deleteContents();
				const anchor = document.createElement("a");
				anchor.href = url;
				anchor.textContent = selectedText;
				range.insertNode(anchor);
				range.setStartAfter(anchor);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}
			setLinkDialog(null);
			setVisible(false);
		},
		[activeFormats.link],
	);

	const removeLink = useCallback(() => {
		const bid = blockIdRef.current;
		if (!bid) return;

		if (isRichTextRef.current) {
			if (!rangeRef.current) return;
			const blocks = useEditorStore.getState().blocks;
			const block = findBlockById(blocks, bid);
			if (!block || !Array.isArray(block.props.content)) return;
			const content = block.props.content as RichText;
			const { start, end } = rangeRef.current;
			const newContent = toggleRichFormat(content, start, end, { link: activeFormats.link || "https://" });
			useEditorStore.getState().updateBlock(bid, { content: newContent });
		}
		setLinkDialog(null);
		setVisible(false);
	}, [activeFormats.link]);

	if (!visible) return null;

	const buttons: { action: FormatAction; label: React.ReactNode }[] = [
		{ action: "bold", label: <strong style={{ fontSize: 14, letterSpacing: 0 }}>B</strong> },
		{ action: "italic", label: <em style={{ fontSize: 14 }}>I</em> },
		{ action: "code", label: <code style={{ fontSize: 13 }}>{`\`\`\``}</code> },
		{ action: "strikethrough", label: <del style={{ fontSize: 14 }}>S</del> },
		{ action: "link", label: <span style={{ fontSize: 12 }}>Link</span> },
	];

	const hasFormat = (action: FormatAction): boolean => {
		if (action === "bold") return !!activeFormats.bold;
		if (action === "italic") return !!activeFormats.italic;
		if (action === "code") return !!activeFormats.code;
		if (action === "strikethrough") return !!activeFormats.strikethrough;
		if (action === "link") return !!activeFormats.link;
		return false;
	};

	return (
		<div ref={containerRef} style={{ display: "contents" }}>
			<div
				ref={toolbarRef}
				contentEditable={false}
				style={{
					position: "fixed",
					top: pos.top,
					left: pos.left,
					transform: "translateX(-50%)",
					zIndex: 9999,
					display: "flex",
					gap: 1,
					padding: "4px",
					background: "var(--bg-surface)",
					border: "1px solid var(--border)",
					borderRadius: "var(--radius-sm)",
					boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
					userSelect: "none",
					pointerEvents: "auto",
				}}
				onMouseDown={(e) => e.preventDefault()}
			>
				{buttons.map(({ action, label }) => {
					const active = hasFormat(action);
					return (
						<button
							key={action}
							onClick={() => apply(action)}
							title={action.charAt(0).toUpperCase() + action.slice(1)}
							style={{
								background: active ? "var(--accent)" : "transparent",
								border: "none",
								borderRadius: 4,
								padding: "4px 8px",
								cursor: "pointer",
								color: active ? "#fff" : "var(--text-secondary)",
								fontSize: 13,
								fontWeight: 500,
								transition: "all 0.12s",
							}}
							onMouseEnter={(e) => {
								if (!active) {
									e.currentTarget.style.background = "var(--bg-elevated)";
									e.currentTarget.style.color = "var(--text-primary)";
								}
							}}
							onMouseLeave={(e) => {
								if (!active) {
									e.currentTarget.style.background = "transparent";
									e.currentTarget.style.color = "var(--text-secondary)";
								}
							}}
						>
							{label}
						</button>
					);
				})}
			</div>
			{linkDialog && (
				<LinkDialog
					initialUrl={linkDialog.url}
					position={{ top: pos.top - 50, left: pos.left }}
					onApply={applyLink}
					onRemove={activeFormats.link ? removeLink : undefined}
					onCancel={() => {
						setLinkDialog(null);
						setVisible(false);
					}}
				/>
			)}
		</div>
	);
}

function findBlockById(blocks: Block[], id: string): Block | null {
	for (const b of blocks) {
		if (b.id === id) return b;
		if (b.children) {
			const found = findBlockById(b.children, id);
			if (found) return found;
		}
	}
	return null;
}

function findAncestorCodeElement(root: HTMLElement, node: Node | null): HTMLElement | null {
	while (node && node !== root) {
		if (node instanceof HTMLElement && node.tagName === "CODE") return node;
		node = node.parentNode;
	}
	return null;
}

function isInsideCodeElement(root: HTMLElement): boolean {
	const sel = window.getSelection();
	if (!sel || !sel.rangeCount) return false;
	let node: Node | null = sel.anchorNode;
	while (node && node !== root) {
		if (node instanceof HTMLElement && node.tagName === "CODE") return true;
		node = node.parentNode;
	}
	return false;
}
