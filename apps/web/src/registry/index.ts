import { BlockRegistry } from "@next-md-editor/editor-core";
import { HeadingBlock } from "@/components/blocks/HeadingBlock";
import { ParagraphBlock } from "@/components/blocks/ParagraphBlock";
import { QuoteBlock } from "@/components/blocks/QuoteBlock";
import { CodeBlock } from "@/components/blocks/CodeBlock";
import { DividerBlock } from "@/components/blocks/DividerBlock";
import { ImageBlock } from "@/components/blocks/ImageBlock";

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
}
