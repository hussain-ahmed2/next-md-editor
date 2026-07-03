import { describe, it, expect } from "vitest";
import { markdownToRichText, richTextToMarkdown } from "../index";

describe("richText inline parsing", () => {
  it("parses plain text", () => {
    expect(markdownToRichText("hello")).toEqual([{ text: "hello" }]);
  });

  it("parses bold text", () => {
    expect(markdownToRichText("hello **world**")).toEqual([
      { text: "hello " },
      { text: "world", bold: true }
    ]);
  });

  it("parses nested bold and italic text", () => {
    expect(markdownToRichText("hello **bold *italic* bold**")).toEqual([
      { text: "hello " },
      { text: "bold ", bold: true },
      { text: "italic", bold: true, italic: true },
      { text: " bold", bold: true }
    ]);
  });
});
