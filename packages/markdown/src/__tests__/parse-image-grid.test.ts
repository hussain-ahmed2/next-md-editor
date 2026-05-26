import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../index";

const FLUID =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop";
const GLOSSY =
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop";
const ARCH =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop";

function findImageGrid(blocks: any[]) {
  return blocks.find((b) => b.type === "image-grid");
}

describe("parseMarkdown — image grid", () => {
  it("parses a basic 3-col, 1-row image grid", () => {
    const md = `<!-- image-grid -->

| &nbsp; | &nbsp; | &nbsp; |
| --- | --- | --- |
| ![Fluid abstract shapes](${FLUID}) | ![Glossy 3D composition](${GLOSSY}) | ![Architectural patterns](${ARCH}) |`;

    const blocks = parseMarkdown(md);
    const grid = findImageGrid(blocks);

    expect(grid).toBeDefined();
    expect(grid.type).toBe("image-grid");
    expect(grid.props.cols).toBe(3);
    expect(grid.props.showCaptions).toBe(true);
    expect(grid.props.images).toHaveLength(3);
    expect(grid.props.images[0].url).toBe(FLUID);
    expect(grid.props.images[0].alt).toBe("Fluid abstract shapes");
    expect(grid.props.images[1].url).toBe(GLOSSY);
    expect(grid.props.images[1].alt).toBe("Glossy 3D composition");
    expect(grid.props.images[2].url).toBe(ARCH);
    expect(grid.props.images[2].alt).toBe("Architectural patterns");
  });

  it("respects <!-- captions:hidden -->", () => {
    const md = `<!-- image-grid -->
<!-- captions:hidden -->

| &nbsp; | &nbsp; |
| --- | --- |
| ![A](${FLUID}) | ![B](${GLOSSY}) |`;

    const blocks = parseMarkdown(md);
    const grid = findImageGrid(blocks);

    expect(grid).toBeDefined();
    expect(grid.props.showCaptions).toBe(false);
  });

  it("defaults showCaptions to true when no captions comment", () => {
    const md = `<!-- image-grid -->

| &nbsp; |
| --- |
| ![A](${FLUID}) |`;

    const blocks = parseMarkdown(md);
    const grid = findImageGrid(blocks);

    expect(grid).toBeDefined();
    expect(grid.props.showCaptions).toBe(true);
  });

  it("parses a 2-col grid with 4 images (2 rows)", () => {
    const md = `<!-- image-grid -->

| &nbsp; | &nbsp; |
| --- | --- |
| ![img1](${FLUID}) | ![img2](${GLOSSY}) |
| ![img3](${ARCH}) | ![img4](${FLUID}) |`;

    const blocks = parseMarkdown(md);
    const grid = findImageGrid(blocks);

    expect(grid).toBeDefined();
    expect(grid.props.cols).toBe(2);
    expect(grid.props.images).toHaveLength(4);
    expect(grid.props.images[0].alt).toBe("img1");
    expect(grid.props.images[1].alt).toBe("img2");
    expect(grid.props.images[2].alt).toBe("img3");
    expect(grid.props.images[3].alt).toBe("img4");
  });

  it("parses a 1-col grid", () => {
    const md = `<!-- image-grid -->

| &nbsp; |
| --- |
| ![Solo](${FLUID}) |`;

    const blocks = parseMarkdown(md);
    const grid = findImageGrid(blocks);

    expect(grid).toBeDefined();
    expect(grid.props.cols).toBe(1);
    expect(grid.props.images).toHaveLength(1);
    expect(grid.props.images[0].alt).toBe("Solo");
  });

  it("parses HTML <img> syntax in cells", () => {
    const md = `<!-- image-grid -->

| &nbsp; |
| --- |
| <img src="${FLUID}" alt="HTML img" /> |`;

    const blocks = parseMarkdown(md);
    const grid = findImageGrid(blocks);

    expect(grid).toBeDefined();
    expect(grid.props.images).toHaveLength(1);
    expect(grid.props.images[0].url).toBe(FLUID);
    expect(grid.props.images[0].alt).toBe("HTML img");
  });

  it("parses image grid with title and description", () => {
    const md = `<!-- image-grid -->
#### My Gallery
_Beautiful abstract art_

| &nbsp; | &nbsp; |
| --- | --- |
| ![A](${FLUID}) | ![B](${GLOSSY}) |`;

    const blocks = parseMarkdown(md);
    const grid = findImageGrid(blocks);

    expect(grid).toBeDefined();
    expect(grid.props.title).toBe("My Gallery");
    expect(grid.props.description).toBe("Beautiful abstract art");
    expect(grid.props.images).toHaveLength(2);
  });

  it("treats regular tables (no images) as table, not image-grid", () => {
    const md = `| Name | Age |
| --- | --- |
| Alice | 30 |
| Bob | 25 |`;

    const blocks = parseMarkdown(md);
    const grid = findImageGrid(blocks);
    const table = blocks.find((b) => b.type === "table");

    expect(grid).toBeUndefined();
    expect(table).toBeDefined();
    expect(table.type).toBe("table");
  });

  it("treats tables with mixed content (image + text) as table", () => {
    const md = `<!-- image-grid -->

| Image | Description |
| --- | --- |
| ![A](${FLUID}) | Some text |`;

    const blocks = parseMarkdown(md);
    const grid = findImageGrid(blocks);

    expect(grid).toBeUndefined();

    const table = blocks.find((b) => b.type === "table");
    expect(table).toBeDefined();
  });

  it("parses a grid with 5 images in 3 cols (partial last row)", () => {
    const md = `<!-- image-grid -->

| &nbsp; | &nbsp; | &nbsp; |
| --- | --- | --- |
| ![a](${FLUID}) | ![b](${GLOSSY}) | ![c](${ARCH}) |
| ![d](${FLUID}) | ![e](${GLOSSY}) | |`;

    const blocks = parseMarkdown(md);
    const grid = findImageGrid(blocks);

    expect(grid).toBeDefined();
    expect(grid.props.cols).toBe(3);
    expect(grid.props.images).toHaveLength(5);
  });
});
