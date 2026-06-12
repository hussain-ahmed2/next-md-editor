import type { RichText } from "@next-md-editor/types";
import { richTextToHtml, htmlToRichText, richTextToMarkdown } from "@next-md-editor/markdown";

export interface ListItemData {
  content: RichText;
  children?: ListItemData[];
}

export function itemsToHtml(items: ListItemData[], style: "bullet" | "numbered"): string {
  const tag = style === "numbered" ? "ol" : "ul";
  return `<${tag}>${items.map((item) => itemToHtml(item, style)).join("")}</${tag}>`;
}

function itemToHtml(item: ListItemData, style: "bullet" | "numbered"): string {
  const contentHtml = richTextToHtml(item.content);
  let html = `<li>${contentHtml}`;
  if (item.children && item.children.length > 0) {
    html += itemsToHtml(item.children, style);
  }
  html += "</li>";
  return html;
}

export function htmlToItems(html: string): ListItemData[] {
  if (typeof DOMParser === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const list = doc.body.firstElementChild;
  if (!list || (list.tagName !== "UL" && list.tagName !== "OL")) return [];
  return Array.from(list.children)
    .filter((el) => el.tagName === "LI")
    .map((li) => parseListItem(li));
}

function parseListItem(li: Element): ListItemData {
  const nestedLists: Element[] = [];
  let innerHtml = "";

  for (const node of li.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.tagName === "UL" || el.tagName === "OL") {
        nestedLists.push(el);
      } else {
        innerHtml += el.outerHTML;
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      innerHtml += node.textContent ?? "";
    }
  }

  // Browser inserts <br> into empty contentEditable list items.
  // Strip it so empty items produce content: [] which matches
  // what itemsToHtml outputs (keeping the round-trip guard intact).
  if (/^(<br\s*\/?>|\s)*$/.test(innerHtml)) {
    innerHtml = "";
  }

  return {
    content: htmlToRichText(innerHtml),
    children:
      nestedLists.length > 0
        ? Array.from(nestedLists[0].children)
            .filter((el) => el.tagName === "LI")
            .map((li) => parseListItem(li))
        : undefined,
  };
}

export function itemsToMarkdown(items: ListItemData[], style: "bullet" | "numbered"): string {
  return items
    .map((item) => itemToMarkdown(item, style === "numbered" ? "1." : "-"))
    .join("\n");
}

function itemToMarkdown(item: ListItemData, prefix: string): string {
  const inlineMd = richTextToMarkdown(item.content);
  let result = prefix + " " + inlineMd;
  if (item.children && item.children.length > 0) {
    const childLines = item.children
      .map((child) => `  ${prefix} ${richTextToMarkdown(child.content)}`)
      .join("\n");
    result += "\n" + childLines;
  }
  return result;
}

export function defaultItems(): ListItemData[] {
  return [{ content: [{ text: "Item 1" }] }];
}
