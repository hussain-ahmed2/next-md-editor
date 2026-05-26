export const DEMO_MARKDOWN = `# ⚡ Next MD Editor - Ultimate Demo

Welcome to your next-generation, block-based markdown editor workspace. Designed for ultimate speed, visual excellence, and complete GFM compatibility.

---

> [!TIP]
> Use the left handle to drag and drop elements. Try selecting multiple blocks by holding **Shift** to perform bulk moves or bulk deletes!

---

### 🚀 Key Editor Features

* **Slash Commands Palette:** Press \`/\` inside a paragraph to trigger inline transformation controls.
* **Smart Keyboard Indentation:** Use \`Tab\` to indent lists or \`Shift+Tab\` to outdent them instantly.
* **Interactive Resizable Layouts:** Click and drag the left palette border or right preview border to resize sidebars to your liking.

---

### 🔢 List Formatting & Cycling Markers

1. Decimal list marker for root elements (e.g. \`1.\`, \`2.\`)
    1. Roman numeral marker for level 1 indentation (e.g. \`i.\`, \`ii.\`)
        1. Alphabetical marker for level 2 indentation (e.g. \`a.\`, \`b.\`)

---

### 🛠️ Developer Code Editor

\`\`\`ts
// High-performance tokenization pipeline
export function highlightCode(code: string, lang: string): string {
  const safe = escapeHtml(code);
  const stashed = stashComments(safe);
  return restoreTokens(applyRegex(stashed, lang));
}
\`\`\`

---

### 🌟 Design Grid Assets
_A showcase of visual abstract card grids inside a responsive 3-column container._

| | | |
|---|---|---|
| ![Fluid abstract shapes](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop) | ![Glossy 3D composition](https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop) | ![Architectural patterns](https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop) |
`;
