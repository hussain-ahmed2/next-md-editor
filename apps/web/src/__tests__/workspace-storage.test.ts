import { describe, expect, it } from "vitest";
import type { Block, FileNode } from "@next-md-editor/types";
import {
  LEGACY_BLOCKS_KEY,
  WORKSPACE_KEY,
  buildNodePath,
  collectDescendantIds,
  fileKey,
  getFileFormat,
  isDescendantOf,
  isValidNodeName,
  loadFileContent,
  loadOrCreateWorkspace,
  loadWorkspaceMeta,
  makeNode,
  saveFileContent,
  sortedChildren,
  uniqueSiblingName,
  type KVStorage,
} from "@/lib/workspace-storage";

function memoryStorage(): KVStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

function nodeMap(...nodes: FileNode[]): Record<string, FileNode> {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

describe("file name helpers", () => {
  it("derives format from extension", () => {
    expect(getFileFormat("README.md")).toBe("blocks");
    expect(getFileFormat("notes.markdown")).toBe("blocks");
    expect(getFileFormat("data.json")).toBe("text");
    expect(getFileFormat("LICENSE")).toBe("text");
  });

  it("validates node names", () => {
    expect(isValidNodeName("README.md")).toBe(true);
    expect(isValidNodeName("  ")).toBe(false);
    expect(isValidNodeName("a/b.md")).toBe(false);
    expect(isValidNodeName('bad"name')).toBe(false);
  });

  it("generates unique sibling names", () => {
    const a = makeNode("README.md", "file", null);
    const nodes = nodeMap(a);
    expect(uniqueSiblingName(nodes, null, "README.md")).toBe("README (2).md");
    expect(uniqueSiblingName(nodes, null, "other.md")).toBe("other.md");
    // Different parent — no conflict
    expect(uniqueSiblingName(nodes, "some-folder", "README.md")).toBe("README.md");
  });
});

describe("tree helpers", () => {
  it("collects descendants transitively and detects ancestry", () => {
    const root = makeNode("docs", "folder", null);
    const sub = makeNode("guides", "folder", root.id);
    const file = makeNode("intro.md", "file", sub.id);
    const stray = makeNode("other.md", "file", null);
    const nodes = nodeMap(root, sub, file, stray);

    expect(collectDescendantIds(nodes, root.id).sort()).toEqual([sub.id, file.id].sort());
    expect(isDescendantOf(nodes, file.id, root.id)).toBe(true);
    expect(isDescendantOf(nodes, stray.id, root.id)).toBe(false);
    expect(isDescendantOf(nodes, root.id, file.id)).toBe(false);
  });

  it("builds repo-style paths", () => {
    const root = makeNode("docs", "folder", null);
    const file = makeNode("intro.md", "file", root.id);
    const nodes = nodeMap(root, file);
    expect(buildNodePath(nodes, file.id)).toBe("docs/intro.md");
  });

  it("sorts folders first, then case-insensitively by name", () => {
    const zebra = makeNode("zebra.md", "file", null);
    const apple = makeNode("Apple.md", "file", null);
    const folder = makeNode("src", "folder", null);
    const nodes = nodeMap(zebra, apple, folder);
    expect(sortedChildren(nodes, null).map((n) => n.name)).toEqual([
      "src",
      "Apple.md",
      "zebra.md",
    ]);
  });
});

describe("file content persistence", () => {
  it("round-trips blocks and text content", () => {
    const storage = memoryStorage();
    const blocks: Block[] = [{ id: "1", type: "paragraph", props: { content: "<p>hello</p>" } }];
    saveFileContent("f1", { format: "blocks", blocks }, storage);
    saveFileContent("f2", { format: "text", text: "plain" }, storage);

    expect(loadFileContent("f1", storage)).toEqual({ format: "blocks", blocks });
    expect(loadFileContent("f2", storage)).toEqual({ format: "text", text: "plain" });
    expect(loadFileContent("missing", storage)).toBeNull();
  });

  it("rejects malformed stored content", () => {
    const storage = memoryStorage();
    storage.setItem(fileKey("bad"), "{not json");
    expect(loadFileContent("bad", storage)).toBeNull();
    storage.setItem(fileKey("wrong"), JSON.stringify({ format: "blocks", blocks: "nope" }));
    expect(loadFileContent("wrong", storage)).toBeNull();
  });
});

describe("workspace bootstrap & migration", () => {
  it("creates a default workspace with README.md when storage is empty", () => {
    const storage = memoryStorage();
    const meta = loadOrCreateWorkspace(storage);

    const nodes = Object.values(meta.nodes);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].name).toBe("README.md");
    expect(meta.activeFileId).toBe(nodes[0].id);
    expect(meta.openTabIds).toEqual([nodes[0].id]);
    // Persisted
    expect(loadWorkspaceMeta(storage)).toEqual(meta);
  });

  it("migrates the legacy single-document key into README.md", () => {
    const storage = memoryStorage();
    const legacyBlocks: Block[] = [
      { id: "a", type: "heading", props: { level: 1, content: "<h1>Hi</h1>" } },
    ];
    storage.setItem(LEGACY_BLOCKS_KEY, JSON.stringify(legacyBlocks));

    const meta = loadOrCreateWorkspace(storage);
    const readme = Object.values(meta.nodes)[0];

    expect(readme.name).toBe("README.md");
    expect(loadFileContent(readme.id, storage)).toEqual({
      format: "blocks",
      blocks: legacyBlocks,
    });
    // Legacy key renamed to .bak, not silently deleted
    expect(storage.getItem(LEGACY_BLOCKS_KEY)).toBeNull();
    expect(storage.getItem(`${LEGACY_BLOCKS_KEY}.bak`)).toBe(JSON.stringify(legacyBlocks));
  });

  it("returns the existing workspace untouched on subsequent loads", () => {
    const storage = memoryStorage();
    const first = loadOrCreateWorkspace(storage);
    const second = loadOrCreateWorkspace(storage);
    expect(second).toEqual(first);
  });

  it("ignores a corrupt workspace key and rebuilds", () => {
    const storage = memoryStorage();
    storage.setItem(WORKSPACE_KEY, "{broken");
    const meta = loadOrCreateWorkspace(storage);
    expect(Object.values(meta.nodes)[0]?.name).toBe("README.md");
  });
});
