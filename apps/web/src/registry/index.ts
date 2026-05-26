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

export function initRegistry() {
  BlockRegistry.register({
    type: "heading",
    component: HeadingBlock,
    defaultProps: { content: [], level: 1 },
  });

  BlockRegistry.register({
    type: "paragraph",
    component: ParagraphBlock,
    defaultProps: { content: [] },
  });

  BlockRegistry.register({
    type: "quote",
    component: QuoteBlock,
    defaultProps: { content: [] },
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
    defaultProps: { content: [], type: "note" },
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
  });
}
