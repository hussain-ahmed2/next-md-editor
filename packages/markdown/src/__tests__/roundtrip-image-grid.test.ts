import { describe, it, expect } from "vitest";
import { parseMarkdown, serializeMarkdown } from "../index";

const FLUID =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop";
const GLOSSY =
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop";
const ARCH =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop";

function stripIds(blocks: any[]) {
  return blocks.map((b) => {
    const { id, images, ...rest } = b;
    return {
      ...rest,
      props: {
        ...b.props,
        images: (b.props.images ?? []).map((img: any) => {
          const { id: _id, ...imgRest } = img;
          return imgRest;
        }),
      },
    };
  });
}

describe("image grid round-trip", () => {
  it("preserves images and cols through serialize → parse", () => {
    const original = `<!-- image-grid -->

| &nbsp; | &nbsp; | &nbsp; |
| --- | --- | --- |
| ![Fluid abstract shapes](${FLUID}) | ![Glossy 3D composition](${GLOSSY}) | ![Architectural patterns](${ARCH}) |`;

    const blocks = parseMarkdown(original);
    const serialized = serializeMarkdown(blocks);
    const parsed = parseMarkdown(serialized);
    const grid = parsed.find((b) => b.type === "image-grid");

    expect(grid).toBeDefined();
    expect(grid.props.cols).toBe(3);
    expect(grid.props.images).toHaveLength(3);
    expect(grid.props.images[0].url).toBe(FLUID);
    expect(grid.props.images[0].alt).toBe("Fluid abstract shapes");
    expect(grid.props.images[1].url).toBe(GLOSSY);
    expect(grid.props.images[1].alt).toBe("Glossy 3D composition");
    expect(grid.props.images[2].url).toBe(ARCH);
    expect(grid.props.images[2].alt).toBe("Architectural patterns");
  });

  it("preserves showCaptions through round-trip", () => {
    const original = `<!-- image-grid -->
<!-- captions:hidden -->

| &nbsp; | &nbsp; |
| --- | --- |
| ![A](${FLUID}) | ![B](${GLOSSY}) |`;

    const blocks = parseMarkdown(original);
    const serialized = serializeMarkdown(blocks);
    const parsed = parseMarkdown(serialized);
    const grid = parsed.find((b) => b.type === "image-grid");

    expect(grid).toBeDefined();
    expect(grid.props.showCaptions).toBe(false);
  });

  it("preserves captions visible by default through round-trip", () => {
    const original = `<!-- image-grid -->

| &nbsp; |
| --- |
| ![A](${FLUID}) |`;

    const blocks = parseMarkdown(original);
    const serialized = serializeMarkdown(blocks);

    expect(serialized).not.toContain("<!-- captions:hidden -->");

    const parsed = parseMarkdown(serialized);
    const grid = parsed.find((b) => b.type === "image-grid");
    expect(grid.props.showCaptions).toBe(true);
  });


  it("round-trips 5 images in 3 cols correctly", () => {
    const original = `<!-- image-grid -->

| &nbsp; | &nbsp; | &nbsp; |
| --- | --- | --- |
| ![a](${FLUID}) | ![b](${GLOSSY}) | ![c](${ARCH}) |
| ![d](${FLUID}) | ![e](${GLOSSY}) | |`;

    const blocks = parseMarkdown(original);
    const serialized = serializeMarkdown(blocks);
    const parsed = parseMarkdown(serialized);
    const grid = parsed.find((b) => b.type === "image-grid");

    expect(grid).toBeDefined();
    expect(grid.props.cols).toBe(3);
    expect(grid.props.images).toHaveLength(5);
  });

  it("round-trips multiple image grids in same document", () => {
    const original = `Some intro text.

<!-- image-grid -->

| &nbsp; |
| --- |
| ![First](${FLUID}) |

A paragraph between grids.

<!-- image-grid -->

| &nbsp; | &nbsp; |
| --- | --- |
| ![A](${GLOSSY}) | ![B](${ARCH}) |`;

    const blocks = parseMarkdown(original);
    const grids = blocks.filter((b) => b.type === "image-grid");

    expect(grids).toHaveLength(2);
    expect(grids[0].props.images).toHaveLength(1);
    expect(grids[0].props.cols).toBe(1);
    expect(grids[1].props.images).toHaveLength(2);
    expect(grids[1].props.cols).toBe(2);

    const serialized = serializeMarkdown(blocks);
    const reparsed = parseMarkdown(serialized);
    const reGrids = reparsed.filter((b) => b.type === "image-grid");

    expect(reGrids).toHaveLength(2);
    expect(reGrids[0].props.images).toHaveLength(1);
    expect(reGrids[1].props.images).toHaveLength(2);
  });
});
