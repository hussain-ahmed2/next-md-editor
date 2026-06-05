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

export function initRegistry() {
  BlockRegistry.register({
    type: "heading",
    component: HeadingBlock,
    defaultProps: { text: "", level: 1 },
    serializer: (b) => {
      const level = (b.props.level as number) ?? 1;
      const text = (b.props.text as string) ?? "";
      return `${"#".repeat(level)} ${text}`;
    },
  });

  BlockRegistry.register({
    type: "paragraph",
    component: ParagraphBlock,
    defaultProps: { text: "" },
    serializer: (b) => (b.props.text as string) ?? "",
  });

  BlockRegistry.register({
    type: "quote",
    component: QuoteBlock,
    defaultProps: { text: "" },
    serializer: (b) => {
      const text = (b.props.text as string) ?? "";
      return text.split("\n").map((l) => `> ${l}`).join("\n");
    },
  });

  BlockRegistry.register({
    type: "code",
    component: CodeBlock,
    defaultProps: { code: "", language: "ts" },
    serializer: (b) => {
      const lang = (b.props.language as string) ?? "";
      const code = (b.props.code as string) ?? "";
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    },
  });

  BlockRegistry.register({
    type: "divider",
    component: DividerBlock,
    defaultProps: {},
    serializer: () => "---",
  });

  BlockRegistry.register({
    type: "image",
    component: ImageBlock,
    defaultProps: { url: "", alt: "" },
    serializer: (b) => {
      const url = (b.props.url as string) ?? "";
      const alt = (b.props.alt as string) ?? "";
      return `![${alt}](${url})`;
    },
  });

  BlockRegistry.register({
    type: "table",
    component: TableBlock,
    defaultProps: { rows: [["Header 1", "Header 2"], ["Cell 1.1", "Cell 1.2"]] },
    serializer: (b) => {
      const rows = (b.props.rows as string[][]) ?? [["", ""]];
      if (rows.length === 0) return "";
      
      const headerLine = `| ${rows[0].join(" | ")} |`;
      const separatorLine = `| ${rows[0].map(() => "---").join(" | ")} |`;
      const dataLines = rows.slice(1).map(r => `| ${r.join(" | ")} |`);
      
      return [headerLine, separatorLine, ...dataLines].join("\n");
    },
  });

  BlockRegistry.register({
    type: "callout",
    component: CalloutBlock,
    defaultProps: { text: "", type: "note" },
    serializer: (b) => {
      const text = (b.props.text as string) ?? "";
      const type = ((b.props.type as string) ?? "note").toUpperCase();
      const alertHeader = `> [!${type}]`;
      const alertBody = text.split("\n").map(l => `> ${l}`).join("\n");
      return `${alertHeader}\n${alertBody}`;
    },
  });

  BlockRegistry.register({
    type: "bullet-list",
    component: ListBlock,
    defaultProps: { style: "bullet", html: "<ul><li>Item 1</li></ul>" },
  });

  BlockRegistry.register({
    type: "numbered-list",
    component: ListBlock,
    defaultProps: { style: "numbered", html: "<ol><li>Item 1</li></ol>" },
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
    serializer: (b) => {
      const images = (b.props.images as any[]) ?? [];
      const cols = (b.props.cols as number) ?? 2;
      const title = (b.props.title as string) ?? "";
      const description = (b.props.description as string) ?? "";
      if (images.length === 0) return "";

      const parts: string[] = [];
      if (title.trim()) {
        parts.push(`#### ${title.trim()}`);
      }
      if (description.trim()) {
        parts.push(`_${description.trim()}_`);
      }

      const rows: string[][] = [];
      let currentRow: string[] = [];
      images.forEach((img) => {
        currentRow.push(`<img src="${img.url}" alt="${img.alt || "Image"}" height="200" width="100%" style="object-fit: cover;" />`);
        if (currentRow.length === cols) {
          rows.push(currentRow);
          currentRow = [];
        }
      });
      if (currentRow.length > 0) {
        while (currentRow.length < cols) {
          currentRow.push(" ");
        }
        rows.push(currentRow);
      }

      const headers = Array.from({ length: cols }, (_, idx) => `Image ${idx + 1}`);
      const headerLine = `| ${headers.join(" | ")} |`;
      const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
      const dataLines = rows.map((r) => `| ${r.join(" | ")} |`);

      const tableMarkdown = [headerLine, separatorLine, ...dataLines].join("\n");
      parts.push(tableMarkdown);

      return parts.join("\n\n");
    },
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
    serializer: (b) => {
      const badges = (b.props.badges as any[]) ?? [];
      if (badges.length === 0) return "";
      const lines: string[] = [];
      lines.push("<!-- badge-group -->");
      for (const badge of badges) {
        if (badge.url) {
          lines.push(`![image](${badge.url})`);
        } else {
          const color = badge.color.replace("#", "");
          const logo = badge.logo ? `&logo=${encodeURIComponent(badge.logo)}&logoColor=white` : "";
          lines.push(`![image](https://img.shields.io/badge/${encodeURIComponent(badge.text.replace(/-/g, "--"))}-${color}?style=for-the-badge${logo})`);
        }
      }
      return lines.join("\n");
    },
  });
}
