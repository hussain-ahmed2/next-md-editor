import { describe, it, expect } from "vitest";
import { htmlToMarkdown } from "../index";

describe("htmlToMarkdown", () => {
  it("converts simple text", () => {
    expect(htmlToMarkdown("Hello world")).toBe("Hello world");
  });

  it("converts strong and bold tags to markdown syntax", () => {
    expect(htmlToMarkdown("Hello <strong>world</strong>")).toBe("Hello **world**");
    expect(htmlToMarkdown("Hello <b>world</b>")).toBe("Hello **world**");
  });

  it("converts em and italic tags to markdown syntax", () => {
    expect(htmlToMarkdown("Hello <em>world</em>")).toBe("Hello *world*");
    expect(htmlToMarkdown("Hello <i>world</i>")).toBe("Hello *world*");
  });

  it("converts strikethrough tags to markdown syntax", () => {
    expect(htmlToMarkdown("Hello <del>world</del>")).toBe("Hello ~~world~~");
    expect(htmlToMarkdown("Hello <s>world</s>")).toBe("Hello ~~world~~");
  });

  it("converts inline code tags to markdown syntax", () => {
    expect(htmlToMarkdown("Hello <code>world</code>")).toBe("Hello `world`");
  });

  it("converts anchors/links to markdown syntax", () => {
    expect(
      htmlToMarkdown('Hello <a href="https://example.com">world</a>')
    ).toBe("Hello [world](https://example.com)");
  });

  it("handles complex mixed tag visual elements", () => {
    const html = 'This is <strong>bold and <em>italic and <a href="https://google.com">link</a></em></strong>.';
    const md = htmlToMarkdown(html);
    expect(md).toBe("This is **bold and *italic and [link](https://google.com)***.");
  });

  it("cleans up line breaks and divs", () => {
    // A single <br> translates to a hard line break (backslash followed by newline)
    expect(htmlToMarkdown("Hello<br>world")).toBe("Hello\\\nworld");
    // Block-level divs translate to double-newline separated text (separate paragraphs)
    expect(htmlToMarkdown("<div>Hello</div><div>world</div>")).toBe("Hello\n\nworld");
  });

  it("decodes standard html entities cleanly", () => {
    expect(htmlToMarkdown("Hello &amp; world &lt; &gt; &nbsp;")).toBe("Hello & world < >");
  });
});
