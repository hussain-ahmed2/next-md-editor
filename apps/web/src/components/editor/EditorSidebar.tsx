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
	ImageIcon,
	GitFork,
	ChevronDown,
	Sparkles,
	Users,
	LayoutTemplate,
	Tags,
	PanelTop,
	ListTodo,
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
		icon: <Heading size={14} />,
		description: "Section title",
	},
	{
		type: "paragraph",
		label: "Paragraph",
		icon: <Text size={14} />,
		description: "Body text",
	},
	{
		type: "quote",
		label: "Quote",
		icon: <Quote size={14} />,
		description: "Blockquote",
	},
	{
		type: "code",
		label: "Code",
		icon: <Code2 size={14} />,
		description: "Code block",
	},
	{
		type: "divider",
		label: "Divider",
		icon: <Minus size={14} />,
		description: "Horizontal rule",
	},
	{
		type: "image",
		label: "Image",
		icon: <ImageIcon size={14} />,
		description: "Insert an image",
	},
	{
		type: "image-grid",
		label: "Image Grid",
		icon: <LayoutGrid size={14} />,
		description: "Responsive grid table of images",
	},
	{
		type: "table",
		label: "Table",
		icon: <Table size={14} />,
		description: "Visual GFM grid table",
	},
	{
		type: "callout",
		label: "Callout",
		icon: <Lightbulb size={14} />,
		description: "Pastel alert callout box",
	},
	{
		type: "bullet-list",
		label: "Bullet List",
		icon: <List size={14} />,
		description: "Rich text bullet list block",
	},
	{
		type: "numbered-list",
		label: "Numbered List",
		icon: <ListOrdered size={14} />,
		description: "Rich text numbered list block",
	},
	{
		type: "badge-group",
		label: "Badge Group",
		icon: <Tags size={14} />,
		description: "Group of technology or status badges",
	},
	{
		type: "tech-stack",
		label: "Smart Tech Stack",
		icon: <LayoutTemplate size={14} />,
		description: "Quickly build a tech stack with auto-badges",
	},
	{
		type: "hero",
		label: "Hero Header",
		icon: <PanelTop size={14} />,
		description: "Big title, description, and action buttons",
	},
	{
		type: "roadmap",
		label: "Project Roadmap",
		icon: <ListTodo size={14} />,
		description: "Track progress with interactive task lists",
	},
	{
		type: "contributors",
		label: "Contributors",
		icon: <Users size={14} />,
		description: "Showcase open-source contributors",
	},
	{
		type: "github-stats",
		label: "GitHub Stats",
		icon: <GitFork size={14} />,
		description: "GitHub profile stats card",
	},
	{
		type: "ai-content",
		label: "AI Content",
		icon: <Sparkles size={14} />,
		description: "AI-generated content from prompts",
	},
	{
		type: "collapsible",
		label: "Collapsible",
		icon: <ChevronDown size={14} />,
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
				padding: "6px 4px",
				borderRadius: "var(--radius-sm)",
				border: "1px solid transparent",
				background: "transparent",
				color: "var(--text-secondary)",
				cursor: isDragging ? "grabbing" : "grab",
				fontSize: 10,
				fontWeight: 600,
				transition: "background 0.12s ease, color 0.12s ease, border-color 0.12s ease",
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
					width: 24,
					height: 24,
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
				overflow: "hidden",
			}}
		>
			<div className="ws-toolwindow-header">
				<span>Blocks</span>
			</div>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
					gap: 2,
					padding: 8,
					overflowY: "auto",
					flex: 1,
					alignContent: "start",
				}}
			>
				{BLOCK_PALETTE.map((b) => (
					<DraggableSidebarItem key={b.type} b={b} handleAdd={handleAdd} />
				))}
			</div>
		</aside>
	);
}
