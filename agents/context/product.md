# Product: next-md-editor

A professional-grade, block-based visual markdown editor with pixel-perfect GitHub Dark theme.

**Author:** Hussain Ahmed ([@hussain-ahmed2](https://github.com/hussain-ahmed2))
**License:** MIT

---

## Vision

Make markdown editing as intuitive as Notion, while producing clean GFM markdown that works everywhere (GitHub, docs sites, static sites). Headless architecture so other apps can consume the editor packages independently.

---

## Features

### Core Editing
- **Block-based editing** — each markdown element is a draggable, editable block
- **Drag & drop** — reorder blocks via `@dnd-kit` with dedicated `DragOverlay` preserving block shape
- **Slash commands** — type `/` in an empty paragraph to open block-type menu (keyboard navigable)
- **Multi-block selection** — `Shift+Click` or `Shift+ArrowUp/Down` for bulk operations (reorder, delete)
- **Floating format toolbar** — appears on text selection for bold/italic/code/strikethrough/link
- **Undo/Redo** — 100-level history via zundo temporal store (Ctrl+Z/Y)

### Blocks
| Block | Details |
|-------|---------|
| Heading | H1-H6, selected via dropdown in the block UI |
| Paragraph | Rich text with bold, italic, code, strikethrough, links. Keyboard shortcuts: Ctrl+B/I/K |
| Code Block | Syntax-highlighted (`highlight.js`), language selector, textarea overlay for editing |
| Blockquote | Vertical bar styling, plain text |
| Callout | GitHub-flavored alerts: Note, Tip, Important, Warning, Caution |
| Divider | Horizontal rule (`---`) |
| Image | URL + alt text input, rendered preview |
| Image Grid | 1-8 column visual grid, canvas title/description, caption toggles, add/delete/edit images |
| Table | Editable cells, add/delete rows & columns, zebra striping |
| Bullet List | Nested lists with Tab/Shift+Tab indent/outdent |
| Numbered List | Nested lists with auto-renumbering (1., i., a.) |

### Preview & Export
- **Live Markdown Preview** — renders via `react-markdown` with `remark-gfm`
- **Resizable sidebars** — drag-to-resize, double-click to collapse
- **Source editor** — raw markdown textarea with apply button
- **Import `.md` files** — upload and parse
- **Copy to clipboard** — clean GFM output
- **Download** — export as `.md` file
- **Demo content** — loads comprehensive GFM example on page load

### Syntax Highlighting
- Custom late-binding tokenizer in `highlighter.ts`
- Languages: TypeScript, JavaScript, CSS, HTML, Bash, JSON, Python, Rust
- Pure alphabetical-index parser (immune to regex leakage)
- Exact GitHub Dark theme color tokens

### Mobile
- Bottom tab bar (edit/preview/source)
- Responsive layout adjustments

---

## Target Users

- Developers writing documentation, blog posts, READMEs
- Teams wanting a WYSIWYG markdown experience
- Projects that need a headless markdown editor as a dependency

---

## Architecture Philosophy

- **JSON blocks are source of truth** — markdown is generated output
- **Headless by design** — `@next-md-editor/editor-core` and `@next-md-editor/markdown` have no UI dependency
- **Composable blocks** — each block registers itself; adding a new type doesn't require changing core code
- **Clean output** — serialized markdown should be spec-compliant GFM

---

## Roadmap / Planned

- `@next-md-editor/ui` — shared UI components
- `@next-md-editor/themes` — multiple theme support
- `@next-md-editor/mdx` — MDX support
- `@next-md-editor/blocks` — third-party block plugins
- `@next-md-editor/editor-react` — drop-in React editor component
