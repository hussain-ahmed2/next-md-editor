import { describe, expect, it } from "vitest";
import { serializeMarkdown } from "../index";
import type { Block } from "@next-md-editor/types";

/**
 * `serializeBlock` caches per block object (blocks are immutable, so identity
 * is a safe key). These tests guard the two ways that cache could silently
 * return wrong markdown.
 */

const para = (id: string, text: string): Block => ({
  id,
  type: "paragraph",
  props: { content: `<p>${text}</p>` },
});

describe("serializer cache correctness", () => {
  it("reflects edits (a replaced block object is not served from cache)", () => {
    const a = para("a", "first");
    const b = para("b", "second");

    expect(serializeMarkdown([a, b])).toContain("first");

    // The store replaces the edited block with a NEW object.
    const edited = para("a", "edited");
    const out = serializeMarkdown([edited, b]);

    expect(out).toContain("edited");
    expect(out).not.toContain("first");
  });

  it("is stable across repeated calls with the same objects", () => {
    const blocks = [para("a", "one"), para("b", "two")];
    expect(serializeMarkdown(blocks)).toBe(serializeMarkdown(blocks));
  });

  it("recomputes when a custom serializer is registered later", () => {
    // Mirrors the real hazard: the preview can serialize before
    // initRegistry() runs, so an entry cached with NO custom serializer must
    // not be reused once one exists.
    const block: Block = { id: "x", type: "ai-content", props: { markdown: "# hi" } };

    const withoutRegistry = serializeMarkdown([block]);
    const withRegistry = serializeMarkdown([block], (type) =>
      type === "ai-content" ? () => "CUSTOM OUTPUT" : undefined,
    );

    expect(withRegistry).toBe("CUSTOM OUTPUT");
    expect(withRegistry).not.toBe(withoutRegistry);

    // ...and back again when the lookup no longer provides one.
    expect(serializeMarkdown([block])).toBe(withoutRegistry);
  });

  it("does not reuse a parent's cache entry at a different indent level", () => {
    // Nested list children serialize with indentLevel + 1; the same block
    // object rendered at a different depth must not reuse the shallow value.
    const child = para("c", "child text");
    const nested: Block = {
      id: "list",
      type: "bullet-list",
      props: { items: [] },
      children: [child],
    };

    const topLevel = serializeMarkdown([child]);
    const asChild = serializeMarkdown([nested]);

    expect(topLevel).toContain("child text");
    expect(asChild).toContain("child text");
    // Re-serializing the child on its own must still give the top-level form.
    expect(serializeMarkdown([child])).toBe(topLevel);
  });
});
