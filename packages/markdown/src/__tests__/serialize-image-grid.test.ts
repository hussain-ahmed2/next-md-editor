import { describe, it, expect } from "vitest";
import { serializeMarkdown, hasImageGridMarker } from "../index";
import type { Block } from "@next-md-editor/types";

const FLUID =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop";
const GLOSSY =
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop";
const ARCH =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop";

function makeGrid(overrides: Partial<Block["props"]> = {}): Block {
  return {
    id: "grid-1",
    type: "image-grid",
    props: {
      cols: 3,
      images: [
        { id: "i1", url: FLUID, alt: "Fluid abstract shapes" },
        { id: "i2", url: GLOSSY, alt: "Glossy 3D composition" },
        { id: "i3", url: ARCH, alt: "Architectural patterns" },
      ],
      showCaptions: true,
      title: "",
      description: "",
      ...overrides,
    },
  };
}

describe("serializeMarkdown — image grid", () => {
  it("serializes a basic 3-col grid with captions visible", () => {
    const md = serializeMarkdown([makeGrid()]);

    expect(hasImageGridMarker(md)).toBe(true);
    expect(md).not.toContain("<!-- captions:hidden -->");
    expect(md).toContain("![Fluid abstract shapes](" + FLUID + ")");
    expect(md).toContain("![Glossy 3D composition](" + GLOSSY + ")");
    expect(md).toContain("![Architectural patterns](" + ARCH + ")");
    expect(md).toContain("| &nbsp; | &nbsp; | &nbsp; |");
    expect(md).toContain("| --- | --- | --- |");
  });

  it("adds <!-- captions:hidden --> when showCaptions is false", () => {
    const md = serializeMarkdown([makeGrid({ showCaptions: false })]);

    expect(md).toContain("<!-- captions:hidden -->");
  });

  it("serializes title and description", () => {
    const md = serializeMarkdown([
      makeGrid({ title: "My Gallery", description: "Beautiful art" }),
    ]);

    expect(md).toContain("#### My Gallery");
    expect(md).toContain("_Beautiful art_");
  });

  it("does not output title/description when empty", () => {
    const md = serializeMarkdown([makeGrid({ title: "", description: "" })]);

    expect(md).not.toContain("####");
    expect(md).not.toMatch(/^_/m);
  });

  it("serializes a 2-col grid", () => {
    const md = serializeMarkdown([
      makeGrid({
        cols: 2,
        images: [
          { id: "i1", url: FLUID, alt: "A" },
          { id: "i2", url: GLOSSY, alt: "B" },
        ],
      }),
    ]);

    expect(md).toContain("| &nbsp; | &nbsp; |");
    expect(md).toContain("| --- | --- |");
    expect(md).toContain("![A](" + FLUID + ") | ![B](" + GLOSSY + ")");
  });

  it("serializes a 1-col grid", () => {
    const md = serializeMarkdown([
      makeGrid({
        cols: 1,
        images: [{ id: "i1", url: FLUID, alt: "Solo" }],
      }),
    ]);

    const lines = md.split("\n");
    const dataRow = lines.find((l) => l.includes("![Solo]"));
    expect(dataRow).toContain("![Solo](" + FLUID + ")");
  });

  it("handles partial last row (5 images in 3 cols)", () => {
    const md = serializeMarkdown([
      makeGrid({
        cols: 3,
        images: [
          { id: "i1", url: FLUID, alt: "a" },
          { id: "i2", url: GLOSSY, alt: "b" },
          { id: "i3", url: ARCH, alt: "c" },
          { id: "i4", url: FLUID, alt: "d" },
          { id: "i5", url: GLOSSY, alt: "e" },
        ],
      }),
    ]);

    const lines = md.split("\n").filter((l) => l.includes("!["));
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("![a]");
    expect(lines[0]).toContain("![b]");
    expect(lines[0]).toContain("![c]");
    expect(lines[1]).toContain("![d]");
    expect(lines[1]).toContain("![e]");
    expect(lines[1]).toMatch(/\|\s*$/);
  });

  it("returns empty string for grid with no images", () => {
    const md = serializeMarkdown([
      makeGrid({ images: [], cols: 2 }),
    ]);

    expect(md).toBe("");
  });

  it("outputs the image-grid comment first", () => {
    const md = serializeMarkdown([makeGrid()]);

    const firstLine = md.split("\n")[0].trim();
    expect(firstLine).toBe("<!-- image-grid -->");
  });
});
