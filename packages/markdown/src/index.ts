import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import rehypeMinifyWhitespace from "rehype-minify-whitespace";
import { v4 as uuidv4 } from "uuid";
import type { Root } from "mdast";
import type { Block, RichText } from "@next-md-editor/types";
import { markdownToRichText, richTextToMarkdown } from "./richText";
import { visit } from "unist-util-visit";

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
  cols?: number;
  images?: Array<{ id: string; url: string; alt: string }>;
  usernames?: string[];
  avatarSize?: number;
  techs?: Array<{ id: string; name: string; color: string; logo: string }>;
  username?: string;
  variant?: string;
  theme?: string;
  summary?: string;
  content?: string;
  open?: boolean;
  badges?: Array<{ id: string; text: string; color: string; logo?: string; url?: string }>;
  logoUrl?: string;
  description?: string;
  primaryBtnText?: string;
  primaryBtnUrl?: string;
  secondaryBtnText?: string;
  secondaryBtnUrl?: string;
  alignment?: string;
  items?: Array<{ id: string; text: string; completed: boolean }>;
  checked?: boolean | null;
}

// ── Extract raw text from AST node via source position ────────────────────────

function extractRawText(node: UnistNode, markdown: string): string {
  if (node.position) {
    return markdown.slice(node.position.start.offset, node.position.end.offset);
  }
  return "";
}

function getText(node: UnistNode): string {
  if (node.type === "text" || node.type === "inlineCode" || node.type === "html") return node.value || "";
  if (node.children) return node.children.map(getText).join("");
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

function remarkCustomBlocks() {
  return (tree: Root) => {
    visit(tree, (node: unknown, index, parent) => {
      const uNode = node as UnistNode;
      const uParent = parent as UnistNode | undefined;

      if (uNode.type === "html" && uParent && typeof index === "number") {
        const val = (uNode.value ?? "").trim();
        if (val === "<!-- image-grid -->") {
          const images: { id: string; url: string; alt: string }[] = [];
          let consumed = 0;

          for (let j = index + 1; j < (uParent.children?.length ?? 0); j++) {
            const next = uParent.children?.[j] as UnistNode;
            if (next.type !== "html") break;
            const html = (next.value ?? "").trim();

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
            let cols = Math.min(images.length, 3);
            for (let j = index + 1; j < Math.min(index + consumed + 2, uParent.children?.length ?? 0); j++) {
              const html = ((uParent.children?.[j] as UnistNode)?.value ?? "").trim();
              const trMatch = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
              if (trMatch) {
                const tdCount = (trMatch[1].match(/<td/gi) || []).length;
                if (tdCount > 0) { cols = tdCount; break; }
              }
            }
            const gridNode: UnistNode = {
              type: "customImageGrid",
              cols,
              images,
            };
            uParent.children?.splice(index, consumed + 1, gridNode);
            return index + 1;
          }
        }

        const statsMatch = val.match(/^<!--\s*github-stats:\s*([a-zA-Z0-9-]+)\s*-->$/);
        if (statsMatch) {
          const statsNode: UnistNode = {
            type: "customGithubStats",
            username: statsMatch[1],
          };
          uParent.children?.splice(index, 1, statsNode);
          return index + 1;
        }

        const techStackMatch = val.match(/^<!--\s*tech-stack\s*-->$/);
        if (techStackMatch) {
          const techs: Array<{ id: string; name: string; color: string; logo: string }> = [];
          let consumed = 0;
          let alignment = "left";

          const nextHtml = index + 1 < (uParent.children?.length ?? 0) ? uParent.children?.[index + 1] : null;
          if (nextHtml?.type === "html") {
            const htmlVal = ((nextHtml as UnistNode).value ?? "").trim();
            const alignMatch = htmlVal.match(/align="?(center|right|left)"?/i);
            if (alignMatch) {
              alignment = alignMatch[1].toLowerCase();
            }
            const imgRegex = /<img\s+[^>]*src="https:\/\/img\.shields\.io\/badge\/([^-]+)-([0-9a-fA-F]+)\?style=[^&]+&logo=([^&]+)&logoColor=white"[^>]*alt="([^"]+)"/gi;
            let match;
            while ((match = imgRegex.exec(htmlVal)) !== null) {
              const [_, nameRaw, color, logo, name] = match;
              techs.push({
                id: name.toLowerCase().replace(/[^a-z0-9]/g, ""),
                name,
                color,
                logo,
              });
            }
            if (techs.length > 0) consumed = 1;
          }

          if (techs.length > 0) {
            const node: UnistNode = {
              type: "customTechStack",
              techs,
              alignment,
            };
            uParent.children?.splice(index, consumed + 1, node);
            return index + 1;
          }
        }

        const heroMatch = val.match(/^<!--\s*hero\s*-->$/);
        if (heroMatch) {
          let logoUrl = "", title = "Project Title", description = "An awesome open-source project.";
          let primaryBtnText = "Get Started", primaryBtnUrl = "#";
          let secondaryBtnText = "Documentation", secondaryBtnUrl = "#";
          let consumed = 0;

          const nextHtml = index + 1 < (uParent.children?.length ?? 0) ? uParent.children?.[index + 1] : null;
          if (nextHtml?.type === "html") {
            const htmlVal = ((nextHtml as UnistNode).value ?? "").trim();
            consumed = 1;
            
            const logoMatch = htmlVal.match(/<img src="([^"]+)" alt="Logo"/);
            if (logoMatch) logoUrl = logoMatch[1];

            const titleMatch = htmlVal.match(/<h1>(.*?)<\/h1>/);
            if (titleMatch) title = titleMatch[1];

            const descMatch = htmlVal.match(/<p>(.*?)<\/p>/);
            if (descMatch) description = descMatch[1];

            const btnRegex = /<a href="([^"]+)"><img src="https:\/\/img\.shields\.io\/badge\/[^"]+" alt="([^"]+)" \/><\/a>/g;
            let match;
            const buttons: { url: string; text: string }[] = [];
            while ((match = btnRegex.exec(htmlVal)) !== null) {
              buttons.push({ url: match[1], text: match[2] });
            }
            if (buttons[0]) {
              primaryBtnUrl = buttons[0].url;
              primaryBtnText = buttons[0].text;
            }
            if (buttons[1]) {
              secondaryBtnUrl = buttons[1].url;
              secondaryBtnText = buttons[1].text;
            }
          }

          const node: UnistNode = {
            type: "customHero",
            logoUrl,
            title,
            description,
            primaryBtnText,
            primaryBtnUrl,
            secondaryBtnText,
            secondaryBtnUrl,
          };
          uParent.children?.splice(index, consumed + 1, node);
          return index + 1;
        }

        const roadmapMatch = val.match(/^<!--\s*roadmap\s*-->$/);
        if (roadmapMatch) {
          const items: Array<{ id: string; text: string; completed: boolean }> = [];
          let consumed = 0;

          const nextNode = index + 1 < (uParent.children?.length ?? 0) ? uParent.children?.[index + 1] : null;
          if (nextNode?.type === "list") {
             consumed = 1;
             const listItems = nextNode.children || [];
             listItems.forEach((li) => {
               if (li.type === "listItem") {
                 let text = "";
                 if (li.children && li.children.length > 0) {
                   const para = li.children[0];
                   if (para.type === "paragraph" && para.children) {
                     text = getText(para).trim();
                   }
                 }
                 items.push({
                   id: uuidv4(),
                   text: text,
                   completed: !!li.checked,
                 });
               }
             });
          }

          if (items.length === 0) {
            items.push({ id: uuidv4(), text: "New Task", completed: false });
          }

          const node: UnistNode = {
            type: "customRoadmap",
            items,
          };
          uParent.children?.splice(index, consumed + 1, node);
          return index + 1;
        }

        const contributorsMatch = val.match(/^<!--\s*contributors\s*-->$/);
        if (contributorsMatch) {
          const usernames: string[] = [];
          let consumed = 0;
          let avatarSize = 48;

          const nextHtml = index + 1 < (uParent.children?.length ?? 0) ? uParent.children?.[index + 1] : null;
          if (nextHtml?.type === "html") {
            const htmlVal = ((nextHtml as UnistNode).value ?? "").trim();
            const imgRegex = /src="https:\/\/github\.com\/([^"?.]+)\.png[^"]*"[^>]*width="(\d+)"/gi;
            let match;
            while ((match = imgRegex.exec(htmlVal)) !== null) {
              usernames.push(match[1]);
              avatarSize = parseInt(match[2], 10) || 48;
            }
            if (usernames.length > 0) consumed = 1;
          }

          if (usernames.length > 0) {
            const node: UnistNode = {
              type: "customContributors",
              usernames,
              avatarSize,
            };
            uParent.children?.splice(index, consumed + 1, node);
            return index + 1;
          }
        }

        const detailsMatch = val.match(/^<details\s*(open)?>([\s\S]*)<\/details>$/i);
        if (detailsMatch) {
          const inner = detailsMatch[2].trim();
          const summaryMatch = inner.match(/<summary>([\s\S]*)<\/summary>/i);
          const summary = summaryMatch ? summaryMatch[1].trim() : "Details";
          const content = summaryMatch
            ? inner.replace(/<summary>[\s\S]*<\/summary>/i, "").trim()
            : inner;
          const collapsibleNode: UnistNode = {
            type: "customCollapsible",
            summary,
            content,
            open: detailsMatch[1]?.trim() === "open",
          };
          uParent.children?.splice(index, 1, collapsibleNode);
          return index + 1;
        }

        if (val === "<!-- badge-group -->") {
          const badges: Array<{ id: string; text: string; color: string; logo?: string; url?: string }> = [];
          let consumed = 0;
          let alignment = "left";

          const nextHtml = index + 1 < (uParent.children?.length ?? 0) ? uParent.children?.[index + 1] : null;
          if (nextHtml?.type === "html") {
            const htmlVal = ((nextHtml as UnistNode).value ?? "").trim();
            const alignMatch = htmlVal.match(/align="?(center|right)"?/i) || htmlVal.match(/text-align:\s*(center|right)/i);
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

          if (badges.length === 0) {
            for (let j = index + 1; j < (uParent.children?.length ?? 0); j++) {
              const next = uParent.children?.[j] as UnistNode;
              if (next.type !== "paragraph") break;

              const images = next.children?.filter(
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
            const badgeGroupNode: UnistNode = {
              type: "customBadgeGroup",
              badges,
              alignment,
            };
            uParent.children?.splice(index, consumed + 1, badgeGroupNode);
            return index + 1;
          }
        }
      }

      if (uNode.type === "paragraph" && uParent && typeof index === "number" && Array.isArray(uNode.children)) {
        const significantChildren = (uNode.children as UnistNode[]).filter(
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
              const statsNode: UnistNode = {
                type: "customGithubStats",
                username: statsMatch[1],
                variant: qs.get("variant") || "default",
                theme: qs.get("theme") || "auto",
              };
              uParent.children?.splice(index, 1, statsNode);
              return index + 1;
            } else {
              const imgNode: UnistNode = {
                type: "customImage",
                url: imgUrl,
                alt: img.alt || "",
              };
              uParent.children?.splice(index, 1, imgNode);
              return index + 1;
            }
          } else {
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
              const badgeGroupNode: UnistNode = {
                type: "customBadgeGroup",
                badges,
                alignment: "left",
              };
              uParent.children?.splice(index, 1, badgeGroupNode);
              return index + 1;
            } else {
              const images = significantChildren.map((img: UnistNode) => ({
                id: Math.random().toString(36).substring(7),
                url: img.url || "",
                alt: img.alt || "",
              }));
              const gridNode: UnistNode = {
                type: "customImageGrid",
                cols: images.length,
                images,
              };
              uParent.children?.splice(index, 1, gridNode);
              return index + 1;
            }
          }
        }
      }
    });
  };
}

export function parseMarkdown(markdown: string): Block[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdown) as Root;

  const transformed = unified()
    .use(remarkCustomBlocks)
    .runSync(tree) as Root;

  const blocks: Block[] = [];
  for (const node of transformed.children) {
    const block = nodeToBlock(node as unknown as UnistNode, markdown);
    if (block) blocks.push(block);
  }
  return blocks;
}

function nodeToBlock(node: UnistNode, markdown: string): Block | null {
  switch (node.type) {
    case "customImageGrid":
      return {
        id: uuidv4(),
        type: "image-grid",
        props: {
          cols: node.cols as number,
          images: node.images as Array<{ id: string; url: string; alt: string }>,
        },
      };

    case "customContributors":
      return {
        id: uuidv4(),
        type: "contributors",
        props: {
          usernames: node.usernames as string[],
          avatarSize: node.avatarSize as number,
        },
      };

    case "customTechStack":
      return {
        id: uuidv4(),
        type: "tech-stack",
        props: {
          techs: node.techs as Array<{ id: string; name: string; color: string; logo: string }>,
          alignment: node.alignment as string,
        },
      };

    case "customHero":
      return {
        id: uuidv4(),
        type: "hero",
        props: {
          logoUrl: node.logoUrl as string,
          title: node.title as string,
          description: node.description as string,
          primaryBtnText: node.primaryBtnText as string,
          primaryBtnUrl: node.primaryBtnUrl as string,
          secondaryBtnText: node.secondaryBtnText as string,
          secondaryBtnUrl: node.secondaryBtnUrl as string,
        },
      };

    case "customRoadmap":
      return {
        id: uuidv4(),
        type: "roadmap",
        props: {
          items: node.items as Array<{ id: string; text: string; completed: boolean }>,
        },
      };

    case "customGithubStats":
      return {
        id: uuidv4(),
        type: "github-stats",
        props: {
          username: node.username as string,
          variant: (node.variant as string) ?? "default",
          theme: (node.theme as string) ?? "auto",
        },
      };

    case "customCollapsible":
      return {
        id: uuidv4(),
        type: "collapsible",
        props: {
          summary: node.summary as string,
          content: node.content as string,
          open: node.open as boolean,
        },
      };

    case "customBadgeGroup":
      return {
        id: uuidv4(),
        type: "badge-group",
        props: {
          badges: node.badges as Array<{ id: string; text: string; color: string; logo?: string; url?: string }>,
          alignment: (node.alignment as string) ?? "left",
        },
      };

    case "customImage":
      return {
        id: uuidv4(),
        type: "image",
        props: {
          url: node.url as string,
          alt: node.alt as string,
        },
      };

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
        const html = typeof block.props.content === "string" ? block.props.content : undefined;
        const inlineMd = html ? htmlToMarkdown(html) : ((block.props.text as string) ?? "");
        text = `${"#".repeat(level)} ${inlineMd}`;
        break;
      }
      case "paragraph": {
        const html = typeof block.props.content === "string" ? block.props.content : undefined;
        text = html ? htmlToMarkdown(html) : richTextToMarkdown((block.props.content as RichText) ?? []);
        break;
      }
      case "quote": {
        const html = typeof block.props.content === "string" ? block.props.content : undefined;
        const t = html ? htmlToMarkdown(html) : ((block.props.text as string) ?? "");
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
        const html = typeof block.props.content === "string" ? block.props.content : undefined;
        const t = html ? htmlToMarkdown(html) : ((block.props.text as string) ?? "");
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
        const content = typeof block.props.content === "string" ? block.props.content : undefined;
        if (content) {
          text = htmlToMarkdown(content);
        } else {
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
      case "contributors": {
        const usernames = (block.props.usernames as string[]) ?? [];
        const avatarSize = (block.props.avatarSize as number) ?? 48;
        if (!usernames.length) break;

        const parts: string[] = [];
        parts.push("<!-- contributors -->");

        const avatars = usernames.map((u) => 
          `<a href="https://github.com/${u}"><img src="https://github.com/${u}.png?size=${avatarSize * 2}" width="${avatarSize}" style="border-radius: 50%;" alt="${u}" /></a>`
        ).join("\n");

        parts.push(`<div align="left" style="display: flex; gap: 12px;">\n${avatars}\n</div>`);
        text = parts.join("\n\n");
        break;
      }
      case "tech-stack": {
        const techs = (block.props.techs as Array<{ id: string; name: string; color: string; logo: string }>) ?? [];
        const alignment = (block.props.alignment as string) ?? "left";
        if (!techs.length) break;

        const parts: string[] = [];
        parts.push("<!-- tech-stack -->");

        const badges = techs.map((t) => 
          `<img src="https://img.shields.io/badge/${encodeURIComponent(t.name.replace(/-/g, "--"))}-${t.color}?style=for-the-badge&logo=${t.logo}&logoColor=white" alt="${t.name}" />`
        ).join("\n");

        parts.push(`<div align="${alignment}">\n${badges}\n</div>`);
        text = parts.join("\n\n");
        break;
      }
      case "hero": {
        const logoUrl = (block.props.logoUrl as string) ?? "";
        const title = (block.props.title as string) ?? "Project Title";
        const description = (block.props.description as string) ?? "An awesome open-source project.";
        const primaryBtnText = (block.props.primaryBtnText as string) ?? "Get Started";
        const primaryBtnUrl = (block.props.primaryBtnUrl as string) ?? "#";
        const secondaryBtnText = (block.props.secondaryBtnText as string) ?? "Documentation";
        const secondaryBtnUrl = (block.props.secondaryBtnUrl as string) ?? "#";

        const parts: string[] = [];
        parts.push("<!-- hero -->");

        const btn1 = `<a href="${primaryBtnUrl}"><img src="https://img.shields.io/badge/${encodeURIComponent(primaryBtnText.replace(/-/g, "--"))}-000000?style=for-the-badge" alt="${primaryBtnText}" /></a>`;
        const btn2 = `<a href="${secondaryBtnUrl}"><img src="https://img.shields.io/badge/${encodeURIComponent(secondaryBtnText.replace(/-/g, "--"))}-ffffff?style=for-the-badge" alt="${secondaryBtnText}" /></a>`;

        const html = [
          `<div align="center">`,
          logoUrl ? `  <img src="${logoUrl}" alt="Logo" width="100" />` : "",
          `  <h1>${title}</h1>`,
          `  <p>${description}</p>`,
          `  <div style="display: flex; gap: 16px; justify-content: center; align-items: center; flex-wrap: wrap;">`,
          `    ${btn1}`,
          `    ${btn2}`,
          `  </div>`,
          `</div>`
        ].filter(Boolean).join("\n");

        parts.push(html);
        text = parts.join("\n\n");
        break;
      }
      case "roadmap": {
        const items = (block.props.items as Array<{ id: string; text: string; completed: boolean }>) ?? [];
        if (!items.length) break;

        const parts: string[] = [];
        parts.push("<!-- roadmap -->");

        const list = items.map((item) => `- [${item.completed ? "x" : " "}] ${item.text}`).join("\n");
        parts.push(list);

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
          parts.push(`<div align="${alignment}">\n${htmlImgs}\n</div>`);
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
