import { marked } from "marked";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import rust from "highlight.js/lib/languages/rust";
import go from "highlight.js/lib/languages/go";
import sql from "highlight.js/lib/languages/sql";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";

// Register selected common/popular languages to optimize bundle size
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("go", go);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("csharp", csharp);

// ── marked: custom renderer overrides ─────────────────────────────────────────
// Apply GitHub Dark styling to links and inline code produced by parseInline().
marked.use({
  renderer: {
    link({ href, text }: { href: string; text: string }) {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#58a6ff;text-decoration:none;font-weight:500;">${text}</a>`;
    },
    codespan({ text }: { text: string }) {
      return `<code style="padding:2px 4px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,monospace;font-size:85%;">${text}</code>`;
    },
  },
});

// Map short language aliases used in the editor to highlight.js language ids.
const LANG_ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
};

/**
 * Syntax-highlights `code` using highlight.js core and returns an HTML string.
 * The resulting spans use hljs CSS classes that are styled by the global
 * "highlight.js/styles/github-dark.css" import in globals.css.
 */
export function highlightCodeHtml(code: string, lang: string = "ts"): string {
  if (!code) return "";
  const resolvedLang = LANG_ALIASES[lang] ?? lang;
  try {
    if (hljs.getLanguage(resolvedLang)) {
      return hljs.highlight(code, { language: resolvedLang }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    // Fallback: return escaped plain text
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

/**
 * Renders inline markdown (bold, italic, code, links) to an HTML string
 * using `marked.parseInline()`.
 */
export function renderInlineMarkdown(text: string): string {
  if (!text) return "";
  // parseInline is synchronous by default (no async renderer configured).
  return marked.parseInline(text) as string;
}

export function getHighlightLanguages(): string[] {
  return hljs.listLanguages();
}
