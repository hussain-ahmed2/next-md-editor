import { v4 as uuidv4 } from "uuid";
import type { Block } from "@next-md-editor/types";

/**
 * Parses markdown string into an array of Block objects.
 */
export function parseMarkdown(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split(/\r?\n/);
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip completely empty lines
    if (trimmed === "") {
      i++;
      continue;
    }

    // 2. Code Blocks (```ts ... ```)
    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      
      blocks.push({
        id: uuidv4(),
        type: "code",
        props: {
          code: codeLines.join("\n"),
          language: language || "ts",
        },
      });
      i++; // Skip closing ```
      continue;
    }

    // 3. Dividers (---, ***, ___)
    if (/^(---|===|\*\*\*|___)$/.test(trimmed)) {
      blocks.push({
        id: uuidv4(),
        type: "divider",
        props: {},
      });
      i++;
      continue;
    }

    // 4. Headings (# heading)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      blocks.push({
        id: uuidv4(),
        type: "heading",
        props: {
          level: Math.min(level, 3), // next-md-editor supports up to H3
          text,
        },
      });
      i++;
      continue;
    }

    // 5. Blockquotes (> quote)
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        const content = lines[i].trim().slice(1);
        quoteLines.push(content.startsWith(" ") ? content.slice(1) : content);
        i++;
      }
      
      blocks.push({
        id: uuidv4(),
        type: "quote",
        props: {
          text: quoteLines.join("\n"),
        },
      });
      continue;
    }

    // 6. Default: Paragraph
    // We group consecutive non-empty lines as a single paragraph block or keep them separate.
    // In our block editor, separate paragraphs make block reordering much more intuitive.
    blocks.push({
      id: uuidv4(),
      type: "paragraph",
      props: {
        text: trimmed,
      },
    });
    i++;
  }

  return blocks;
}

/**
 * Serializes block objects back into markdown string.
 * This is our master serialization logic which uses standard formatters.
 */
export function serializeMarkdown(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading": {
          const level = (block.props.level as number) ?? 1;
          const text = (block.props.text as string) ?? "";
          return `${"#".repeat(level)} ${text}`;
        }
        case "paragraph": {
          return (block.props.text as string) ?? "";
        }
        case "quote": {
          const text = (block.props.text as string) ?? "";
          return text.split("\n").map((l) => `> ${l}`).join("\n");
        }
        case "code": {
          const lang = (block.props.language as string) ?? "";
          const code = (block.props.code as string) ?? "";
          return `\`\`\`${lang}\n${code}\n\`\`\``;
        }
        case "divider": {
          return "---";
        }
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}
