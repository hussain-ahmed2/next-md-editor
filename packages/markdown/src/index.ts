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
  .use(remarkGfm)
  .use(remarkStringify, { bullet: "-", emphasis: "*", strong: "*" });

export function htmlToMarkdown(html: string): string {
  if (!html) return "";
  try {
    const file = htmlToMdProcessor.processSync(html);
    return String(file).trim();
  } catch {
    return html.replace(/<[^>]*>/g, "").trim();
  }
}

interface UnistNode {
  type: string;
  value?: string;
  url?: string;
  alt?: string | null;
  title?: string;
  ordered?: boolean;
  depth?: number;
  lang?: string;
  position?: {
    start: { offset: number };
    end: { offset: number };
  };
  children?: UnistNode[];
}

// ── Extract raw text from AST node via source position ────────────────────────

function extractRawText(node: UnistNode, markdown: string): string {
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
      const val = ((node as unknown as UnistNode).value ?? "").trim();
      if (val === "<!-- image-grid -->") {
        const images: { id: string; url: string; alt: string }[] = [];
        let consumed = 0;

        for (let j = i + 1; j < tree.children.length; j++) {
          const next = tree.children[j];
          if (next.type !== "html") break;
          const html = ((next as unknown as UnistNode).value ?? "").trim();

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
            const html = ((tree.children[j] as unknown as UnistNode)?.value ?? "").trim();
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
            },
          });
          skipCount = consumed;
          continue;
        }
      }

      // Detect github-stats: <!-- github-stats:username -->
      const statsMatch = val.match(/^<!--\s*github-stats:\s*([a-zA-Z0-9-]+)\s*-->$/);
      if (statsMatch) {
        blocks.push({
          id: uuidv4(),
          type: "github-stats",
          props: { username: statsMatch[1] },
        });
        continue;
      }

      // Detect collapsible: <details> HTML block
      const detailsMatch = val.match(/^<details\s*(open)?>([\s\S]*)<\/details>$/i);
      if (detailsMatch) {
        const inner = detailsMatch[2].trim();
        const summaryMatch = inner.match(/<summary>([\s\S]*)<\/summary>/i);
        const summary = summaryMatch ? summaryMatch[1].trim() : "Details";
        const content = summaryMatch
          ? inner.replace(/<summary>[\s\S]*<\/summary>/i, "").trim()
          : inner;
        blocks.push({
          id: uuidv4(),
          type: "collapsible",
          props: {
            summary,
            content,
            open: detailsMatch[1]?.trim() === "open",
          },
        });
        continue;
      }

      // Detect badge-group: <!-- badge-group --> followed by ![image](url) markdown
      if (val === "<!-- badge-group -->") {
        const badges: Array<{ id: string; text: string; color: string; logo?: string; url?: string }> = [];
        let consumed = 0;
        let alignment = "left";

        // Check for HTML format with alignment: <div style="text-align:center"> with <img> tags
        const nextHtml = i + 1 < tree.children.length ? tree.children[i + 1] : null;
        if (nextHtml?.type === "html") {
          const htmlVal = ((nextHtml as unknown as UnistNode).value ?? "").trim();
          const alignMatch = htmlVal.match(/text-align:\s*(center|right)/i);
          if (alignMatch) {
            alignment = alignMatch[1].toLowerCase();
            const imgRegex = /<img\s+[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/gi;
            let match;
            while ((match = imgRegex.exec(htmlVal)) !== null) {
              const url = match[1];
              const text = match[2];
              let color = "000000";
              let logo = "";
              const badgeUrlPart = url.replace("https://img.shields.io/badge/", "");
              if (badgeUrlPart !== url) {
                const [labelColorPart, queryString = ""] = badgeUrlPart.split("?");
                const parts = labelColorPart.split("-");
                color = parts.pop() ?? "000000";
                const logoMatch = queryString.match(/logo=([^&]+)/i);
                logo = logoMatch ? decodeURIComponent(logoMatch[1]) : "";
              }
              badges.push({
                id: Math.random().toString(36).substring(7),
                text,
                color,
                logo,
                url,
              });
            }
            if (badges.length > 0) consumed = 1;
          }
        }

        // Fall back to old paragraph-based parsing
        if (badges.length === 0) {
          for (let j = i + 1; j < tree.children.length; j++) {
            const next = tree.children[j];
            if (next.type !== "paragraph") break;

            const images = (next as unknown as UnistNode).children?.filter(
              (c: UnistNode) => c.type === "image" && typeof c.url === "string" && isBadgeUrl(c.url),
            ) ?? [];
            if (images.length === 0) break;

            for (const img of images) {
              const badgeUrl = img.url ?? "";
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
        }

        if (badges.length > 0) {
          blocks.push({
            id: uuidv4(),
            type: "badge-group",
            props: {
              badges,
              alignment,
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
      const significantChildren = (node.children as unknown as UnistNode[]).filter(
        (c: UnistNode) =>
          !(c.type === "text" && (c.value ?? "").trim() === "") && c.type !== "break",
      );
      if (
        significantChildren.length > 0 &&
        significantChildren.every((c: UnistNode) => c.type === "image")
      ) {
        if (significantChildren.length === 1) {
          const img = significantChildren[0];
          const imgUrl = img.url || "";
          const statsMatch = imgUrl.match(/\/api\/github\/([a-zA-Z0-9-]+)\/stats\.svg(\?.*)?$/);
          if (statsMatch) {
            const qs = new URLSearchParams(statsMatch[2] ?? "");
            blocks.push({
              id: uuidv4(),
              type: "github-stats",
              props: {
                username: statsMatch[1],
                variant: qs.get("variant") || "default",
                theme: qs.get("theme") || "auto",
              },
            });
          } else {
            blocks.push({
              id: uuidv4(),
              type: "image",
              props: { url: imgUrl, alt: img.alt || "" },
            });
          }
        } else {
          // Check if all are badges
          const allBadges = significantChildren.every(
            (c: UnistNode) => typeof c.url === "string" && isBadgeUrl(c.url),
          );
          if (allBadges) {
            const badges = significantChildren.map((img: UnistNode) => {
              const badgeUrl = img.url ?? "";
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
            const images = significantChildren.map((img: UnistNode) => ({
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
              },
            });
          }
        }
        continue;
      }
    }

    const block = nodeToBlock(node as unknown as UnistNode, markdown);
    if (block) blocks.push(block);
  }
  return blocks;
}

function nodeToBlock(node: UnistNode, markdown: string): Block | null {
  switch (node.type) {
    case "heading": {
      const text = (node.children ?? [])
        .map((child: UnistNode) => extractRawText(child, markdown))
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
      const [firstP, ...rest] = node.children ?? [];
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
      const quoteText = (node.children ?? [])
        .map((c: UnistNode) => extractRawText(c, markdown))
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
        return {
          id: uuidv4(),
          type: "image-grid",
          props: {
            cols: Math.max(1, ...parsedRows.map((r: string[]) => r.length)),
            images: extractGridImages(parsedRows),
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

function inlineAstToHtml(children: UnistNode[]): string {
  let html = "";
  for (const node of children) {
    switch (node.type) {
      case "text":
        html += escapeHtml(node.value ?? "");
        break;
      case "strong":
        html += "<strong>" + inlineAstToHtml(node.children ?? []) + "</strong>";
        break;
      case "emphasis":
        html += "<em>" + inlineAstToHtml(node.children ?? []) + "</em>";
        break;
      case "inlineCode":
        html += "<code>" + (node.value ?? "") + "</code>";
        break;
      case "delete":
        html += "<del>" + inlineAstToHtml(node.children ?? []) + "</del>";
        break;
      case "link":
        html += '<a href="' + escapeHtml(node.url ?? "") + '">' + inlineAstToHtml(node.children ?? []) + "</a>";
        break;
      case "image":
        html += '<img src="' + escapeHtml(node.url ?? "") + '" alt="' + escapeHtml(node.alt ?? "") + '" />';
        break;
      case "break":
        html += "<br />";
        break;
      case "html":
        html += node.value ?? "";
        break;
      default:
        if (node.children) html += inlineAstToHtml(node.children);
        break;
    }
  }
  return html;
}

// ── List AST → HTML (SSR-safe string building) ───────────────────────────────

function listNodeToHtml(node: UnistNode, markdown: string): string {
  const ordered = node.ordered ?? false;
  const parts: string[] = [];
  const tag = ordered ? "ol" : "ul";
  parts.push(`<${tag}>`);
  for (const item of node.children ?? []) {
    parts.push("<li>");
    for (const child of item.children ?? []) {
      if (child.type === "paragraph") {
        parts.push(inlineAstToHtml(child.children ?? []));
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

function tableNodeToRows(node: UnistNode, markdown: string): string[][] {
  const rows: string[][] = [];
  for (const row of node.children || []) {
    const cells: string[] = [];
    for (const cell of row.children || []) {
      const text = (cell.children || [])
        .map((c: UnistNode) => extractRawText(c, markdown))
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
      if (!c || c === "&nbsp;" || c === "<!-- image-grid -->") continue;
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

function serializeListItem(
  item: Record<string, unknown>,
  prefix: string,
  indent: number = 0,
): string {
  const content = item.content as RichText | undefined;
  const children = item.children as Array<Record<string, unknown>> | undefined;
  const inlineMd = content ? richTextToMarkdown(content) : "";
  const pad = "  ".repeat(indent);
  let result = pad + prefix + " " + inlineMd;
  if (children && children.length > 0) {
    result +=
      "\n" +
      children
        .map((child) => serializeListItem(child, prefix, indent + 1))
        .join("\n");
  }
  return result;
}

export type SerializerLookup = (type: string) => ((block: Block) => string) | undefined;

function serializeBlock(
  block: Block,
  indentLevel: number = 0,
  lookupSerializer?: SerializerLookup,
): string {
  const indent = "  ".repeat(indentLevel);
  let text = "";

  const customSerializer = lookupSerializer?.(block.type);
  if (customSerializer) {
    text = customSerializer(block);
  } else {
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
        const items = block.props.items as Array<Record<string, unknown>> | undefined;
        if (items && items.length > 0) {
          const ordered = block.type === "numbered-list";
          text = items
            .map((item) => serializeListItem(item, ordered ? "1." : "-"))
            .join("\n");
        } else {
          const html = (block.props.html as string) ?? "";
          text = htmlToMarkdown(html);
        }
        break;
      }
      case "image-grid": {
        const images = (block.props.images as Array<{ id: string; url: string; alt?: string }>) ?? [];
        const cols = (block.props.cols as number) ?? 2;
        if (!images.length) break;

        const parts: string[] = [];
        parts.push("<!-- image-grid -->");

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
      case "github-stats": {
        const username = (block.props.username as string) ?? "";
        const variant = (block.props.variant as string) ?? "default";
        const theme = (block.props.theme as string) ?? "auto";
        if (username) {
          const base = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "";
          const params = new URLSearchParams();
          if (variant !== "default") params.set("variant", variant);
          if (theme !== "auto") params.set("theme", theme);
          const qs = params.toString() ? `?${params.toString()}` : "";
          text = `![GitHub Stats](${base}/api/github/${username}/stats.svg${qs})`;
        }
        break;
      }
      case "badge-group": {
        const badges = (block.props.badges as Array<{ text: string; color: string; logo?: string; url?: string }>) ?? [];
        const alignment = (block.props.alignment as string) ?? "left";
        if (!badges.length) break;
        const parts: string[] = [];
        parts.push("<!-- badge-group -->");

        const badgeImgs = badges.map((badge: { text: string; color: string; logo?: string; url?: string }) => {
          if (badge.url) return `![image](${badge.url})`;
          const color = badge.color.replace("#", "");
          const logo = badge.logo ? `&logo=${encodeURIComponent(badge.logo)}&logoColor=white` : "";
          return `![image](https://img.shields.io/badge/${encodeURIComponent(badge.text.replace(/-/g, "--"))}-${color}?style=for-the-badge${logo})`;
        });

        if (alignment === "left") {
          parts.push(badgeImgs.join("\n"));
        } else {
          const htmlImgs = badges.map((badge: { text: string; color: string; logo?: string; url?: string }) => {
            if (badge.url) {
              return `<img src="${badge.url}" alt="${badge.text}" />`;
            }
            const color = badge.color.replace("#", "");
            const logo = badge.logo ? `&logo=${encodeURIComponent(badge.logo)}&logoColor=white` : "";
            return `<img src="https://img.shields.io/badge/${encodeURIComponent(badge.text.replace(/-/g, "--"))}-${color}?style=for-the-badge${logo}" alt="${badge.text}" />`;
          }).join("\n");
          parts.push(`<div style="text-align:${alignment}">\n${htmlImgs}\n</div>`);
        }

        text = parts.join("\n\n");
        break;
      }
      case "collapsible": {
        const summary = (block.props.summary as string) ?? "";
        const content = (block.props.content as string) ?? "";
        const open = (block.props.open as boolean) ?? false;
        text = `<details${open ? " open" : ""}>\n<summary>${summary}</summary>\n\n${content}\n\n</details>`;
        break;
      }
    }
  }

  const serializedLines = text
    ? text.split("\n").map((l) => `${indent}${l}`).join("\n")
    : "";
  const childrenText = block.children?.length
    ? block.children.map((child) => serializeBlock(child, indentLevel + 1, lookupSerializer)).filter(Boolean).join("\n\n")
    : "";

  return [serializedLines, childrenText].filter(Boolean).join("\n\n");
}

export function serializeMarkdown(
  blocks: Block[],
  lookupSerializer?: SerializerLookup,
): string {
  return blocks.map((b) => serializeBlock(b, 0, lookupSerializer)).filter(Boolean).join("\n\n");
}

export function hasImageGridMarker(markdown: string): boolean {
  return markdown.includes("<!-- image-grid -->");
}

export * from "./richText";
