import { beforeEach, describe, expect, it } from "vitest";
import type { Block } from "@next-md-editor/types";
import { useWorkspaceStore } from "@/store/workspaceStore";
import {
  buildNodePath,
  loadFileContent,
  saveFileContent,
  sortedChildren,
} from "@/lib/workspace-storage";

/**
 * End-user journey tests.
 *
 * These drive the real workspace store and persistence layer through the
 * sequences an actual person performs — create, type, switch, rename,
 * duplicate, delete, import — rather than testing helpers in isolation.
 * The two worst bugs shipped in this project (source-mode overwriting the
 * wrong file, and content vanishing on a .md/.txt rename) were journey
 * bugs: every individual function worked.
 */

// Minimal in-memory localStorage so the store's default storage works.
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  get length() {
    return this.data.size;
  }
}

const store = () => useWorkspaceStore.getState();

const para = (text: string): Block[] => [
  { id: `p-${text}`, type: "paragraph", props: { content: `<p>${text}</p>` } },
];

/** Simulates the persistence hook writing the active file's content. */
function typeInto(fileId: string, text: string) {
  saveFileContent(fileId, { format: "blocks", blocks: para(text) });
}

function textOf(fileId: string): string {
  const content = loadFileContent(fileId);
  if (!content || content.format !== "blocks") return "";
  return String(content.blocks[0]?.props.content ?? "");
}

beforeEach(() => {
  const storage = new MemoryStorage();
  const g = globalThis as { localStorage?: unknown; window?: unknown };
  g.localStorage = storage;
  // workspace-storage reads `window.localStorage`
  g.window = { localStorage: storage };
  useWorkspaceStore.setState({
    version: 1,
    nodes: {},
    openTabIds: [],
    activeFileId: null,
    expandedFolderIds: [],
    initialized: false,
    dirtyFileIds: [],
    renamingNodeId: null,
    creatingIntent: null,
  });
  store().init();
});

describe("first run", () => {
  it("gives a new user a README.md that is immediately usable", () => {
    const nodes = Object.values(store().nodes);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].name).toBe("README.md");

    // Open in a tab and active, so the editor has something to show.
    expect(store().activeFileId).toBe(nodes[0].id);
    expect(store().openTabIds).toEqual([nodes[0].id]);

    // Content is seeded, so export/print work before the first keystroke.
    expect(loadFileContent(nodes[0].id)).not.toBeNull();
  });
});

describe("working across multiple files", () => {
  it("keeps each file's content separate when switching tabs", () => {
    const readmeId = store().activeFileId!;
    typeInto(readmeId, "readme content");

    const notesId = store().createFile(null, "NOTES.md")!;
    typeInto(notesId, "notes content");

    // Switch back and forth the way a user clicking tabs would.
    store().openFile(readmeId);
    expect(store().activeFileId).toBe(readmeId);
    store().openFile(notesId);
    expect(store().activeFileId).toBe(notesId);

    expect(textOf(readmeId)).toContain("readme content");
    expect(textOf(notesId)).toContain("notes content");
  });

  it("closing a tab keeps the file and picks another tab", () => {
    const readmeId = store().activeFileId!;
    const notesId = store().createFile(null, "NOTES.md")!;
    typeInto(notesId, "still here");

    store().closeTab(notesId);

    expect(store().openTabIds).not.toContain(notesId);
    expect(store().activeFileId).toBe(readmeId);
    // Closing a tab must never delete content.
    expect(textOf(notesId)).toContain("still here");
    expect(store().nodes[notesId]).toBeDefined();
  });
});

describe("organising files", () => {
  it("supports create folder, move file in, and path reflects it", () => {
    const docsId = store().createFolder(null, "docs")!;
    const guideId = store().createFile(null, "guide.md")!;
    typeInto(guideId, "guide body");

    expect(store().moveNode(guideId, docsId)).toBe(true);

    expect(buildNodePath(store().nodes, guideId)).toBe("docs/guide.md");
    expect(textOf(guideId)).toContain("guide body");
  });

  it("refuses to move a folder into its own descendant", () => {
    const outer = store().createFolder(null, "outer")!;
    const inner = store().createFolder(outer, "inner")!;

    expect(store().moveNode(outer, inner)).toBe(false);
    expect(store().nodes[outer].parentId).toBeNull();
  });

  it("deleting a folder removes its descendants and their content", () => {
    const docsId = store().createFolder(null, "docs")!;
    const childId = store().createFile(docsId, "child.md")!;
    typeInto(childId, "child body");

    store().deleteNode(docsId);

    expect(store().nodes[docsId]).toBeUndefined();
    expect(store().nodes[childId]).toBeUndefined();
    expect(loadFileContent(childId)).toBeNull();
    // The deleted file must not linger as an open tab.
    expect(store().openTabIds).not.toContain(childId);
  });

  it("deleting the active file falls back to another open file", () => {
    const readmeId = store().activeFileId!;
    const tempId = store().createFile(null, "temp.md")!;
    expect(store().activeFileId).toBe(tempId);

    store().deleteNode(tempId);

    expect(store().activeFileId).toBe(readmeId);
    expect(store().nodes[readmeId]).toBeDefined();
  });

  it("avoids name collisions instead of overwriting", () => {
    store().createFile(null, "dup.md");
    store().createFile(null, "dup.md");

    const names = sortedChildren(store().nodes, null).map((n) => n.name);
    expect(names).toContain("dup.md");
    expect(names).toContain("dup (2).md");
  });

  it("duplicating a file copies its content, not just the name", () => {
    const srcId = store().createFile(null, "src.md")!;
    typeInto(srcId, "original body");

    const copyId = store().duplicateFile(srcId)!;

    expect(copyId).not.toBe(srcId);
    expect(textOf(copyId)).toContain("original body");
    // Editing the copy must not touch the original.
    typeInto(copyId, "changed copy");
    expect(textOf(srcId)).toContain("original body");
  });
});

describe("renaming", () => {
  it("keeps content when renaming within markdown", () => {
    const id = store().createFile(null, "old.md")!;
    typeInto(id, "keep me");

    expect(store().renameNode(id, "new.md")).toBe(true);

    expect(store().nodes[id].name).toBe("new.md");
    expect(textOf(id)).toContain("keep me");
  });

  it("rejects invalid names rather than corrupting the tree", () => {
    const id = store().createFile(null, "valid.md")!;
    expect(store().renameNode(id, "")).toBe(false);
    expect(store().renameNode(id, "bad/name.md")).toBe(false);
    expect(store().nodes[id].name).toBe("valid.md");
  });
});

describe("importing a project", () => {
  it("nests imported files under one folder without touching existing files", () => {
    const readmeId = store().activeFileId!;
    typeInto(readmeId, "my existing work");

    store().importProject("bundle", [
      { path: "docs/intro.md", content: { format: "blocks", blocks: para("intro") } },
      { path: "docs/api.md", content: { format: "blocks", blocks: para("api") } },
      { path: "top.md", content: { format: "blocks", blocks: para("top") } },
    ]);

    const paths = Object.values(store().nodes)
      .filter((n) => n.kind === "file")
      .map((n) => buildNodePath(store().nodes, n.id));

    expect(paths).toContain("bundle/docs/intro.md");
    expect(paths).toContain("bundle/docs/api.md");
    expect(paths).toContain("bundle/top.md");
    // Pre-existing work is untouched.
    expect(textOf(readmeId)).toContain("my existing work");
  });
});
