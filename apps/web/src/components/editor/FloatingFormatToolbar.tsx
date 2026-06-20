"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { RichText, FormatFlags, Block } from "@next-md-editor/types";
import { getSelectionRichRange, getActiveFormats, toggleRichFormat, getDomTextOffset } from "@next-md-editor/markdown";
import { LinkDialog } from "./LinkDialog";
import { EmojiPicker } from "./EmojiPicker";
import { insertEmoji } from "@/utils/insert-emoji";

type FormatAction = "bold" | "italic" | "code" | "strikethrough" | "link";

function findBlockById(blocks: Block[], id: string): Block | undefined {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.children) {
      const found = findBlockById(block.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

interface BlockToolbarProps {
  blockId: string;
}

export function BlockToolbar({ blockId }: BlockToolbarProps) {
	const [activeFormats, setActiveFormats] = useState<FormatFlags>({});
	const [linkDialog, setLinkDialog] = useState<{ url: string } | null>(null);
	const [emojiPicker, setEmojiPicker] = useState(false);
	const emojiBtnRef = useRef<HTMLButtonElement>(null);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const rangeRef = useRef<{ start: number; end: number } | null>(null);
	const savedSelRef = useRef<{ el: HTMLElement; start: number; end: number } | null>(null);

	const getContentEditable = useCallback(() => {
		return document.querySelector<HTMLElement>(`[contenteditable][data-block-id="${blockId}"]`);
	}, [blockId]);

	const updateFormats = useCallback(() => {
		const el = getContentEditable();
		if (!el) return;

		const sel = window.getSelection();
		if (!sel || !sel.rangeCount) return;

		const blocks = useEditorStore.getState().blocks;
		const block = findBlockById(blocks, blockId);
		if (!block || !Array.isArray(block.props.content)) return;
		const content = block.props.content as RichText;
		const richRange = getSelectionRichRange(content, el);
		if (richRange) {
			rangeRef.current = { start: richRange.start, end: richRange.end };
			setActiveFormats(getActiveFormats(content, richRange.start));
		}
	}, [blockId, getContentEditable]);

	useEffect(() => {
		updateFormats();
	}, [updateFormats]);

	useEffect(() => {
		const handleSelectionChange = () => {
			if (!getContentEditable()) return;
			updateFormats();
		};
		document.addEventListener("selectionchange", handleSelectionChange);
		return () => document.removeEventListener("selectionchange", handleSelectionChange);
	}, [updateFormats, getContentEditable]);

	const apply = useCallback(
		(action: FormatAction) => {
			const el = getContentEditable();
			if (!el) return;

			const blocks = useEditorStore.getState().blocks;
			const block = findBlockById(blocks, blockId);
			if (!block || !Array.isArray(block.props.content)) return;
			const content = block.props.content as RichText;

			const sel = window.getSelection();
			if (!sel || !sel.rangeCount) return;
			const richRange = getSelectionRichRange(content, el);
			if (!richRange) return;

			const efEnd = Math.max(richRange.start + 1, richRange.end);

			if (action === "link") {
				setLinkDialog({ url: getActiveFormats(content, richRange.start).link || "https://" });
				return;
			}

			rangeRef.current = { start: richRange.start, end: efEnd };
			useEditorStore.getState().updateBlock(blockId, {
				content: toggleRichFormat(content, richRange.start, efEnd, { [action]: true }),
			});
		},
		[blockId, getContentEditable],
	);

	const applyLink = useCallback(
		(url: string) => {
			const blocks = useEditorStore.getState().blocks;
			const block = findBlockById(blocks, blockId);
			if (!block || !Array.isArray(block.props.content)) return;
			const content = block.props.content as RichText;

			const el = getContentEditable();
			if (!el) return;
			const sel = window.getSelection();
			if (!sel || !sel.rangeCount) return;
			const richRange = getSelectionRichRange(content, el);
			if (!richRange) return;

			useEditorStore.getState().updateBlock(blockId, {
				content: toggleRichFormat(content, richRange.start, Math.max(richRange.start + 1, richRange.end), { link: url }),
			});
			setLinkDialog(null);
		},
		[blockId, getContentEditable],
	);

	const removeLink = useCallback(() => {
		const blocks = useEditorStore.getState().blocks;
		const block = findBlockById(blocks, blockId);
		if (!block || !Array.isArray(block.props.content) || !rangeRef.current) return;
		const content = block.props.content as RichText;
		const { start, end } = rangeRef.current;
		useEditorStore.getState().updateBlock(blockId, {
			content: toggleRichFormat(content, start, end, { link: activeFormats.link || "https://" }),
		});
		setLinkDialog(null);
	}, [blockId, activeFormats.link]);

	const handleEmoji = useCallback((emoji: string) => {
		setEmojiPicker(false);
		const saved = savedSelRef.current;
		if (saved) {
			const { el, start, end } = saved;
			const range = document.createRange();
			const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
			let pos = 0;
			let node: Node | null;
			let targetNode: Node | null = null;
			let targetOffset = 0;
			while ((node = walker.nextNode())) {
				const len = node.textContent?.length ?? 0;
				if (pos + len >= start) {
					targetNode = node;
					targetOffset = start - pos;
					break;
				}
				pos += len;
			}
			if (targetNode) {
				range.setStart(targetNode, targetOffset);
				range.collapse(true);
				const sel = window.getSelection();
				if (sel) {
					sel.removeAllRanges();
					sel.addRange(range);
				}
				document.execCommand("insertText", false, emoji);
				el.dispatchEvent(new Event("input", { bubbles: true }));
			}
		} else {
			insertEmoji(emoji);
		}
	}, []);

	const handleEmojiClick = useCallback(() => {
		const el = getContentEditable();
		if (el) {
			const sel = window.getSelection();
			if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode as Node)) {
				const start = getDomTextOffset(el, sel.anchorNode!, sel.anchorOffset);
				const end = sel.focusNode ? getDomTextOffset(el, sel.focusNode, sel.focusOffset) : start;
				savedSelRef.current = { el, start, end };
			} else {
				savedSelRef.current = null;
			}
		}
		setEmojiPicker((p) => !p);
	}, [getContentEditable]);

	const buttons: { action: FormatAction; label: React.ReactNode }[] = [
		{ action: "bold", label: <strong style={{ fontSize: 13, letterSpacing: 0 }}>B</strong> },
		{ action: "italic", label: <em style={{ fontSize: 13 }}>I</em> },
		{ action: "code", label: <code style={{ fontSize: 12 }}>{`\`\`\``}</code> },
		{ action: "strikethrough", label: <del style={{ fontSize: 13 }}>S</del> },
		{ action: "link", label: <span style={{ fontSize: 11 }}>Link</span> },
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
		<>
			<div
				ref={toolbarRef}
				onMouseDown={(e) => e.preventDefault()}
				style={{
					display: "flex",
					alignItems: "center",
					gap: 2,
					padding: "4px 0 8px",
					marginBottom: 8,
					borderBottom: "1px solid var(--border-subtle)",
				}}
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
								padding: "3px 7px",
								cursor: "pointer",
								color: active ? "#fff" : "var(--text-secondary)",
								fontSize: 12,
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
				<div style={{ width: 1, height: 16, background: "var(--border-subtle)", margin: "0 4px" }} />
				<div style={{ position: "relative", display: "inline-flex" }}>
					<button
						ref={emojiBtnRef}
						onClick={handleEmojiClick}
						title="Emoji"
						style={{
							background: emojiPicker ? "var(--accent)" : "transparent",
							border: "none",
							borderRadius: 4,
							padding: "3px 7px",
							cursor: "pointer",
							color: emojiPicker ? "#fff" : "var(--text-secondary)",
							fontSize: 15,
							lineHeight: 1,
							transition: "all 0.12s",
						}}
						onMouseEnter={(e) => {
							if (!emojiPicker) {
								e.currentTarget.style.background = "var(--bg-elevated)";
								e.currentTarget.style.color = "var(--text-primary)";
							}
						}}
						onMouseLeave={(e) => {
							if (!emojiPicker) {
								e.currentTarget.style.background = "transparent";
								e.currentTarget.style.color = "var(--text-secondary)";
							}
						}}
					>
						😊
					</button>
					{emojiPicker && <EmojiPicker onSelect={handleEmoji} onClose={() => setEmojiPicker(false)} buttonRef={emojiBtnRef} />}
				</div>
			</div>
			{linkDialog && (() => {
				const tr = toolbarRef.current?.getBoundingClientRect();
				const linkPos = tr ? { top: tr.bottom + 4, left: tr.left + tr.width / 2 } : { top: 80, left: window.innerWidth / 2 };
				return (
					<LinkDialog
						initialUrl={linkDialog.url}
						position={linkPos}
						onApply={applyLink}
						onRemove={activeFormats.link ? removeLink : undefined}
						onCancel={() => setLinkDialog(null)}
					/>
				);
			})()}
		</>
	);
}
