"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { BlockRegistry } from "@next-md-editor/editor-core";
import { v4 as uuidv4 } from "uuid";
import { useDraggable } from "@dnd-kit/react";
import {
	Heading,
	Text,
	Quote,
	Code2,
	Minus,
	Table,
	Lightbulb,
	List,
	ListOrdered,
	LayoutGrid,
	Award,
	ImageIcon,
	GitFork,
	ChevronDown,
} from "lucide-react";

interface SidebarBlock {
	type: string;
	label: string;
	icon: React.ReactNode;
	description: string;
}

const BLOCK_PALETTE: SidebarBlock[] = [
	{
		type: "heading",
		label: "Heading",
		icon: <Heading size={18} />,
		description: "Section title",
	},
	{
		type: "paragraph",
		label: "Paragraph",
		icon: <Text size={18} />,
		description: "Body text",
	},
	{
		type: "quote",
		label: "Quote",
		icon: <Quote size={18} />,
		description: "Blockquote",
	},
	{
		type: "code",
		label: "Code",
		icon: <Code2 size={18} />,
		description: "Code block",
	},
	{
		type: "divider",
		label: "Divider",
		icon: <Minus size={18} />,
		description: "Horizontal rule",
	},
	{
		type: "image",
		label: "Image",
		icon: <ImageIcon size={18} />,
		description: "Insert an image",
	},
	{
		type: "image-grid",
		label: "Image Grid",
		icon: <LayoutGrid size={18} />,
		description: "Responsive grid table of images",
	},
	{
		type: "table",
		label: "Table",
		icon: <Table size={18} />,
		description: "Visual GFM grid table",
	},
	{
		type: "callout",
		label: "Callout",
		icon: <Lightbulb size={18} />,
		description: "Pastel alert callout box",
	},
	{
		type: "bullet-list",
		label: "Bullet List",
		icon: <List size={18} />,
		description: "Rich text bullet list block",
	},
	{
		type: "numbered-list",
		label: "Numbered List",
		icon: <ListOrdered size={18} />,
		description: "Rich text numbered list block",
	},
	{
		type: "badge-group",
		label: "Badge Group",
		icon: <Award size={18} />,
		description: "Badge group with shields.io style",
	},
	{
		type: "github-stats",
		label: "GitHub Stats",
		icon: <GitFork size={18} />,
		description: "GitHub profile stats card",
	},
	{
		type: "collapsible",
		label: "Collapsible",
		icon: <ChevronDown size={18} />,
		description: "Expandable details section",
	},
];

function DraggableSidebarItem({ b, handleAdd }: { b: SidebarBlock; handleAdd: (type: string) => void }) {
	const { ref, isDragging } = useDraggable({
		id: `sidebar-${b.type}`,
		data: {
			isSidebarItem: true,
			type: b.type,
			label: b.label,
			icon: b.icon,
		},
	});

	return (
		<div
			ref={ref}
			onClick={() => handleAdd(b.type)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleAdd(b.type);
				}
			}}
			title={b.description}
			role="button"
			tabIndex={0}
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 4,
				padding: "10px 6px",
				borderRadius: "var(--radius-md)",
				border: "1px solid transparent",
				background: "transparent",
				color: "var(--text-secondary)",
				cursor: isDragging ? "grabbing" : "grab",
				fontSize: 10,
				fontWeight: 600,
				transition: "all 0.15s ease",
				textAlign: "center",
				opacity: isDragging ? 0.5 : 1,
				outline: "none",
			}}
			onMouseEnter={(e) => {
				const el = e.currentTarget;
				el.style.background = "var(--bg-hover)";
				el.style.borderColor = "var(--border)";
				el.style.color = "var(--text-primary)";
			}}
			onMouseLeave={(e) => {
				const el = e.currentTarget;
				el.style.background = "transparent";
				el.style.borderColor = "transparent";
				el.style.color = "var(--text-secondary)";
			}}
		>
			<span
				style={{
					width: 32,
					height: 32,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					borderRadius: "var(--radius-sm)",
					background: "var(--accent-muted)",
					color: "var(--accent)",
				}}
			>
				{b.icon}
			</span>
			<span style={{ lineHeight: 1.2 }}>{b.label}</span>
		</div>
	);
}

import { useUIStore } from "@/store/uiStore";

export function EditorSidebar() {
	const addBlock = useEditorStore((s) => s.addBlock);
	const isMobile = useUIStore((s) => s.isMobile);
	const sidebarWidth = useUIStore((s) => s.sidebarWidth);
	const setMobileTab = useUIStore((s) => s.setMobileTab);

	const handleAdd = (type: string) => {
		const def = BlockRegistry.get(type);
		addBlock({
			id: uuidv4(),
			type,
			props: { ...(def?.defaultProps ?? {}) },
		});
		if (isMobile) {
			setMobileTab("editor");
		}
	};

	const width = isMobile ? undefined : (sidebarWidth ?? 220);

	return (
		<aside
			style={{
				width: width ?? "100%",
				flex: width === undefined ? 1 : undefined,
				background: "var(--bg-surface)",
				borderRight: "1px solid var(--border-subtle)",
				display: "flex",
				flexDirection: "column",
				padding: "12px 8px",
				gap: 8,
				overflowY: "auto",
			}}
		>
			<div
				style={{
					fontSize: 11,
					fontWeight: 600,
					letterSpacing: "0.08em",
					textTransform: "uppercase",
					color: "var(--text-muted)",
					padding: "4px 8px 0",
				}}
			>
				Blocks
			</div>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
					gap: 4,
				}}
			>
				{BLOCK_PALETTE.map((b) => (
					<DraggableSidebarItem key={b.type} b={b} handleAdd={handleAdd} />
				))}
			</div>
		</aside>
	);
}
