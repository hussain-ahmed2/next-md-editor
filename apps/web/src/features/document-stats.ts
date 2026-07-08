"use client";

import type { Block, RichText } from "@next-md-editor/types";

function htmlToPlainText(html: unknown): string {
  if (typeof html !== "string") {
    if (Array.isArray(html)) {
      // Fallback for legacy RichText format if it exists
      return html.map((s) => s.text || "").join("");
    }
    return "";
  }
  // Basic HTML tag stripping for word counting
  return html.replace(/<[^>]*>?/gm, "").trim();
}

function extractBlockText(block: Block): string {
  const p = block.props;
  // In Lexical migration, all text-based blocks store their HTML content in p.content
  // or fall back to legacy properties (p.text)
  if (p.content !== undefined) {
    return htmlToPlainText(p.content);
  }
  
  if (p.text !== undefined) {
     return typeof p.text === "string" ? p.text : htmlToPlainText(p.text);
  }

  if (p.code !== undefined) {
    return typeof p.code === "string" ? p.code : "";
  }
  
  return "";
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
