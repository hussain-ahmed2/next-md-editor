import { describe, expect, it } from "vitest";
import { parseMarkdown, serializeMarkdown } from "../index";
import type { Block } from "@next-md-editor/types";

/**
 * Round-trip regressions.
 *
 * serialize → parse runs on real user paths: Source mode "Apply Changes",
 * export/re-import (ZIP or .md), and renaming a file between .md and .txt.
 * A block that does not survive it is silently destroyed, so each of these
 * guards a bug that previously ate user content.
 */

const roundTrip = (blocks: Block[]): Block[] => parseMarkdown(serializeMarkdown(blocks));

describe("collapsible blocks survive a round-trip", () => {
  it("keeps the summary, body and block type", () => {
    const input: Block[] = [
      {
        id: "c1",
        type: "collapsible",
        props: { summary: "Click to expand", content: "Hidden body text", open: false },
      },
    ];

    const out = roundTrip(input);

    // Previously this collapsed to a bare paragraph and the summary was lost:
    // <details> is a CommonMark HTML block that ends at the first blank line.
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe("collapsible");
    expect(out[0].props.summary).toBe("Click to expand");
    expect(String(out[0].props.content)).toContain("Hidden body text");
  });

  it("preserves the open state", () => {
    const out = roundTrip([
      { id: "c2", type: "collapsible", props: { summary: "S", content: "B", open: true } },
    ]);
    expect(out[0].type).toBe("collapsible");
    expect(out[0].props.open).toBe(true);
  });
});

describe("tech-stack names containing hyphens survive a round-trip", () => {
  it("keeps hyphenated entries alongside plain ones", () => {
    const input: Block[] = [
      {
        id: "t1",
        type: "tech-stack",
        props: {
          techs: [
            { id: "react", name: "React", color: "61DAFB", logo: "react" },
            { id: "objectivec", name: "Objective-C", color: "438EFF", logo: "c" },
          ],
          alignment: "left",
        },
      },
    ];

    const out = roundTrip(input);
    const names = (out[0]?.props.techs as { name: string }[] | undefined)?.map((t) => t.name);

    expect(out[0]?.type).toBe("tech-stack");
    expect(names).toContain("React");
    // The parser used to stop at the escaped hyphen and drop this entry.
    expect(names).toContain("Objective-C");
  });

  it("does not drop the whole block when every name is hyphenated", () => {
    const out = roundTrip([
      {
        id: "t2",
        type: "tech-stack",
        props: {
          techs: [{ id: "datefns", name: "date-fns", color: "770C56", logo: "javascript" }],
          alignment: "left",
        },
      },
    ]);

    expect(out[0]?.type).toBe("tech-stack");
    expect((out[0]?.props.techs as { name: string }[]).map((t) => t.name)).toEqual(["date-fns"]);
  });
});
