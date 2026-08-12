import { PlusCircle, MinusCircle, Columns2, Rows2 } from "lucide-react";

export function TableGridControls({
	addRow,
	deleteRow,
	addColumn,
	deleteColumn,
}: {
	addRow: () => void;
	deleteRow: () => void;
	addColumn: () => void;
	deleteColumn: () => void;
}) {
	return (
		<div
			style={{
				display: "flex",
				gap: 4,
				alignItems: "center",
				flexWrap: "wrap",
				padding: "4px 8px",
				background: "var(--bg-surface)",
				border: "1px solid var(--border-subtle)",
				borderRadius: "var(--radius-sm)",
			}}
		>
			<span
				style={{
					fontSize: 11,
					color: "var(--text-muted)",
					fontWeight: 600,
					letterSpacing: "0.06em",
					textTransform: "uppercase",
					marginRight: 4,
				}}
			>
				Grid Controls
			</span>
			{[
				{
					label: "Add Row",
					icon: (
						<>
							<PlusCircle size={13} /> Row
						</>
					),
					action: addRow,
				},
				{
					label: "Delete Row",
					icon: (
						<>
							<MinusCircle size={13} /> Row
						</>
					),
					action: deleteRow,
				},
				{
					label: "Add Col",
					icon: (
						<>
							<Columns2 size={13} /> Add Col
						</>
					),
					action: addColumn,
				},
				{
					label: "Delete Col",
					icon: (
						<>
							<Rows2 size={13} /> Del Col
						</>
					),
					action: deleteColumn,
				},
			].map(({ label, icon, action }) => (
				<button
					key={label}
					onClick={action}
					title={label}
					className="ide-btn"
					style={{ fontSize: 12, transition: "background 0.1s, color 0.1s" }}
				>
					{icon}
				</button>
			))}
		</div>
	);
}
