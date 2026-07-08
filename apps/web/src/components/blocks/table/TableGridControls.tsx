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
	);
}
