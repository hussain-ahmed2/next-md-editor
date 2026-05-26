import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import rehypeMinifyWhitespace from "rehype-minify-whitespace";
import { v4 as uuidv4 } from "uuid";
import type { Root, Heading, Paragraph, Code, ThematicBreak, List, ListItem, Table, Blockquote } from "mdast";
import type { Block, RichText } from "@next-md-editor/types";
import { markdownToRichText, richTextToMarkdown } from "./richText";

// ── Unified pipeline for HTML → Markdown (SSR-safe) ──────────────────────────

const htmlToMdProcessor = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeMinifyWhitespace)
  .use(rehypeRemark)
  .use(remarkStringify, { bullet: "-", emphasis: "*", strong: "*" });

function htmlToMarkdown(html: string): string {
  if (!html) return "";
  try {
    const file = htmlToMdProcessor.processSync(html);
    return String(file).trim();
  } catch {
    return html.replace(/<[^>]*>/g, "").trim();
  }
}

// ── Extract raw text from AST node via source position ────────────────────────

function extractRawText(node: any, markdown: string): string {
  if (node.position) {
    return markdown.slice(node.position.start.offset, node.position.end.offset);
  }
  return "";
}

// ── Parse: markdown → blocks ─────────────────────────────────────────────────

export function parseMarkdown(markdown: string): Block[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdown) as Root;

  const blocks: Block[] = [];
  for (const node of tree.children) {
    const block = nodeToBlock(node as any, markdown);
    if (block) blocks.push(block);
  }
  return blocks;
}

function nodeToBlock(node: any, markdown: string): Block | null {
  switch (node.type) {
    case "heading": {
      const text = node.children
        .map((child: any) => extractRawText(child, markdown))
        .join("")
        .trim();
      return {
        id: uuidv4(),
        type: "heading",
        props: { level: node.depth, text },
      };
    }

    case "paragraph": {
      const text = extractRawText(node, markdown).trim();
      if (!text) return null;
      return { id: uuidv4(), type: "paragraph", props: { content: markdownToRichText(text) } };
    }

    case "code":
      return {
        id: uuidv4(),
        type: "code",
        props: { code: node.value, language: node.lang || "ts" },
      };

    case "thematicBreak":
      return { id: uuidv4(), type: "divider", props: {} };

    case "blockquote": {
      const [firstP, ...rest] = node.children;
      if (firstP?.type === "paragraph") {
        const pText = extractRawText(firstP, markdown).trimStart();
        const alertMatch = pText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
        if (alertMatch) {
          const bodyParts: string[] = [];
          for (const child of rest) {
            const t = extractRawText(child, markdown).replace(/^>\s+/gm, "").trim();
            if (t) bodyParts.push(t);
          }
          if (bodyParts.length === 0) {
            const body = pText.slice(alertMatch[0].length).replace(/^>\s+/gm, "").trim();
            if (body) bodyParts.push(body);
          }
          return {
            id: uuidv4(),
            type: "callout",
            props: { type: alertMatch[1].toLowerCase(), text: bodyParts.join("\n").trim() },
          };
        }
      }
      const quoteText = node.children
        .map((c: any) => extractRawText(c, markdown))
        .join("\n")
        .trim();
      return { id: uuidv4(), type: "quote", props: { text: quoteText } };
    }

    case "list": {
      const ordered = node.ordered ?? false;
      const html = listNodeToHtml(node, markdown);
      return {
        id: uuidv4(),
        type: ordered ? "numbered-list" : "bullet-list",
        props: { style: ordered ? "numbered" : "bullet", html },
      };
    }

    case "table": {
      const parsedRows = tableNodeToRows(node, markdown);
      if (!parsedRows.length) return null;

      if (isImageGrid(parsedRows)) {
        let showCaptions = true;
        if (node.position) {
          const beforeTable = markdown.slice(Math.max(0, node.position.start.offset - 500), node.position.start.offset);
          if (beforeTable.includes("<!-- captions:hidden -->")) showCaptions = false;
        }
        return {
          id: uuidv4(),
          type: "image-grid",
          props: {
            cols: Math.max(...parsedRows.map((r: string[]) => r.length), 2),
            images: extractGridImages(parsedRows),
            showCaptions,
          },
        };
      }

      return { id: uuidv4(), type: "table", props: { rows: parsedRows } };
    }

    default:
      return null;
  }
}

// ── Inline AST → HTML ─────────────────────────────────────────────────────────

function inlineAstToHtml(children: any[]): string {
  let html = "";
  for (const node of children) {
    switch (node.type) {
      case "text":
        html += escapeHtml(node.value);
        break;
      case "strong":
        html += "<strong>" + inlineAstToHtml(node.children) + "</strong>";
        break;
      case "emphasis":
        html += "<em>" + inlineAstToHtml(node.children) + "</em>";
        break;
      case "inlineCode":
        html += "<code>" + node.value + "</code>";
        break;
      case "delete":
        html += "<del>" + inlineAstToHtml(node.children) + "</del>";
        break;
      case "link":
        html += '<a href="' + escapeHtml(node.url) + '">' + inlineAstToHtml(node.children) + "</a>";
        break;
      case "image":
        html += '<img src="' + escapeHtml(node.url) + '" alt="' + escapeHtml(node.alt ?? "") + '" />';
        break;
      case "break":
        html += "<br />";
        break;
      case "html":
        html += node.value;
        break;
      default:
        if (node.children) html += inlineAstToHtml(node.children);
        break;
    }
  }
  return html;
}

// ── List AST → HTML (SSR-safe string building) ───────────────────────────────

function listNodeToHtml(node: any, markdown: string): string {
  const ordered = node.ordered ?? false;
  const parts: string[] = [];
  const tag = ordered ? "ol" : "ul";
  parts.push(`<${tag}>`);
  for (const item of node.children) {
    parts.push("<li>");
    for (const child of item.children) {
      if (child.type === "paragraph") {
        parts.push(inlineAstToHtml(child.children));
      } else if (child.type === "list") {
        parts.push(listNodeToHtml(child, markdown));
      } else {
        const t = child.children ? inlineAstToHtml(child.children) : "";
        if (t) parts.push(t);
      }
    }
    parts.push("</li>");
  }
  parts.push(`</${tag}>`);
  return parts.join("");
}

// ── Table AST → rows ─────────────────────────────────────────────────────────

function tableNodeToRows(node: any, markdown: string): string[][] {
  const rows: string[][] = [];
  for (const row of node.children || []) {
    const cells: string[] = [];
    for (const cell of row.children || []) {
      const text = (cell.children || [])
        .map((c: any) => extractRawText(c, markdown))
        .join("")
        .trim();
      cells.push(text);
    }
    rows.push(cells);
  }
  return rows;
}

// ── Image grid detection ─────────────────────────────────────────────────────

function isImageGrid(rows: string[][]): boolean {
  let imageCount = 0;
  let nonEmptyCount = 0;
  for (const row of rows) {
    for (const cell of row) {
      const c = cell.trim();
      if (!c || c === "&nbsp;" || c === "<!-- image-grid -->" || c === "<!-- captions:hidden -->") continue;
      nonEmptyCount++;
      if (/^!\[.*?\]\(.*?\)$/.test(c) || /<img\s+[^>]*src=/i.test(c)) imageCount++;
    }
  }
  return nonEmptyCount > 0 && imageCount === nonEmptyCount;
}

function extractGridImages(rows: string[][]): { id: string; url: string; alt: string }[] {
  const images: { id: string; url: string; alt: string }[] = [];
  for (const row of rows) {
    for (const cell of row) {
      const c = cell.trim();
      if (c === "<!-- captions:hidden -->") continue;
      const md = c.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (md) {
        images.push({ id: Math.random().toString(36).substring(7), url: md[2], alt: md[1] });
        continue;
      }
      const html = c.match(/<img\s+[^>]*src="([^"]+)"[^>]*>/i);
      if (html) {
        const alt = c.match(/alt="([^"]*)"/i);
        images.push({ id: Math.random().toString(36).substring(7), url: html[1], alt: alt?.[1] ?? "" });
      }
    }
  }
  return images;
}

// ── Escape HTML ──────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Serialize: blocks → markdown ─────────────────────────────────────────────

function serializeBlock(block: Block, indentLevel: number = 0): string {
  const indent = "  ".repeat(indentLevel);
  let text = "";

  switch (block.type) {
    case "heading": {
      const level = (block.props.level as number) ?? 1;
      text = `${"#".repeat(level)} ${(block.props.text as string) ?? ""}`;
      break;
    }
    case "paragraph":
      text = richTextToMarkdown((block.props.content as RichText) ?? []);
      break;
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
    case "divider":
      text = "---";
      break;
    case "image": {
      const alt = (block.props.alt as string) ?? "";
      const url = (block.props.url as string) ?? "";
      text = `![${alt}](${url})`;
      break;
    }
    case "callout": {
      const t = (block.props.text as string) ?? "";
      const type = ((block.props.type as string) ?? "note").toUpperCase();
      text = `> [!${type}]\n${t.split("\n").map((l) => `> ${l}`).join("\n")}`;
      break;
    }
    case "table": {
      const rows = (block.props.rows as string[][]) ?? [["", ""]];
      if (!rows.length) break;
      text = [
        `| ${rows[0].join(" | ")} |`,
        `| ${rows[0].map(() => "---").join(" | ")} |`,
        ...rows.slice(1).map((r) => `| ${r.join(" | ")} |`),
      ].join("\n");
      break;
    }
    case "bullet-list":
    case "numbered-list": {
      const html = (block.props.html as string) ?? "";
      text = htmlToMarkdown(html);
      break;
    }
    case "image-grid": {
      const images = (block.props.images as any[]) ?? [];
      const cols = (block.props.cols as number) ?? 2;
      if (!images.length) break;
      const showCaptions = (block.props.showCaptions as boolean) ?? true;

      const parts: string[] = [];
      const title = (block.props.title as string) ?? "";
      const description = (block.props.description as string) ?? "";

      parts.push("<!-- image-grid -->");
      if (!showCaptions) parts.push("<!-- captions:hidden -->");
      if (title.trim()) parts.push(`#### ${title.trim()}`);
      if (description.trim()) parts.push(`_${description.trim()}_`);

      const emptyHeaders = Array.from({ length: cols }, () => "&nbsp;");
      const separator = Array.from({ length: cols }, () => "---");

      const imageRows: string[][] = [];
      let cur: string[] = [];
      for (const img of images) {
        cur.push(`![${img.alt || "Image"}](${img.url})`);
        if (cur.length === cols) { imageRows.push(cur); cur = []; }
      }
      if (cur.length) {
        while (cur.length < cols) cur.push("");
        imageRows.push(cur);
      }

      parts.push([
        `| ${emptyHeaders.join(" | ")} |`,
        `| ${separator.join(" | ")} |`,
        ...imageRows.map((r) => `| ${r.join(" | ")} |`),
      ].join("\n"));
      text = parts.join("\n\n");
      break;
    }
  }

  const serializedLines = text
    ? text.split("\n").map((l) => `${indent}${l}`).join("\n")
    : "";
  const childrenText = block.children?.length
    ? block.children.map((child) => serializeBlock(child, indentLevel + 1)).filter(Boolean).join("\n\n")
    : "";

  return [serializedLines, childrenText].filter(Boolean).join("\n\n");
}

export function serializeMarkdown(blocks: Block[]): string {
  return blocks.map((b) => serializeBlock(b, 0)).filter(Boolean).join("\n\n");
}

export function hasImageGridMarker(markdown: string): boolean {
  return markdown.includes("<!-- image-grid -->");
}

export * from "./richText";
