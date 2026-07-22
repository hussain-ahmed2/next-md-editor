import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { markdownSanitizeSchema } from "@/lib/sanitize-schema";

/**
 * GFM markdown → sanitized HTML fragment. Raw HTML is preserved but cleaned
 * with a GitHub-like schema so exported/printed documents cannot execute
 * scripts or event handlers from untrusted markdown.
 */
export function markdownToHtml(markdown: string): string {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, markdownSanitizeSchema)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString();
}

/**
 * Compact GitHub-flavored stylesheet so exported files render nicely
 * standalone (no external requests). Light theme — matches how READMEs
 * are usually shared.
 */
export const GITHUB_LIKE_CSS = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0; padding: 32px 16px; background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
}
.markdown-body {
  max-width: 830px; margin: 0 auto; color: #1f2328;
  font-size: 16px; line-height: 1.5; word-wrap: break-word;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25;
}
.markdown-body h1 { font-size: 2em; padding-bottom: .3em; border-bottom: 1px solid #d1d9e0b3; }
.markdown-body h2 { font-size: 1.5em; padding-bottom: .3em; border-bottom: 1px solid #d1d9e0b3; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body h4 { font-size: 1em; }
.markdown-body p { margin-top: 0; margin-bottom: 16px; }
.markdown-body a { color: #0969da; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body img { max-width: 100%; }
.markdown-body code, .markdown-body pre {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 85%;
}
.markdown-body code { background: #818b981f; padding: .2em .4em; border-radius: 6px; }
.markdown-body pre {
  background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; line-height: 1.45;
}
.markdown-body pre code { background: transparent; padding: 0; }
.markdown-body blockquote {
  margin: 0 0 16px; padding: 0 1em; color: #59636e; border-left: .25em solid #d1d9e0;
}
.markdown-body table { border-collapse: collapse; border-spacing: 0; margin-bottom: 16px; display: block; overflow-x: auto; }
.markdown-body th, .markdown-body td { border: 1px solid #d1d9e0; padding: 6px 13px; }
.markdown-body th { font-weight: 600; }
.markdown-body tr:nth-child(2n) { background: #f6f8fa; }
.markdown-body ul, .markdown-body ol { margin-top: 0; margin-bottom: 16px; padding-left: 2em; }
.markdown-body li + li { margin-top: .25em; }
.markdown-body hr { height: .25em; border: 0; background: #d1d9e0; margin: 24px 0; }
.markdown-body input[type="checkbox"] { margin-right: .5em; }
.markdown-body details { margin-bottom: 16px; }
.markdown-body summary { cursor: pointer; }
@media print {
  body { padding: 0; }
  .markdown-body pre, .markdown-body table, .markdown-body blockquote, .markdown-body img { break-inside: avoid; }
}
`;

/** Wrap rendered markdown in a fully standalone HTML document. */
export function buildStandaloneHtml(title: string, markdown: string): string {
  const body = markdownToHtml(markdown);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title.replace(/</g, "&lt;")}</title>
<style>${GITHUB_LIKE_CSS}</style>
</head>
<body>
<article class="markdown-body">
${body}
</article>
</body>
</html>
`;
}
