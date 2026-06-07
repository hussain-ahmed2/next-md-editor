import { marked } from "marked";
import hljs from "highlight.js";

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
 * Syntax-highlights `code` using highlight.js and returns an HTML string.
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
