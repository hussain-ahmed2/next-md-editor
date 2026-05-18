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

    // 6. GFM Images (![alt](url))
    const imageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imageMatch) {
      blocks.push({
        id: uuidv4(),
        type: "image",
        props: {
          alt: imageMatch[1],
          url: imageMatch[2],
        },
      });
      i++;
      continue;
    }

    // 7. GFM Callout Alerts (> [!NOTE])
    const calloutHeaderMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]$/i);
    if (calloutHeaderMatch) {
      const type = calloutHeaderMatch[1].toLowerCase();
      const bodyLines: string[] = [];
      i++; // Skip the header line
      
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        const rawBodyLine = lines[i].trim().slice(1);
        bodyLines.push(rawBodyLine.startsWith(" ") ? rawBodyLine.slice(1) : rawBodyLine);
        i++;
      }
      
      blocks.push({
        id: uuidv4(),
        type: "callout",
        props: {
          type,
          text: bodyLines.join("\n"),
        },
      });
      continue;
    }

    // 8. GFM Table
    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      let tempI = i;
      while (tempI < lines.length && lines[tempI].trim().startsWith("|")) {
        tableLines.push(lines[tempI].trim());
        tempI++;
      }
      
      if (tableLines.length >= 2 && tableLines[1].includes("---")) {
        const parsedRows: string[][] = [];
        for (const tLine of tableLines) {
          // Skip the GFM separator line (e.g. | --- | --- |)
          if (tLine.includes("---") && !tLine.match(/[a-zA-Z0-9]/)) {
            continue;
          }
          
          const cells = tLine.split("|")
            .map(c => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          
          parsedRows.push(cells);
        }
        
        blocks.push({
          id: uuidv4(),
          type: "table",
          props: {
            rows: parsedRows,
          },
        });
        i = tempI;
        continue;
      }
    }

    // 9. Default: Paragraph
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
        case "image": {
          const alt = (block.props.alt as string) ?? "";
          const url = (block.props.url as string) ?? "";
          return `![${alt}](${url})`;
        }
        case "callout": {
          const text = (block.props.text as string) ?? "";
          const type = ((block.props.type as string) ?? "note").toUpperCase();
          const alertHeader = `> [!${type}]`;
          const alertBody = text.split("\n").map(l => `> ${l}`).join("\n");
          return `${alertHeader}\n${alertBody}`;
        }
        case "table": {
          const rows = (block.props.rows as string[][]) ?? [["", ""]];
          if (rows.length === 0) return "";
          
          const headerLine = `| ${rows[0].join(" | ")} |`;
          const separatorLine = `| ${rows[0].map(() => "---").join(" | ")} |`;
          const dataLines = rows.slice(1).map(r => `| ${r.join(" | ")} |`);
          
          return [headerLine, separatorLine, ...dataLines].join("\n");
        }
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}
