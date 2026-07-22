import { describe, expect, it } from "vitest";
import { markdownToHtml } from "@/lib/export-html";

/**
 * The preview and the HTML/PDF export share `markdownSanitizeSchema`
 * (via markdownToHtml here and rehype-sanitize in MarkdownPreview). These
 * tests guard the security boundary: untrusted markdown (imported files,
 * dropped files, ZIP projects) must not be able to inject scripts, while
 * the legitimate raw HTML that GitHub renders is preserved.
 */

describe("markdown sanitization — XSS is stripped", () => {
  it("removes inline event handlers", () => {
    const html = markdownToHtml(`<img src="x" onerror="window.__xss=1">`);
    expect(html).not.toMatch(/onerror/i);
  });

  it("removes <script> tags", () => {
    const html = markdownToHtml(`hello\n\n<script>window.__xss=1</script>`);
    expect(html).not.toMatch(/<script/i);
  });

  it("strips javascript: URLs in links", () => {
    const html = markdownToHtml(`[click](javascript:alert(1))`);
    expect(html).not.toMatch(/javascript:/i);
  });

  it("strips javascript: URLs in raw anchors", () => {
    const html = markdownToHtml(`<a href="javascript:alert(1)">x</a>`);
    expect(html).not.toMatch(/javascript:/i);
  });

  it("removes <iframe> and other dangerous elements", () => {
    const html = markdownToHtml(`<iframe src="https://evil.example"></iframe>`);
    expect(html).not.toMatch(/<iframe/i);
  });
});

describe("markdown sanitization — legitimate content is preserved", () => {
  it("keeps http(s) links with their href", () => {
    const html = markdownToHtml(`[GitHub](https://github.com)`);
    expect(html).toContain('href="https://github.com"');
    expect(html).toContain("GitHub");
  });

  it("keeps shields.io badge images (src + alt)", () => {
    const html = markdownToHtml(
      `<img src="https://img.shields.io/badge/build-passing-brightgreen" alt="build">`,
    );
    expect(html).toContain("img.shields.io/badge/build-passing-brightgreen");
    expect(html).toContain('alt="build"');
  });

  it("keeps centered alignment (align attribute)", () => {
    const html = markdownToHtml(`<div align="center">centered</div>`);
    expect(html).toContain('align="center"');
  });

  it("keeps GFM task-list checkboxes", () => {
    const html = markdownToHtml(`- [x] done\n- [ ] todo`);
    expect(html).toMatch(/<input[^>]*type="checkbox"/i);
  });

  it("keeps tables", () => {
    const html = markdownToHtml(`| a | b |\n|---|---|\n| 1 | 2 |`);
    expect(html).toContain("<table");
    expect(html).toContain("<td");
  });

  it("keeps <details>/<summary>", () => {
    const html = markdownToHtml(`<details><summary>more</summary>hidden</details>`);
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
  });

  it("keeps fenced code blocks", () => {
    const html = markdownToHtml("```js\nconst a = 1;\n```");
    expect(html).toContain("<pre");
    expect(html).toContain("<code");
  });
});
