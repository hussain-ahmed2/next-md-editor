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

function isBadgeUrl(url: string | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("shields.io") ||
    lower.includes("badge") ||
    lower.includes("badges") ||
    lower.includes("licence") ||
    lower.includes("license")
  );
}

export function parseMarkdown(markdown: string): Block[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdown) as Root;

  const blocks: Block[] = [];
  let skipCount = 0;

  for (let i = 0; i < tree.children.length; i++) {
    if (skipCount > 0) { skipCount--; continue; }

    const node = tree.children[i];

    // Detect new-style raw HTML image grid: <!-- image-grid --> followed by <table> with <img>
    if (node.type === "html") {
      const val = ((node as any).value ?? "").trim();
      if (val === "<!-- image-grid -->") {
        let showCaptions = true;
        const images: { id: string; url: string; alt: string }[] = [];
        let consumed = 0;

        for (let j = i + 1; j < tree.children.length; j++) {
          const next = tree.children[j];
          if (next.type !== "html") break;
          const html = ((next as any).value ?? "").trim();

          if (html === "<!-- captions:hidden -->") {
            showCaptions = false;
            consumed++;
            continue;
          }

          const imgRegex = /<img\s+[^>]*src="([^"]+)"[^>]*\/?>/gi;
          let match: RegExpExecArray | null;
          let foundImg = false;
          while ((match = imgRegex.exec(html)) !== null) {
            foundImg = true;
            const tag = match[0];
            const altMatch = tag.match(/alt="([^"]*)"/i);
            images.push({
              id: Math.random().toString(36).substring(7),
              url: match[1],
              alt: altMatch?.[1] ?? "",
            });
          }
          if (foundImg) {
            consumed++;
          } else {
            break;
          }
        }

        if (images.length > 0) {
          // Determine cols from <td> count in first <tr> of the <table> HTML
          let cols = Math.min(images.length, 3);
          for (let j = i + 1; j < Math.min(i + consumed + 2, tree.children.length); j++) {
            const html = ((tree.children[j] as any)?.value ?? "").trim();
            const trMatch = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
            if (trMatch) {
              const tdCount = (trMatch[1].match(/<td/gi) || []).length;
              if (tdCount > 0) { cols = tdCount; break; }
            }
          }
          blocks.push({
            id: uuidv4(),
            type: "image-grid",
            props: {
              cols,
              images,
              showCaptions,
            },
          });
          skipCount = consumed;
          continue;
        }
      }

      // Detect badge-group: <!-- badge-group --> followed by ![image](url) markdown
      if (val === "<!-- badge-group -->") {
        const badges: any[] = [];
        let consumed = 0;

        for (let j = i + 1; j < tree.children.length; j++) {
          const next = tree.children[j];
          if (next.type !== "paragraph") break;

          const images = (next as any).children?.filter(
            (c: any) => c.type === "image" && typeof c.url === "string" && isBadgeUrl(c.url),
          ) ?? [];
          if (images.length === 0) break;

          for (const img of images) {
            const badgeUrl = img.url;
            const badgeUrlPart = badgeUrl.replace("https://img.shields.io/badge/", "");
            const [labelColorPart, queryString = ""] = badgeUrlPart.split("?");
            const parts = labelColorPart.split("-");
            const color = parts.pop() ?? "000000";
            const text = decodeURIComponent(parts.join("-").replace(/--/g, " "));

            const logoMatch = queryString.match(/logo=([^&]+)/i);
            const logo = logoMatch ? decodeURIComponent(logoMatch[1]) : "";

            badges.push({
              id: Math.random().toString(36).substring(7),
              text,
              color,
              logo,
              url: badgeUrl,
            });
          }
          consumed++;
        }

        if (badges.length > 0) {
          blocks.push({
            id: uuidv4(),
            type: "badge-group",
            props: {
              badges,
              alignment: "left",
            },
          });
          skipCount = consumed;
          continue;
        }
      }
    }

    // ── Paragraph that is entirely image(s) → single image, badge-group, or image-grid ──────
    // Remark inserts text("\n") / break nodes between images on consecutive lines.
    // Strip those out before checking — only non-whitespace children need to be images.
    if (node.type === "paragraph" && Array.isArray(node.children)) {
      const significantChildren = (node.children as any[]).filter(
        (c: any) =>
          !(c.type === "text" && c.value.trim() === "") && c.type !== "break",
      );
      if (
        significantChildren.length > 0 &&
        significantChildren.every((c: any) => c.type === "image")
      ) {
        if (significantChildren.length === 1) {
          const img = significantChildren[0];
          blocks.push({
            id: uuidv4(),
            type: "image",
            props: { url: img.url || "", alt: img.alt || "" },
          });
        } else {
          // Check if all are badges
          const allBadges = significantChildren.every(
            (c: any) => typeof c.url === "string" && isBadgeUrl(c.url),
          );
          if (allBadges) {
            const badges = significantChildren.map((img: any) => {
              const badgeUrl = img.url;
              const badgeUrlPart = badgeUrl.replace("https://img.shields.io/badge/", "");
              const [labelColorPart, queryString = ""] = badgeUrlPart.split("?");
              const parts = labelColorPart.split("-");
              const color = parts.pop() ?? "000000";
              const text = decodeURIComponent(parts.join("-").replace(/--/g, " "));
              const logoMatch = queryString.match(/logo=([^&]+)/i);
              const logo = logoMatch ? decodeURIComponent(logoMatch[1]) : "";
              return {
                id: Math.random().toString(36).substring(7),
                text,
                color,
                logo,
                url: badgeUrl,
              };
            });
            blocks.push({
              id: uuidv4(),
              type: "badge-group",
              props: {
                badges,
                alignment: "left",
              },
            });
          } else {
            // Otherwise, make it an image-grid
            const images = significantChildren.map((img: any) => ({
              id: Math.random().toString(36).substring(7),
              url: img.url || "",
              alt: img.alt || "",
            }));
            blocks.push({
              id: uuidv4(),
              type: "image-grid",
              props: {
                cols: images.length,
                images,
                showCaptions: true,
              },
            });
          }
        }
        continue;
      }
    }

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
            cols: Math.max(1, ...parsedRows.map((r: string[]) => r.length)),
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
      parts.push("<!-- image-grid -->");
      if (!showCaptions) parts.push("<!-- captions:hidden -->");

      const imageRows: string[][] = [];
      let cur: string[] = [];
      for (const img of images) {
        cur.push(`<img src="${img.url}" alt="${img.alt || "Image"}" />`);
        if (cur.length === cols) { imageRows.push(cur); cur = []; }
      }
      if (cur.length) {
        while (cur.length < cols) cur.push("");
        imageRows.push(cur);
      }

      const rows = imageRows
        .map((r) => `<tr>${r.map((cell) => (cell ? `<td>${cell}</td>` : "<td></td>")).join("")}</tr>`)
        .join("\n");
      parts.push(`<table>\n${rows}\n</table>`);
      text = parts.join("\n\n");
      break;
    }
    case "badge-group": {
      const badges = (block.props.badges as any[]) ?? [];
      if (!badges.length) break;
      const parts: string[] = [];
      parts.push("<!-- badge-group -->");
      const badgeLines = badges
        .map(
          (badge) => {
            if (badge.url) {
              return `![image](${badge.url})`;
            }
            const color = badge.color.replace("#", "");
            const logo = badge.logo ? `&logo=${encodeURIComponent(badge.logo)}&logoColor=white` : "";
            return `![image](https://img.shields.io/badge/${encodeURIComponent(badge.text.replace(/-/g, "--"))}-${color}?style=for-the-badge${logo})`;
          },
        )
        .join("\n");
      parts.push(badgeLines);
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
