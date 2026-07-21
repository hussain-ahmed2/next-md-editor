import { BlockRegistry } from "@next-md-editor/editor-core";
import { HeadingBlock } from "@/components/blocks/HeadingBlock";
import { ParagraphBlock } from "@/components/blocks/ParagraphBlock";
import { QuoteBlock } from "@/components/blocks/QuoteBlock";
import { CodeBlock } from "@/components/blocks/CodeBlock";
import { DividerBlock } from "@/components/blocks/DividerBlock";
import { ImageBlock } from "@/components/blocks/ImageBlock";
import { TableBlock } from "@/components/blocks/TableBlock";
import { CalloutBlock } from "@/components/blocks/CalloutBlock";
import { ListBlock } from "@/components/blocks/ListBlock";
import { ImageGridBlock } from "@/components/blocks/ImageGridBlock";
import { BadgeGroupBlock } from "@/components/blocks/BadgeGroupBlock";
import { GithubStatsBlock } from "@/components/blocks/GithubStatsBlock";
import { CollapsibleBlock } from "@/components/blocks/CollapsibleBlock";
import { AiContentBlock } from "@/components/blocks/AiContentBlock";
import { ContributorsBlock } from "@/components/blocks/ContributorsBlock";
import { TechStackBlock } from "@/components/blocks/TechStackBlock";
import { HeroBlock } from "@/components/blocks/HeroBlock";
import { RoadmapBlock } from "@/components/blocks/RoadmapBlock";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { RichText } from "@next-md-editor/types";

export function initRegistry() {
  BlockRegistry.register({
    type: "heading",
    component: HeadingBlock,
    defaultProps: { text: "", level: 1 },
  });

  BlockRegistry.register({
    type: "paragraph",
    component: ParagraphBlock,
    defaultProps: { text: "" },
  });

  BlockRegistry.register({
    type: "quote",
    component: QuoteBlock,
    defaultProps: { text: "" },
  });

  BlockRegistry.register({
    type: "code",
    component: CodeBlock,
    defaultProps: { code: "", language: "ts" },
  });

  BlockRegistry.register({
    type: "divider",
    component: DividerBlock,
    defaultProps: {},
  });

  BlockRegistry.register({
    type: "image",
    component: ImageBlock,
    defaultProps: { url: "", alt: "" },
  });

  BlockRegistry.register({
    type: "table",
    component: TableBlock,
    defaultProps: { rows: [["Header 1", "Header 2"], ["Cell 1.1", "Cell 1.2"]] },
  });

  BlockRegistry.register({
    type: "callout",
    component: CalloutBlock,
    defaultProps: { text: "", type: "note" },
  });

  BlockRegistry.register({
    type: "bullet-list",
    component: ListBlock,
    defaultProps: { style: "bullet", html: "" },
  });

  BlockRegistry.register({
    type: "numbered-list",
    component: ListBlock,
    defaultProps: { style: "numbered", html: "" },
  });

  BlockRegistry.register({
    type: "image-grid",
    component: ImageGridBlock,
    defaultProps: {
      cols: 2,
      images: [
        { id: "1", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop", alt: "Fluid abstract shapes" },
        { id: "2", url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop", alt: "Glossy 3D composition" }
      ]
    },
  });

  BlockRegistry.register({
    type: "contributors",
    component: ContributorsBlock,
    defaultProps: {
      usernames: ["torvalds", "gaearon", "yyx990803"],
      avatarSize: 48,
    },
  });

  BlockRegistry.register({
    type: "tech-stack",
    component: TechStackBlock,
    defaultProps: {
      techs: [
        { id: "react", name: "React", color: "20232A", logo: "react" },
        { id: "typescript", name: "TypeScript", color: "3178C6", logo: "typescript" },
        { id: "tailwindcss", name: "Tailwind CSS", color: "06B6D4", logo: "tailwindcss" }
      ],
      alignment: "left",
    },
  });

  BlockRegistry.register({
    type: "hero",
    component: HeroBlock,
    defaultProps: {
      logoUrl: "",
      title: "Project Title",
      description: "An awesome open-source project.",
      primaryBtnText: "Get Started",
      primaryBtnUrl: "#",
      secondaryBtnText: "Documentation",
      secondaryBtnUrl: "#",
    },
  });

  BlockRegistry.register({
    type: "roadmap",
    component: RoadmapBlock,
    defaultProps: {
      items: [
        { id: "1", text: "Planning & Design", completed: true },
        { id: "2", text: "Core functionality", completed: false },
        { id: "3", text: "Launch!", completed: false },
      ],
    },
  });

  BlockRegistry.register({
    type: "github-stats",
    component: GithubStatsBlock,
    defaultProps: { username: "", card: "stats", theme: "default" },
  });

  BlockRegistry.register({
    type: "badge-group",
    component: BadgeGroupBlock,
    defaultProps: {
      badges: [
        { id: "1", text: "Python", color: "3776AB", logo: "python" },
        { id: "2", text: "React", color: "61DAFB", logo: "react" },
        { id: "3", text: "TypeScript", color: "3178C6", logo: "typescript" },
        { id: "4", text: "Flutter", color: "02569B", logo: "flutter" },
        { id: "5", text: "Node.js", color: "339933", logo: "nodedotjs" },
      ],
      alignment: "left",
    },
  });

  BlockRegistry.register({
    type: "collapsible",
    component: CollapsibleBlock,
    defaultProps: { summary: "Click to expand", content: "", open: false },
  });

  BlockRegistry.register({
    type: "ai-content",
    component: AiContentBlock,
    defaultProps: { prompt: "", generated: "" },
    serializer: (b) => (b.props.generated as string) ?? "",
  });
}
