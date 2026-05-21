import { v4 as uuidv4 } from "uuid";
import type { Block } from "@next-md-editor/types";

function toAlpha(num: number): string {
  let result = "";
  let n = num - 1;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 97) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result || "a";
}

function toRoman(num: number): string {
  const lookup: [number, string][] = [
    [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"],
    [100, "c"], [90, "xc"], [50, "l"], [40, "xl"],
    [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]
  ];
  let roman = "";
  let n = num;
  for (const [val, char] of lookup) {
    while (n >= val) {
      roman += char;
      n -= val;
    }
  }
  return roman || "i";
}

function getMarker(index: number, depth: number, pattern: string): string {
  const sequence = pattern.split("-");
  const type = sequence[depth % 3] || "decimal";
  if (type === "alpha") {
    return `${toAlpha(index)}. `;
  } else if (type === "roman") {
    return `${toRoman(index)}. `;
  } else {
    return `${index}. `;
  }
}

function markdownListToHtml(lines: string[], isNumbered: boolean): string {
  let html = isNumbered ? "<ol>" : "<ul>";
  let currentDepth = 0;
  const listStack: string[] = [isNumbered ? "ol" : "ul"];

  lines.forEach((line) => {
    const spaces = line.match(/^(\s*)/)?.[1].length ?? 0;
    const depth = spaces >= 4 ? Math.floor(spaces / 4) : Math.floor(spaces / 2);
    const content = line.replace(/^\s*(?:([-*])\s+|([a-zA-Z0-9]+)\.\s+)/, "");

    while (depth > currentDepth) {
      const tag = isNumbered ? "ol" : "ul";
      html += `<${tag}>`;
      listStack.push(tag);
      currentDepth++;
    }
    while (depth < currentDepth) {
      const tag = listStack.pop();
      html += `</${tag}>`;
      currentDepth--;
    }

    html += `<li>${content}</li>`;
  });

  while (listStack.length > 0) {
    const tag = listStack.pop();
    html += `</${tag}>`;
  }

  return html;
}

function cleanHtmlText(html: string): string {
  return html
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

export function listHtmlToMarkdown(html: string, isNumbered: boolean, pattern: string = "decimal-alpha-roman"): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, "").trim(); 
  }
  
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  
  let markdown = "";
  
  function traverse(node: HTMLElement, depth: number, listType: "ul" | "ol", itemIndex: { val: number }) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        
        if (tagName === "ul" || tagName === "ol") {
          const subIndex = { val: 1 };
          traverse(el, depth + 1, tagName as "ul" | "ol", subIndex);
        } else if (tagName === "li") {
          let liText = "";
          const subIndex = { val: 1 };
          
          for (const subChild of Array.from(el.childNodes)) {
            if (subChild.nodeType === Node.TEXT_NODE) {
              liText += subChild.textContent;
            } else if (subChild.nodeType === Node.ELEMENT_NODE) {
              const subEl = subChild as HTMLElement;
              const subTagName = subEl.tagName.toLowerCase();
              if (subTagName !== "ul" && subTagName !== "ol") {
                liText += subEl.textContent;
              }
            }
          }
          
          const indent = "    ".repeat(depth);
          const marker = listType === "ol" ? getMarker(itemIndex.val, depth, pattern) : "- ";
          markdown += `${indent}${marker}${cleanHtmlText(liText).trim()}\n`;
          itemIndex.val++;
          
          for (const subChild of Array.from(el.childNodes)) {
            if (subChild.nodeType === Node.ELEMENT_NODE) {
              const subEl = subChild as HTMLElement;
              const subTagName = subEl.tagName.toLowerCase();
              if (subTagName === "ul" || subTagName === "ol") {
                traverse(subEl, depth + 1, subTagName as "ul" | "ol", subIndex);
              }
            }
          }
        }
      }
    }
  }
  
  const topList = tempDiv.querySelector("ul, ol");
  if (topList) {
    const topTagName = topList.tagName.toLowerCase() as "ul" | "ol";
    traverse(topList as HTMLElement, 0, topTagName, { val: 1 });
  } else {
    markdown = tempDiv.textContent || "";
  }
  
  return markdown.trim();
}

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
          level: Math.min(level, 6), // Support all 6 GFM header levels
          text,
        },
      });
      i++;
      continue;
    }

    // 5. GFM Callout Alerts (> [!NOTE]) — must run BEFORE generic blockquote check
    //    because both start with ">" and the blockquote handler would consume callouts first.
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

    // 6. Blockquotes (> quote)
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

    // 7. GFM Images (![alt](url))
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
          if (tLine.includes("---") && !tLine.match(/[a-zA-Z0-9]/)) {
            continue;
          }
          const cells = tLine.split("|")
            .map(c => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          parsedRows.push(cells);
        }

        // Auto-detect if this table contains ONLY images to parse it as an image-grid
        let isImageGrid = true;
        const gridImages: { id: string; url: string; alt: string }[] = [];
        let colCount = 0;

        for (const row of parsedRows) {
          if (row.length > colCount) {
            colCount = row.length;
          }
          for (const cell of row) {
            const cleanCell = cell.trim();
            if (cleanCell === "" || cleanCell === " " || cleanCell === "&nbsp;") {
              continue;
            }
            const imgMatch = cleanCell.match(/^!\[(.*?)\]\((.*?)\)$/);
            const htmlImgMatch = cleanCell.match(/<img\s+[^>]*src="([^"]+)"[^>]*>/i);
            
            if (imgMatch) {
              gridImages.push({
                id: Math.random().toString(36).substring(7),
                alt: imgMatch[1],
                url: imgMatch[2],
              });
            } else if (htmlImgMatch) {
              const src = htmlImgMatch[1];
              const altMatch = cleanCell.match(/alt="([^"]*)"/i);
              const alt = altMatch ? altMatch[1] : "";
              gridImages.push({
                id: Math.random().toString(36).substring(7),
                alt,
                url: src,
              });
            } else {
              isImageGrid = false;
              break;
            }
          }
          if (!isImageGrid) break;
        }

        if (isImageGrid && gridImages.length > 0) {
          blocks.push({
            id: uuidv4(),
            type: "image-grid",
            props: {
              cols: colCount || 2,
              images: gridImages,
            },
          });
        } else {
          blocks.push({
            id: uuidv4(),
            type: "table",
            props: {
              rows: parsedRows,
            },
          });
        }
        i = tempI;
        continue;
      }
    }

    // 8.5 Bullet or Numbered Lists
    const isBulletListLine = trimmed.startsWith("- ") || trimmed.startsWith("* ");
    const isNumberedListLine = /^[a-zA-Z0-9]+\.\s/.test(trimmed);
    if (isBulletListLine || isNumberedListLine) {
      const listLines: string[] = [];
      const listType = isBulletListLine ? "bullet" : "numbered";
      let tempI = i;
      while (tempI < lines.length) {
        const nextLine = lines[tempI];
        const nextTrimmed = nextLine.trim();
        if (nextTrimmed === "") {
          break;
        }
        const isNextBullet = nextTrimmed.startsWith("- ") || nextTrimmed.startsWith("* ") || /^\s+[-*]\s/.test(nextLine);
        const isNextNumbered = /^[a-zA-Z0-9]+\.\s/.test(nextTrimmed) || /^\s+[a-zA-Z0-9]+\.\s/.test(nextLine);
        if (isNextBullet || isNextNumbered) {
          listLines.push(nextLine);
          tempI++;
        } else {
          break;
        }
      }
      const htmlContent = markdownListToHtml(listLines, listType === "numbered");
      blocks.push({
        id: uuidv4(),
        type: listType === "bullet" ? "bullet-list" : "numbered-list",
        props: {
          style: listType,
          html: htmlContent,
        },
      });
      i = tempI;
      continue;
    }

    // 9. Default: Paragraph
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
 * Serializes a single block to markdown, with optional indent prefix for nesting.
 */
function serializeBlock(block: Block, indentLevel: number = 0): string {
  const indent = "  ".repeat(indentLevel);
  let text = "";

  switch (block.type) {
    case "heading": {
      const level = (block.props.level as number) ?? 1;
      const t = (block.props.text as string) ?? "";
      text = `${"#".repeat(level)} ${t}`;
      break;
    }
    case "paragraph": {
      text = (block.props.text as string) ?? "";
      break;
    }
    case "quote": {
      const t = (block.props.text as string) ?? "";
      text = t.split("\n").map((l) => `> ${l}`).join("\n");
      break;
    }
    case "code": {
      const lang = (block.props.language as string) ?? "";
      const code = (block.props.code as string) ?? "";
      text = `\`\`\`${lang}\n${code}\n\`\`\``;
      break;
    }
    case "divider": {
      text = "---";
      break;
    }
    case "image": {
      const alt = (block.props.alt as string) ?? "";
      const url = (block.props.url as string) ?? "";
      text = `![${alt}](${url})`;
      break;
    }
    case "callout": {
      const t = (block.props.text as string) ?? "";
      const type = ((block.props.type as string) ?? "note").toUpperCase();
      const alertHeader = `> [!${type}]`;
      const alertBody = t.split("\n").map((l) => `> ${l}`).join("\n");
      text = `${alertHeader}\n${alertBody}`;
      break;
    }
    case "table": {
      const rows = (block.props.rows as string[][]) ?? [["", ""]];
      if (rows.length === 0) { text = ""; break; }
      const headerLine = `| ${rows[0].join(" | ")} |`;
      const separatorLine = `| ${rows[0].map(() => "---").join(" | ")} |`;
      const dataLines = rows.slice(1).map((r) => `| ${r.join(" | ")} |`);
      text = [headerLine, separatorLine, ...dataLines].join("\n");
      break;
    }
    case "bullet-list": {
      const htmlContent = (block.props.html as string) ?? "";
      const pattern = (block.props.pattern as string) ?? "decimal-alpha-roman";
      text = listHtmlToMarkdown(htmlContent, false, pattern);
      break;
    }
    case "numbered-list": {
      const htmlContent = (block.props.html as string) ?? "";
      const pattern = (block.props.pattern as string) ?? "decimal-alpha-roman";
      text = listHtmlToMarkdown(htmlContent, true, pattern);
      break;
    }
    case "image-grid": {
      const images = (block.props.images as any[]) ?? [];
      const cols = (block.props.cols as number) ?? 2;
      const title = (block.props.title as string) ?? "";
      const description = (block.props.description as string) ?? "";
      if (images.length === 0) { text = ""; break; }

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

      text = parts.join("\n\n");
      break;
    }
    default:
      text = "";
  }

  const lines = text ? text.split("\n").map((l) => `${indent}${l}`).join("\n") : "";

  // Recursively serialize children at the next indent level
  const childrenText = block.children && block.children.length > 0
    ? block.children.map((child) => serializeBlock(child, indentLevel + 1)).filter(Boolean).join("\n\n")
    : "";

  return [lines, childrenText].filter(Boolean).join("\n\n");
}

/**
 * Serializes block objects back into markdown string.
 * This is our master serialization logic which uses standard formatters.
 */
export function serializeMarkdown(blocks: Block[]): string {
  return blocks
    .map((block) => serializeBlock(block, 0))
    .filter(Boolean)
    .join("\n\n");
}
