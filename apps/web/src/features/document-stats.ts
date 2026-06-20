"use client";

import type { Block, RichText } from "@next-md-editor/types";

function richTextToPlainText(rt: RichText): string {
  return rt.map((s) => s.text).join("");
}

function extractBlockText(block: Block): string {
  const p = block.props;
  switch (block.type) {
    case "heading":
    case "paragraph":
      return richTextToPlainText((p.content as RichText) ?? []);
    case "quote":
    case "callout":
      return (p.text as string) ?? "";
    case "code":
      return (p.code as string) ?? "";
    case "bullet-list":
    case "numbered-list": {
      const items = p.items as Array<{ content: RichText }> | undefined;
      if (!items) return "";
      return items.map((i) => richTextToPlainText(i.content ?? [])).join(" ");
    }
    default:
      return "";
  }
}

export interface DocStats {
  words: number;
  chars: number;
  readingTime: string;
}

export function getDocStats(blocks: Block[]): DocStats {
  const text = blocks.map(extractBlockText).join(" ").trim();
  const charCount = text.length;
  const wordCount = text ? text.split(/\s+/).length : 0;
  const minutes = wordCount / 225;
  if (minutes < 1) return { words: wordCount, chars: charCount, readingTime: "<1 min" };
  const m = Math.round(minutes);
  return { words: wordCount, chars: charCount, readingTime: `${m} min${m > 1 ? "" : ""} read` };
}
