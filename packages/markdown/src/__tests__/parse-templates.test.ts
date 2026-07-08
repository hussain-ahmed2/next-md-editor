import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../index";

// Because we can't easily import from apps/web in tests without configuring aliases, 
// let's just copy the parts of the DEMO and API_DOC we care about to test them.
const DEMO_MD = `# ⚡ Next MD Editor - Ultimate Demo

Welcome to your next-generation, block-based markdown editor workspace. Designed for ultimate speed, visual excellence, and complete GFM compatibility.

---

> [!TIP]
> Use the left handle to drag and drop elements. Try selecting multiple blocks by holding **Shift** to perform bulk moves or bulk deletes!

---

### 🚀 Key Editor Features

* **Slash Commands Palette:** Press \`/\` inside a paragraph to trigger inline transformation controls.
* **Smart Keyboard Indentation:** Use \`Tab\` to indent lists or \`Shift+Tab\` to outdent them instantly.
* **Interactive Resizable Layouts:** Click and drag the left palette border or right preview border to resize sidebars to your liking.
`;

const API_DOC_MD = `# API Reference

### POST /users

Creates a new user.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | \`string\` | Yes | User's full name |
| email | \`string\` | Yes | User's email address |
| role | \`string\` | No | User role (default: "member") |
`;

describe("Demo and API templates parsing", () => {
  it("parses the demo template correctly", () => {
    const blocks = parseMarkdown(DEMO_MD);
    
    // Should have parsed blocks
    expect(blocks.length).toBeGreaterThan(0);
    
    // First block should be a heading
    expect(blocks[0].type).toBe("heading");
    expect(blocks[0].props.text).toBe("⚡ Next MD Editor - Ultimate Demo");
    expect(blocks[0].props.level).toBe(1);

    // Second block is a paragraph
    expect(blocks[1].type).toBe("paragraph");

    // Check for the callout
    const callout = blocks.find((b) => b.type === "callout");
    expect(callout).toBeDefined();
    expect(callout?.props.type).toBe("tip");
    
    // Check for the list
    const list = blocks.find((b) => b.type === "bullet-list");
    expect(list).toBeDefined();
    
    // For parsed lists from markdown, it uses props.html
    expect(list?.props.html).toContain("<ul");
    expect(list?.props.html).toContain("<li");
  });

  it("parses the api doc template correctly", () => {
    const blocks = parseMarkdown(API_DOC_MD);
    
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].type).toBe("heading");
    
    // Check for the table
    const table = blocks.find((b) => b.type === "table");
    expect(table).toBeDefined();
    expect(table?.props.rows).toBeDefined();
    expect((table?.props.rows as any[])[0][0]).toBe("Field");
  });
});
