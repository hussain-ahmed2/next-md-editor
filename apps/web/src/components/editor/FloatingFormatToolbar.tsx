"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { getDomTextOffset } from "@next-md-editor/markdown";
import { Brain } from "lucide-react";
import { LinkDialog } from "./LinkDialog";
import { EmojiPicker } from "./EmojiPicker";
import { insertEmoji } from "@/utils/insert-emoji";
import { BlockAiDialog, TEXT_BLOCK_TYPES } from "./BlockAiDialog";

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

function getParentLinkUrl(sel: Selection | null): string | null {
  if (!sel || !sel.rangeCount) return null;
  const node = sel.anchorNode;
  if (!node) return null;
  let el: Element | null = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
  while (el && el.getAttribute("contenteditable") !== "true") {
    if (el.tagName === "A") return (el as HTMLAnchorElement).getAttribute("href");
    el = el.parentElement;
  }
  return null;
}

function isInCodeElement(sel: Selection | null): boolean {
  if (!sel || !sel.rangeCount) return false;
  const node = sel.anchorNode;
  if (!node) return false;
  let el: Element | null = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
  while (el && el.getAttribute("contenteditable") !== "true") {
    if (el.tagName === "CODE" || el.tagName === "PRE") return true;
    el = el.parentElement;
  }
  return false;
}

interface BlockToolbarProps {
  blockId: string;
}

export function BlockToolbar({ blockId }: BlockToolbarProps) {
	const b = findBlockById(useEditorStore.getState().blocks, blockId);
	const isTextBlock = b && TEXT_BLOCK_TYPES.has(b.type);
	if (!isTextBlock) return null;

	const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
	const [linkUrl, setLinkUrl] = useState<string | null>(null);
	const [linkDialog, setLinkDialog] = useState<{ url: string } | null>(null);
	const [emojiPicker, setEmojiPicker] = useState(false);
	const [aiDialogOpen, setAiDialogOpen] = useState(false);
	const emojiBtnRef = useRef<HTMLButtonElement>(null);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const savedSelRef = useRef<{ el: HTMLElement; start: number; end: number } | null>(null);
	const savedRangeRef = useRef<Range | null>(null);

	const getContentEditable = useCallback(() => {
		return document.querySelector<HTMLElement>(`[contenteditable][data-block-id="${blockId}"]`);
	}, [blockId]);

	const updateFormats = useCallback(() => {
		const el = getContentEditable();
		if (!el || document.activeElement !== el) return;
		const sel = window.getSelection();
		if (!sel || !sel.rangeCount) return;

		setActiveFormats({
			bold: document.queryCommandState("bold"),
			italic: document.queryCommandState("italic"),
			strikethrough: document.queryCommandState("strikeThrough"),
			code: isInCodeElement(sel),
		});
		setLinkUrl(getParentLinkUrl(sel));
	}, [getContentEditable]);

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

	const apply = useCallback((action: FormatAction) => {
		const el = getContentEditable();
		if (!el) return;

		switch (action) {
			case "bold":
				document.execCommand("bold");
				break;
			case "italic":
				document.execCommand("italic");
				break;
			case "strikethrough":
				document.execCommand("strikeThrough");
				break;
			case "code":
				const sel = window.getSelection();
				if (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
					if (isInCodeElement(sel)) {
						document.execCommand("insertHTML", false, sel.toString());
					} else {
						document.execCommand("insertHTML", false, "<code>" + sel.toString() + "</code>");
					}
				} else {
					return;
				}
				break;
			case "link": {
				const s = window.getSelection();
				if (s && s.rangeCount > 0) savedRangeRef.current = s.getRangeAt(0).cloneRange();
				setLinkDialog({ url: linkUrl || "https://" });
				return;
			}
		}

		el.dispatchEvent(new Event("input", { bubbles: true }));
	}, [getContentEditable, linkUrl]);

	const applyLink = useCallback((url: string) => {
		const el = getContentEditable();
		if (!el) return;
		const saved = savedRangeRef.current;
		if (saved) {
			el.focus();
			const sel = window.getSelection();
			if (sel) {
				sel.removeAllRanges();
				sel.addRange(saved);
			}
		}
		document.execCommand("unlink");
		if (url) {
			document.execCommand("createLink", false, url);
		}
		el.dispatchEvent(new Event("input", { bubbles: true }));
		savedRangeRef.current = null;
		setLinkDialog(null);
	}, [getContentEditable]);

	const removeLink = useCallback(() => {
		const el = getContentEditable();
		if (!el) return;
		const saved = savedRangeRef.current;
		if (saved) {
			el.focus();
			const sel = window.getSelection();
			if (sel) {
				sel.removeAllRanges();
				sel.addRange(saved);
			}
		}
		document.execCommand("unlink");
		el.dispatchEvent(new Event("input", { bubbles: true }));
		savedRangeRef.current = null;
		setLinkDialog(null);
	}, [getContentEditable]);

	const handleEmoji = useCallback((emoji: string) => {
		setEmojiPicker(false);

		const insertViaRange = (range: Range) => {
			const el = range.startContainer.parentElement?.closest("[contenteditable]") as HTMLElement | null;
			if (!el) return false;
			el.focus();
			const sel = window.getSelection();
			if (sel) {
				sel.removeAllRanges();
				sel.addRange(range);
			}
			insertEmoji(emoji);
			return true;
		};

		const savedRange = savedRangeRef.current;
		if (savedRange) {
			savedRangeRef.current = null;
			if (insertViaRange(savedRange)) return;
		}

		const savedSel = savedSelRef.current;
		if (savedSel) {
			const { el, start } = savedSel;
			el.focus();
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
				if (insertViaRange(range)) return;
			}
		}

		insertEmoji(emoji);
	}, []);

	const handleEmojiClick = useCallback(() => {
		const el = getContentEditable();
		if (el) {
			const sel = window.getSelection();
			if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode as Node)) {
				savedRangeRef.current = sel.getRangeAt(0).cloneRange();
				const start = getDomTextOffset(el, sel.anchorNode!, sel.anchorOffset);
				const end = sel.focusNode ? getDomTextOffset(el, sel.focusNode, sel.focusOffset) : start;
				savedSelRef.current = { el, start, end };
			} else {
				savedRangeRef.current = null;
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
		if (action === "link") return !!linkUrl;
		return !!activeFormats[action];
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
				<div style={{ width: 1, height: 16, background: "var(--border-subtle)", margin: "0 4px" }} />
				{(() => {
					const b = findBlockById(useEditorStore.getState().blocks, blockId);
					return b && TEXT_BLOCK_TYPES.has(b.type);
				})() && (
					<button
						onClick={() => setAiDialogOpen(true)}
						title="Edit with AI"
						style={{
							background: aiDialogOpen ? "var(--accent)" : "transparent",
							border: "none",
							borderRadius: 4,
							padding: "3px 7px",
							cursor: "pointer",
							color: aiDialogOpen ? "#fff" : "var(--text-secondary)",
							fontSize: 12,
							transition: "all 0.12s",
						}}
						onMouseEnter={(e) => {
							if (!aiDialogOpen) {
								e.currentTarget.style.background = "var(--bg-elevated)";
								e.currentTarget.style.color = "var(--text-primary)";
							}
						}}
						onMouseLeave={(e) => {
							if (!aiDialogOpen) {
								e.currentTarget.style.background = "transparent";
								e.currentTarget.style.color = "var(--text-secondary)";
							}
						}}
					>
						<Brain size={13} />
					</button>
				)}
			</div>
			{aiDialogOpen && <BlockAiDialog blockId={blockId} onClose={() => setAiDialogOpen(false)} />}
			{linkDialog && (() => {
				const tr = toolbarRef.current?.getBoundingClientRect();
				const linkPos = tr ? { top: tr.bottom + 4, left: tr.left + tr.width / 2 } : { top: 80, left: window.innerWidth / 2 };
				return (
					<LinkDialog
						initialUrl={linkDialog.url}
						position={linkPos}
						onApply={applyLink}
						onRemove={linkUrl ? removeLink : undefined}
						onCancel={() => setLinkDialog(null)}
					/>
				);
			})()}
		</>
	);
}
