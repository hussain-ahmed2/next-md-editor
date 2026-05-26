import { describe, it, expect } from "vitest";
import { hasImageGridMarker } from "../index";

describe("hasImageGridMarker", () => {
  it("returns true when markdown contains <!-- image-grid -->", () => {
    const md = `Some text\n\n<!-- image-grid -->\n\n| a | b |`;
    expect(hasImageGridMarker(md)).toBe(true);
  });

  it("returns false when markdown has no image-grid comment", () => {
    const md = `| a | b |\n|---|---|\n| c | d |`;
    expect(hasImageGridMarker(md)).toBe(false);
  });

  it("returns false for empty markdown", () => {
    expect(hasImageGridMarker("")).toBe(false);
  });

  it("returns true with surrounding whitespace", () => {
    const md = `  <!-- image-grid -->  `;
    expect(hasImageGridMarker(md)).toBe(true);
  });

  it("returns false for similar comments", () => {
    const md = `<!-- image-grid-2 -->`;
    expect(hasImageGridMarker(md)).toBe(false);
  });
});
