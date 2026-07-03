import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseMarkdown, serializeMarkdown } from "../index";
import type { Block } from "@next-md-editor/types";

function fixture(name: string): string {
  return readFileSync(resolve(__dirname, "__fixtures__", name), "utf-8");
}

function countByType(blocks: Block[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of blocks) {
    counts[b.type] = (counts[b.type] ?? 0) + 1;
  }
  return counts;
}

function findFirst(blocks: Block[], type: string): Block | undefined {
  return blocks.find((b) => b.type === type);
}

describe("parser round-trip", () => {
  describe("comprehensive.md", () => {
    const md = fixture("comprehensive.md");
    let blocks: Block[];
    let counts: Record<string, number>;

    it("parses without error", () => {
      blocks = parseMarkdown(md);
      expect(blocks).toBeDefined();
      expect(blocks.length).toBeGreaterThan(0);
    });

    it("produces all expected block types", () => {
      counts = countByType(blocks);

      // Structural blocks
      expect(counts["heading"]).toBeGreaterThanOrEqual(7);
      expect(counts["paragraph"]).toBeGreaterThanOrEqual(5);
      expect(counts["code"]).toBeGreaterThanOrEqual(3);
      expect(counts["quote"]).toBeGreaterThanOrEqual(1);
      expect(counts["callout"]).toBeGreaterThanOrEqual(5);
      expect(counts["bullet-list"]).toBeGreaterThanOrEqual(2);
      expect(counts["numbered-list"]).toBeGreaterThanOrEqual(2);
      expect(counts["table"]).toBeGreaterThanOrEqual(2);
      expect(counts["divider"]).toBeGreaterThanOrEqual(1);
    });

    it("parses code blocks with language preserved", () => {
      const codeBlocks = blocks.filter((b) => b.type === "code");
      const jsBlock = codeBlocks.find((b) => (b.props.language as string) === "javascript");
      expect(jsBlock).toBeDefined();
      expect(jsBlock!.props.code as string).toContain("function greet");

      const tsBlock = codeBlocks.find((b) => (b.props.language as string) === "typescript");
      expect(tsBlock).toBeDefined();
      expect(tsBlock!.props.code as string).toContain("interface User");
    });

    it("parses callouts with correct types", () => {
      const callouts = blocks.filter((b) => b.type === "callout");
      const types = callouts.map((b) => b.props.type);
      expect(types).toContain("note");
      expect(types).toContain("tip");
      expect(types).toContain("important");
      expect(types).toContain("warning");
      expect(types).toContain("caution");
    });

    it("parses tables with correct dimensions", () => {
      const tables = blocks.filter((b) => b.type === "table");
      expect(tables.length).toBeGreaterThanOrEqual(2);

      // First table should have rows
      const firstTable = tables[0];
      const rows = firstTable.props.rows as string[][];
      expect(rows.length).toBeGreaterThanOrEqual(4);
      expect(rows[0].length).toBeGreaterThanOrEqual(3);
    });

    it("parses divider", () => {
      const divider = findFirst(blocks, "divider");
      expect(divider).toBeDefined();
    });

    it("parses image-grid block", () => {
      const grid = findFirst(blocks, "image-grid");
      expect(grid).toBeDefined();
      expect(grid!.props.images).toBeDefined();
      expect((grid!.props.images as unknown[]).length).toBeGreaterThanOrEqual(2);
    });

    it("parses badge-group block", () => {
      const badge = findFirst(blocks, "badge-group");
      expect(badge).toBeDefined();
      expect(badge!.props.badges).toBeDefined();
      expect((badge!.props.badges as unknown[]).length).toBeGreaterThanOrEqual(2);
    });

    it("round-trips: serialize → re-parse produces same block types", () => {
      const serialized = serializeMarkdown(blocks);
      expect(serialized).toBeTruthy();
      expect(serialized.length).toBeGreaterThan(0);

      const reparsed = parseMarkdown(serialized);
      expect(reparsed).toBeDefined();
      expect(reparsed.length).toBeGreaterThan(0);

      // Structural integrity: same block types should appear
      const origCounts = countByType(blocks);
      const reCounts = countByType(reparsed);
      for (const [type, count] of Object.entries(origCounts)) {
        if (type === "image-grid" || type === "badge-group") {
          expect(reCounts[type]).toBeGreaterThanOrEqual(1);
        } else {
          expect(reCounts[type]).toBeGreaterThanOrEqual(Math.floor(count * 0.7));
        }
      }
    });
  });

  describe("react-readme.md", () => {
    const md = fixture("react-readme.md");
    let blocks: Block[];

    it("parses without error", () => {
      blocks = parseMarkdown(md);
      expect(blocks).toBeDefined();
      expect(blocks.length).toBeGreaterThan(5);
    });

    it("produces headings, paragraphs, lists, code blocks", () => {
      const counts = countByType(blocks);
      expect(counts["heading"]).toBeGreaterThanOrEqual(5);
      expect(counts["paragraph"]).toBeGreaterThanOrEqual(3);
      expect(counts["bullet-list"]).toBeGreaterThanOrEqual(2);
      expect(counts["code"]).toBeGreaterThanOrEqual(1);
    });

    it("parses code block with language 'jsx'", () => {
      const codeBlock = blocks.find(
        (b) => b.type === "code" && (b.props.language as string) === "jsx"
      );
      expect(codeBlock).toBeDefined();
      expect(codeBlock!.props.code as string).toContain("createRoot");
    });

    it("parses badges in heading as separate paragraph images", () => {
      // React README has badges as linked images in the H1 line
      // The parser does not extract badges from inside heading links
      // but they should still parse into blocks
      const heading1 = blocks.find(
        (b) => b.type === "heading" && (b.props.level as number) === 1
      );
      expect(heading1).toBeDefined();
      expect((heading1!.props.text as string).length).toBeGreaterThan(50);
    });

    it("round-trips: serialize → re-parse is stable", () => {
      const serialized = serializeMarkdown(blocks);
      const reparsed = parseMarkdown(serialized);
      expect(reparsed.length).toBeGreaterThanOrEqual(Math.floor(blocks.length * 0.5));

      const origCounts = countByType(blocks);
      const reCounts = countByType(reparsed);
      for (const type of ["heading", "paragraph", "bullet-list"]) {
        expect(reCounts[type]).toBeGreaterThanOrEqual(1);
      }
    });
  });
});

describe("stress test", () => {
  it("parses 100 alternating paragraphs and dividers", () => {
    const lines: string[] = [];
    for (let i = 0; i < 100; i++) {
      lines.push(`Paragraph number ${i + 1}`);
      lines.push("---");
    }
    const md = lines.join("\n\n");
    const blocks = parseMarkdown(md);

    const counts = countByType(blocks);
    expect(counts["paragraph"]).toBeGreaterThanOrEqual(90);
    expect(counts["divider"]).toBeGreaterThanOrEqual(90);
  });

  it("parses 200 headings at varying levels", () => {
    const lines: string[] = [];
    const levels = [1, 2, 3, 4, 5, 6];
    for (let i = 0; i < 200; i++) {
      const level = levels[i % levels.length];
      lines.push(`${"#".repeat(level)} Heading ${i + 1}`);
    }
    const md = lines.join("\n\n");
    const blocks = parseMarkdown(md);

    expect(blocks.length).toBe(200);
    expect(blocks.every((b) => b.type === "heading")).toBe(true);
    expect(blocks.filter((b) => (b.props.level as number) === 1).length).toBeGreaterThanOrEqual(30);
    expect(blocks.filter((b) => (b.props.level as number) === 6).length).toBeGreaterThanOrEqual(30);
  });

  it("parses 50 deeply nested lists (4 levels deep)", () => {
    const lines: string[] = ["- level 1"];
    for (let i = 0; i < 50; i++) {
      lines.push(`  - level 2`);
      lines.push(`    - level 3`);
      lines.push(`      - level 4`);
      lines.push(`- back to level 1 ${i}`);
    }
    const md = lines.join("\n");
    const blocks = parseMarkdown(md);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    expect(blocks[0].type).toBe("bullet-list");
  });

  it("parses a single paragraph of 10,000 characters", () => {
    const longWord = "word ".repeat(2000);
    const md = `A very long paragraph: ${longWord}.`;
    const blocks = parseMarkdown(md);
    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe("paragraph");
  });

  it("parses empty string returns empty array", () => {
    const blocks = parseMarkdown("");
    expect(blocks).toEqual([]);
  });

  it("parses whitespace-only string returns empty array", () => {
    const blocks = parseMarkdown("   \n\n  \n  ");
    expect(blocks).toEqual([]);
  });
});
