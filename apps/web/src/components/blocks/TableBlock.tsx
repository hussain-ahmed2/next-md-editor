"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { useRef, useEffect, useMemo, useCallback } from "react";
import { htmlToMarkdown } from "@/utils/editorShortcuts";
import { renderInlineMarkdown } from "@/features/markdown/highlighter";
import { PlusCircle, MinusCircle, Columns2, Rows2 } from "lucide-react";

function TableCell({
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
		if (document.activeElement !== el) {
			const currentMarkdown = htmlToMarkdown(el.innerHTML);
			if (currentMarkdown !== cellValue) {
				el.innerHTML = renderInlineMarkdown(cellValue);
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

export function TableBlock({ block }: { block: Block }) {
	const updateBlock = useEditorStore((s) => s.updateBlock);
	const blocks = useEditorStore((s) => s.blocks);
	const myBlock = blocks.find((b) => b.id === block.id) ?? block;
	const rows = useMemo(
		() =>
			(myBlock.props.rows as string[][]) ?? [
				["Column 1", "Column 2"],
				["Cell 1", "Cell 2"],
			],
		[myBlock.props.rows],
	);

	const handleCellInput = useCallback(
		(rIdx: number, cIdx: number, html: string) => {
			const markdownValue = htmlToMarkdown(html);
			const nextRows = rows.map((r, ri) =>
				ri === rIdx ? r.map((c, ci) => (ci === cIdx ? markdownValue : c)) : r,
			);
			updateBlock(block.id, { rows: nextRows });
		},
		[rows, block.id, updateBlock],
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

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "8px 0" }}>
			{/* Visual Table Container */}
			<div
				style={{
					overflowX: "auto",
					borderRadius: 8,
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

			{/* Glassmorphic Action Bar */}
			<div
				style={{
					display: "flex",
					gap: 8,
					alignItems: "center",
					flexWrap: "wrap",
					padding: "4px 8px",
					background: "var(--bg-elevated)",
					border: "1px dashed var(--border)",
					borderRadius: 6,
				}}
			>
				<span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginRight: 4 }}>
					GRID CONTROLS:
				</span>
				{[
					{
						label: "Add Row",
						icon: (
							<>
								<PlusCircle size={12} /> Row
							</>
						),
						action: addRow,
					},
					{
						label: "Delete Row",
						icon: (
							<>
								<MinusCircle size={12} /> Row
							</>
						),
						action: deleteRow,
					},
					{
						label: "Add Col",
						icon: (
							<>
								<Columns2 size={12} /> Add Col
							</>
						),
						action: addColumn,
					},
					{
						label: "Delete Col",
						icon: (
							<>
								<Rows2 size={12} /> Del Col
							</>
						),
						action: deleteColumn,
					},
				].map(({ label, icon, action }) => (
					<button
						key={label}
						onClick={action}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
							padding: "4px 8px",
							fontSize: 11,
							fontWeight: 600,
							borderRadius: 4,
							border: "1px solid var(--border)",
							background: "transparent",
							color: "var(--text-secondary)",
							cursor: "pointer",
						}}
					>
						{icon}
					</button>
				))}
			</div>
		</div>
	);
}
