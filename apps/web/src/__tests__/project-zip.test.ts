import { describe, expect, it } from "vitest";
import type { FileNode } from "@next-md-editor/types";
import { makeNode } from "@/lib/workspace-storage";
import {
  collectZipEntries,
  createZip,
  extractZip,
  sanitizeZipPath,
} from "@/lib/project-zip";

function nodeMap(...nodes: FileNode[]): Record<string, FileNode> {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

describe("sanitizeZipPath", () => {
  it("normalizes separators and strips empties", () => {
    expect(sanitizeZipPath("docs\\intro.md")).toBe("docs/intro.md");
    expect(sanitizeZipPath("/leading/slash.md")).toBe("leading/slash.md");
    expect(sanitizeZipPath("a//b.md")).toBe("a/b.md");
  });

  it("rejects traversal, directories, and invalid names", () => {
    expect(sanitizeZipPath("../evil.md")).toBeNull();
    expect(sanitizeZipPath("a/../evil.md")).toBeNull();
    expect(sanitizeZipPath("docs/")).toBeNull();
    expect(sanitizeZipPath("bad|name.md")).toBeNull();
  });
});

describe("zip round-trip", () => {
  it("collects tree paths and survives zip → unzip intact", () => {
    const docs = makeNode("docs", "folder", null);
    const readme = makeNode("README.md", "file", null);
    const intro = makeNode("intro.md", "file", docs.id);
    const config = makeNode("config.json", "file", docs.id);
    const nodes = nodeMap(docs, readme, intro, config);

    const texts: Record<string, string> = {
      [readme.id]: "# Hello\n\nWorld — with unicode ✓ and emoji 🎉\n",
      [intro.id]: "## Intro\n",
      [config.id]: '{ "a": 1 }\n',
    };

    const entries = collectZipEntries(nodes, (n) => texts[n.id] ?? "");
    expect(entries.map((e) => e.path)).toEqual([
      "docs/config.json",
      "docs/intro.md",
      "README.md",
    ]);

    const zipped = createZip(entries);
    const extracted = extractZip(zipped);
    expect(extracted).toEqual(entries);
  });

  it("skips binary entries on extract", () => {
    const zipped = createZip([{ path: "ok.md", text: "fine" }]);
    // Craft a zip containing a NUL-byte file via createZip on a string with NUL
    const withBinary = createZip([
      { path: "ok.md", text: "fine" },
      { path: "bin.dat", text: "abc\0def" },
    ]);
    expect(extractZip(zipped).map((e) => e.path)).toEqual(["ok.md"]);
    expect(extractZip(withBinary).map((e) => e.path)).toEqual(["ok.md"]);
  });
});
