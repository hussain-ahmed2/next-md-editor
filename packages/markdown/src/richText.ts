import type { RichText, RichTextSpan, FormatFlags } from "@next-md-editor/types";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

const inlineParser = unified().use(remarkParse).use(remarkGfm);

interface UnistNode {
  type: string;
  value?: string;
  url?: string;
  alt?: string | null;
  children?: UnistNode[];
}

function parseAstToSpans(nodes: UnistNode[], inheritedFlags: FormatFlags = {}): RichTextSpan[] {
  const spans: RichTextSpan[] = [];
  for (const node of nodes) {
    const flags = { ...inheritedFlags };
    switch (node.type) {
      case "text":
        spans.push({ text: node.value ?? "", ...flags });
        break;
      case "strong":
        spans.push(...parseAstToSpans(node.children || [], { ...flags, bold: true }));
        break;
      case "emphasis":
        spans.push(...parseAstToSpans(node.children || [], { ...flags, italic: true }));
        break;
      case "delete":
        spans.push(...parseAstToSpans(node.children || [], { ...flags, strikethrough: true }));
        break;
      case "inlineCode":
        spans.push({ text: node.value ?? "", ...flags, code: true });
        break;
      case "link":
        spans.push(...parseAstToSpans(node.children || [], { ...flags, link: node.url }));
        break;
      case "break":
        spans.push({ text: "\n", ...flags });
        break;
      default:
        if (node.children) {
          spans.push(...parseAstToSpans(node.children, flags));
        }
        break;
    }
  }
  return spans;
}

function extractInlineNodes(nodes: UnistNode[]): UnistNode[] {
  const inlineNodes: UnistNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "paragraph" || node.type === "heading" || node.type === "blockquote") {
      if (inlineNodes.length > 0) {
        inlineNodes.push({ type: "break" });
      }
      inlineNodes.push(...(node.children || []));
    } else if (
      node.type === "text" ||
      node.type === "strong" ||
      node.type === "emphasis" ||
      node.type === "delete" ||
      node.type === "inlineCode" ||
      node.type === "link"
    ) {
      inlineNodes.push(node);
    } else {
      if (node.children) {
        inlineNodes.push(...extractInlineNodes(node.children));
      }
    }
  }
  return inlineNodes;
}

// ── Merging adjacent spans with identical formats ──────────────────────────────

function mergeRichText(rt: RichText): RichText {
  if (rt.length <= 1) return rt;
  const result: RichText = [{ ...rt[0] }];
  for (let i = 1; i < rt.length; i++) {
    const prev = result[result.length - 1];
    const curr = rt[i];
    if (
      prev.bold === curr.bold &&
      prev.italic === curr.italic &&
      prev.code === curr.code &&
      prev.strikethrough === curr.strikethrough &&
      prev.link === curr.link
    ) {
      prev.text += curr.text;
    } else {
      result.push({ ...curr });
    }
  }
  return result;
}

// ── Plain text length ──────────────────────────────────────────────────────────

function richTextLength(rt: RichText): number {
  return rt.reduce((acc, s) => acc + s.text.length, 0);
}

// ── Plain text content ─────────────────────────────────────────────────────────

function richTextPlainText(rt: RichText): string {
  return rt.map((s) => s.text).join("");
}

// ── Split RichText at character offset, returning left and right halves ────────

function splitRichTextAt(
  rt: RichText,
  offset: number,
): { before: RichText; after: RichText } {
  const before: RichText = [];
  const after: RichText = [];
  let pos = 0;
  for (const span of rt) {
    const end = pos + span.text.length;
    if (end <= offset) {
      before.push({ ...span });
    } else if (pos >= offset) {
      after.push({ ...span });
    } else {
      const split = offset - pos;
      before.push({ ...span, text: span.text.slice(0, split) });
      after.push({ ...span, text: span.text.slice(split) });
    }
    pos = end;
  }
  return { before, after };
}

// ── Apply format flags to a range ──────────────────────────────────────────────

function applyRichFormat(
  rt: RichText,
  start: number,
  end: number,
  format: FormatFlags,
): RichText {
  if (start >= end) return rt;
  const { before: left, after: midAfter } = splitRichTextAt(rt, start);
  const { before: mid, after: right } = splitRichTextAt(midAfter, end - start);

  const formatted = mid.map((s) => {
    if (format.code) {
      return { text: s.text, code: true as const };
    }
    return { ...s, ...format, text: s.text };
  });

  return mergeRichText([...left, ...formatted, ...right]);
}

// ── Toggle format on range (if entire range already has it, remove it) ─────────

function toggleRichFormat(
  rt: RichText,
  start: number,
  end: number,
  format: FormatFlags,
): RichText {
  if (start >= end) return rt;

  const { before: left, after: midAfter } = splitRichTextAt(rt, start);
  const { before: mid, after: right } = splitRichTextAt(midAfter, end - start);

  const key = getFormatKey(format);

  const allAlreadySet = mid.length > 0 && mid.every((s) => formatKeyMatches(s, key));

  const formatted = mid.map((s) => {
    if (format.code) {
      return { text: s.text, code: !s.code } as RichTextSpan;
    }
    if (allAlreadySet) {
      if (format.link && format.link !== s.link) {
        return { ...s, ...format, text: s.text };
      }
      return { text: s.text } as RichTextSpan;
    }
    return { ...s, ...format, text: s.text };
  });

  return mergeRichText([...left, ...formatted, ...right]);
}

function getFormatKey(f: FormatFlags): string {
  if (f.code) return "code";
  return (["bold", "italic", "strikethrough", "link"] as const)
    .filter((k) => f[k])
    .join(",");
}

function formatKeyMatches(s: RichTextSpan, key: string): boolean {
  if (key === "code") return !!s.code;
  const parts = key.split(",").filter(Boolean) as (keyof FormatFlags)[];
  if (parts.length === 0) return !s.bold && !s.italic && !s.strikethrough && !s.link && !s.code;
  return parts.every((k) => s[k]);
}

// ── Get active formats at a character offset ───────────────────────────────────

function getActiveFormats(rt: RichText, offset: number): FormatFlags {
  if (rt.length === 0) return {};
  let pos = 0;
  for (const span of rt) {
    if (pos + span.text.length > offset) {
      return {
        bold: span.bold,
        italic: span.italic,
        code: span.code,
        strikethrough: span.strikethrough,
        link: span.link,
      };
    }
    pos += span.text.length;
  }
  const last = rt[rt.length - 1];
  return {
    bold: last.bold,
    italic: last.italic,
    code: last.code,
    strikethrough: last.strikethrough,
    link: last.link,
  };
}

// ── Insert text at offset (inherits format from preceding span) ────────────────

function insertRichText(rt: RichText, offset: number, text: string): RichText {
  if (!text) return rt;
  const { before, after } = splitRichTextAt(rt, offset);
  const fmt: FormatFlags = before.length > 0 ? before[before.length - 1] : {};
  const insert: RichText = [
    {
      text,
      bold: fmt.bold,
      italic: fmt.italic,
      code: fmt.code,
      strikethrough: fmt.strikethrough,
      link: fmt.link,
    },
  ];
  return mergeRichText([...before, ...insert, ...after]);
}

// ── Delete a range ─────────────────────────────────────────────────────────────

function deleteRichRange(
  rt: RichText,
  start: number,
  end: number,
): RichText {
  if (start >= end) return rt;
  const { before: left, after: midAfter } = splitRichTextAt(rt, start);
  const { after: right } = splitRichTextAt(midAfter, end - start);
  return mergeRichText([...left, ...right]);
}

// ── RichText → markdown inline string ─────────────────────────────────────────

function richTextToMarkdown(rt: RichText): string {
  let result = "";
  for (const span of rt) {
    let t = span.text;
    if (!t) continue;
    if (span.code) {
      result += t.includes("`") ? "`` " + t + " ``" : "`" + t + "`";
      continue;
    }
    if (span.link) t = "[" + t + "](" + span.link + ")";
    if (span.strikethrough) t = "~~" + t + "~~";
    if (span.bold && span.italic) t = "***" + t + "***";
    else if (span.bold) t = "**" + t + "**";
    else if (span.italic) t = "*" + t + "*";
    result += t;
  }
  return result;
}

// ── Markdown inline string → RichText ─────────────────────────────────────────

function markdownToRichText(md: string): RichText {
  if (!md) return [];
  try {
    const tree = inlineParser.parse(md);
    const inlineNodes = extractInlineNodes(tree.children as unknown as UnistNode[]);
    return mergeRichText(parseAstToSpans(inlineNodes));
  } catch (e) {
    console.error("Failed to parse markdown to rich text:", e);
    return [{ text: md }];
  }
}

// ── DOM selection ↔ RichText offset ───────────────────────────────────────────

function getTextLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.length ?? 0;
  }
  let len = 0;
  for (let i = 0; i < node.childNodes.length; i++) {
    len += getTextLength(node.childNodes[i]);
  }
  return len;
}

function getDomTextOffset(container: Node, targetNode: Node, targetOffset: number): number {
  if (targetNode === container) {
    let offset = 0;
    const children = container.childNodes;
    const limit = Math.min(targetOffset, children.length);
    for (let i = 0; i < limit; i++) {
      offset += getTextLength(children[i]);
    }
    return offset;
  }

  if (targetNode.nodeType === Node.ELEMENT_NODE) {
    let offset = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ALL);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node === targetNode) {
        const children = targetNode.childNodes;
        const limit = Math.min(targetOffset, children.length);
        for (let i = 0; i < limit; i++) {
          offset += getTextLength(children[i]);
        }
        return offset;
      }
      if (node.nodeType === Node.TEXT_NODE && !targetNode.contains(node)) {
        offset += node.textContent?.length ?? 0;
      }
    }
    return offset;
  }

  let offset = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node === targetNode) {
      return offset + targetOffset;
    }
    offset += node.textContent?.length ?? 0;
  }
  return offset;
}

function restoreDomRange(
  container: HTMLElement,
  startOffset: number,
  endOffset: number,
) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let startNode: Node | null = null;
  let startNodeOffset = 0;
  let endNode: Node | null = null;
  let endNodeOffset = 0;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const len = node.textContent?.length ?? 0;
    if (!startNode && pos + len >= startOffset) {
      startNode = node;
      startNodeOffset = startOffset - pos;
    }
    if (!endNode && pos + len >= endOffset) {
      endNode = node;
      endNodeOffset = endOffset - pos;
    }
    pos += len;
  }

  if (!startNode) startNode = container;
  if (!endNode) endNode = container;

  const range = document.createRange();
  try {
    range.setStart(startNode, startNodeOffset);
    range.setEnd(endNode, endNodeOffset);
  } catch {
    // Fallback if startNode/endNode offsets are out of bounds for non-text container
    range.selectNodeContents(container);
    range.collapse(false);
  }

  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function getSelectionRichRange(
  rt: RichText,
  container: HTMLElement,
): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);

  const start = getDomTextOffset(container, range.startContainer, range.startOffset);
  const end = getDomTextOffset(container, range.endContainer, range.endOffset);

  const len = richTextLength(rt);
  return {
    start: Math.min(start, len),
    end: Math.min(end, len),
  };
}

// ── RichText → HTML for contentEditable rendering ─────────────────────────────

function richTextToHtml(rt: RichText): string {
  let html = "";
  for (const span of rt) {
    let t = span.text;
    if (!t) continue;
    t = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (span.code) {
      html += `<code>${t}</code>`;
      continue;
    }
    if (span.link) t = `<a href="${span.link.replace(/"/g, "&quot;")}">${t}</a>`;
    if (span.strikethrough) t = `<del>${t}</del>`;
    if (span.bold) t = `<strong>${t}</strong>`;
    if (span.italic) t = `<em>${t}</em>`;
    html += t;
  }
  return html;
}

// ── DOM contentEditable innerHTML → RichText ─────────────────────────────────

function htmlToRichText(html: string): RichText {
  if (typeof DOMParser === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<p>${html}</p>`, "text/html");
  const container = doc.body.firstElementChild as HTMLElement | null;
  if (!container) return [];

  function getActive(flags: FormatFlags[]): FormatFlags {
    const out: FormatFlags = {};
    for (const f of flags) {
      if (f.bold) out.bold = true;
      if (f.italic) out.italic = true;
      if (f.code) out.code = true;
      if (f.strikethrough) out.strikethrough = true;
      if (f.link) out.link = f.link;
    }
    return out;
  }

  function process(parent: HTMLElement, inherited: FormatFlags[]): RichText {
    const result: RichText = [];
    for (const child of parent.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? "";
        if (!text) continue;
        result.push({ text, ...getActive(inherited) });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName;
        let next: FormatFlags[] = inherited;
        if (tag === "STRONG" || tag === "B") next = [...next, { bold: true }];
        else if (tag === "EM" || tag === "I") next = [...next, { italic: true }];
        else if (tag === "CODE") next = [...next, { code: true }];
        else if (tag === "DEL" || tag === "S" || tag === "STRIKE") next = [...next, { strikethrough: true }];
        else if (tag === "A") next = [...next, { link: el.getAttribute("href") ?? "" }];
        else if (tag === "BR") { result.push({ text: "\n" }); continue; }
        result.push(...process(el, next));
      }
    }
    return mergeRichText(result);
  }

  return process(container, []);
}

export {
  mergeRichText,
  richTextLength,
  richTextPlainText,
  splitRichTextAt,
  applyRichFormat,
  toggleRichFormat,
  getActiveFormats,
  insertRichText,
  deleteRichRange,
  richTextToMarkdown,
  markdownToRichText,
  getDomTextOffset,
  restoreDomRange,
  getSelectionRichRange,
  richTextToHtml,
  htmlToRichText,
};
