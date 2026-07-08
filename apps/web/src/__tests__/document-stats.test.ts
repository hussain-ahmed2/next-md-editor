import { describe, it, expect } from "vitest";
import { getDocStats } from "../features/document-stats";
import type { Block } from "@next-md-editor/types";

describe("document-stats", () => {
  it("should calculate stats from html string content (new Lexical format)", () => {
    const blocks: Block[] = [
      {
        id: "1",
        type: "paragraph",
        props: {
          content: "<p>Hello <b>world</b></p>",
        },
      },
      {
        id: "2",
        type: "heading",
        props: {
          content: "<h1>Test <i>heading</i> here</h1>",
        },
      },
    ];

    const stats = getDocStats(blocks);
    
    // "Hello world" (11 chars, 2 words) + " " + "Test heading here" (17 chars, 3 words)
    // Total text: "Hello world Test heading here" 
    // Wait, the regex replace simply strips tags: "Hello world Test heading here"
    
    expect(stats.words).toBe(5);
    // "Hello world Test heading here".length = 29
    expect(stats.chars).toBe(29);
  });

  it("should handle legacy RichText array format gracefully", () => {
    const blocks: Block[] = [
      {
        id: "1",
        type: "paragraph",
        props: {
          content: [
            { text: "Legacy ", format: 0 },
            { text: "format", format: 1 },
          ],
        },
      },
    ];

    const stats = getDocStats(blocks);
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe(13); // "Legacy format".length
  });

  it("should ignore empty blocks and gracefully process unknown types with content", () => {
    const blocks: Block[] = [
      {
        id: "1",
        type: "paragraph",
        props: {},
      },
      {
        id: "2",
        type: "unknown-type",
        props: { content: "ignore me" },
      }
    ];

    const stats = getDocStats(blocks);
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe(9);
  });
});
