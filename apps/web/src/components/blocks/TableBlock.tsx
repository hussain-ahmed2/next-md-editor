"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { htmlToMarkdown } from "@/utils/editorShortcuts";
import { TableCell } from "./table/TableCell";
import { TableFormatToolbar } from "./table/TableFormatToolbar";
import { TableGridControls } from "./table/TableGridControls";

export function TableBlock({ block }: { block: Block }) {
	const updateBlock = useEditorStore((s) => s.updateBlock);
	const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
	// Narrow selector: re-renders only when THIS block changes, not on
	// every keystroke elsewhere in the document.
	const myBlock = useEditorStore((s) => s.blocks.find((b) => b.id === block.id)) ?? block;
	const isFocused = selectedBlockIds.includes(block.id);

	const rows = useMemo(
		() =>
			(myBlock.props.rows as string[][]) ?? [
				["Column 1", "Column 2"],
				["Cell 1", "Cell 2"],
			],
		[myBlock.props.rows],
	);

	// Cell typing is debounced to match the rich-text blocks: htmlToMarkdown
	// runs a full unified pipeline, and each commit re-serializes the whole
	// document for the preview, so doing it per keystroke was very costly.
	const pendingCellRef = useRef<{ rIdx: number; cIdx: number; html: string } | null>(null);
	const cellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const commitPendingCell = useCallback(() => {
		const pending = pendingCellRef.current;
		if (!pending) return;
		pendingCellRef.current = null;
		const markdownValue = htmlToMarkdown(pending.html);
		const currentRows =
			(useEditorStore.getState().blocks.find((b) => b.id === block.id)?.props
				.rows as string[][]) ?? rows;
		if (currentRows[pending.rIdx]?.[pending.cIdx] === markdownValue) return;
		const nextRows = currentRows.map((r, ri) =>
			ri === pending.rIdx ? r.map((c, ci) => (ci === pending.cIdx ? markdownValue : c)) : r,
		);
		updateBlock(block.id, { rows: nextRows });
	}, [rows, block.id, updateBlock]);

	const handleCellInput = useCallback(
		(rIdx: number, cIdx: number, html: string) => {
			pendingCellRef.current = { rIdx, cIdx, html };
			if (cellTimerRef.current) clearTimeout(cellTimerRef.current);
			cellTimerRef.current = setTimeout(commitPendingCell, 400);
		},
		[commitPendingCell],
	);

	// Never lose the last keystrokes when the block unmounts (tab switch,
	// file switch, block delete). Held in a ref so this runs on unmount only,
	// not every time `rows` changes.
	const commitRef = useRef(commitPendingCell);
	useEffect(() => {
		commitRef.current = commitPendingCell;
	}, [commitPendingCell]);
	useEffect(
		() => () => {
			if (cellTimerRef.current) clearTimeout(cellTimerRef.current);
			commitRef.current();
		},
		[],
	);

	// Add a new row to the table
	const addRow = () => {
		const colCount = rows[0]?.length || 2;
		const newRows = [...rows, Array(colCount).fill("New Cell")];
		updateBlock(block.id, { rows: newRows });
	};

	// Delete the last row (keep header + at least 1 data row)
	const deleteRow = () => {
		if (rows.length <= 2) return;
		updateBlock(block.id, { rows: rows.slice(0, -1) });
	};

	// Add a new column
	const addColumn = () => {
		const newRows = rows.map((r, idx) => [...r, idx === 0 ? `Column ${r.length + 1}` : "New Cell"]);
		updateBlock(block.id, { rows: newRows });
	};

	// Delete the last column
	const deleteColumn = () => {
		if (rows[0]?.length <= 1) return;
		updateBlock(block.id, { rows: rows.map((r) => r.slice(0, -1)) });
	};

	const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

	const updateFormats = useCallback(() => {
		const activeEl = document.activeElement;
		if (activeEl && (activeEl.tagName === "TD" || activeEl.tagName === "TH")) {
			const selection = window.getSelection();
			let isCode = false;
			let isLink = false;
			if (selection && selection.rangeCount > 0) {
				const checkNode = (n: Node | null) => {
					let curr = n;
					while (curr && curr !== activeEl) {
						if (curr.nodeName.toLowerCase() === "code") isCode = true;
						if (curr.nodeName.toLowerCase() === "a") isLink = true;
						curr = curr.parentNode;
					}
				};
				checkNode(selection.anchorNode);
				checkNode(selection.focusNode);
			}
			setActiveFormats({
				bold: document.queryCommandState("bold"),
				italic: document.queryCommandState("italic"),
				strikeThrough: document.queryCommandState("strikeThrough"),
				code: isCode,
				link: isLink,
			});
		}
	}, []);

	useEffect(() => {
		if (!isFocused) return;
		document.addEventListener("selectionchange", updateFormats);
		return () => document.removeEventListener("selectionchange", updateFormats);
	}, [isFocused, updateFormats]);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "8px 0" }}>
			{/* Format Toolbar (Top) */}
			{isFocused && (
				<TableFormatToolbar
					blockId={block.id}
					activeFormats={activeFormats}
					updateFormats={updateFormats}
				/>
			)}

			{/* Visual Table Container */}
			<div
				style={{
					overflowX: "auto",
					borderRadius: "var(--radius-md)",
					border: "1px solid var(--border)",
					background: "var(--bg-surface)",
				}}
			>
				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
						fontSize: 14,
						textAlign: "left",
					}}
				>
					<thead>
						<tr style={{ borderBottom: "2px solid var(--border)", background: "var(--bg-elevated)" }}>
							{rows[0]?.map((cell, cIdx) => (
								<TableCell
									key={cIdx}
									cellValue={cell}
									rIdx={0}
									cIdx={cIdx}
									isHeader={true}
									blockId={block.id}
									onInput={handleCellInput}
								/>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.slice(1).map((row, rOffset) => {
							const rIdx = rOffset + 1;
							return (
								<tr
									key={rIdx}
									style={{
										borderBottom: "1px solid var(--border-subtle)",
										background: rIdx % 2 === 0 ? "var(--bg-hover)" : "transparent",
									}}
								>
									{row.map((cell, cIdx) => (
										<TableCell
											key={cIdx}
											cellValue={cell}
											rIdx={rIdx}
											cIdx={cIdx}
											isHeader={false}
											blockId={block.id}
											onInput={handleCellInput}
										/>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Grid controls action bar */}
			<TableGridControls
				addRow={addRow}
				deleteRow={deleteRow}
				addColumn={addColumn}
				deleteColumn={deleteColumn}
			/>
		</div>
	);
}
