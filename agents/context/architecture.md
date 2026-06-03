# Architecture

## Monorepo Layout

Turborepo workspace with npm workspaces (`apps/*`, `packages/*`).

### Package Dependency Graph

```
                    ┌─────────────────────┐
                    │     apps/web         │
                    │  (Next.js 16, R19)   │
                    └──┬─────────────┬─────┘
                       │             │
          ┌────────────▼──┐   ┌──────▼──────────┐
          │ editor-core   │   │    markdown      │
          │ (zustand,     │   │ (unified, remark,│
          │  zundo, zod)  │   │  rehype, uuid)   │
          └────────┬──────┘   └────────┬─────────┘
                   │                   │
                   └──────┬────────────┘
                          │
                  ┌───────▼────────┐
                  │     types      │
                  │ (interfaces)   │
                  └────────────────┘
```

### Stub packages (no source yet)
- `ui`, `themes`, `mdx`, `blocks`, `editor-react`

---

## Data Flow

### Parsing (Markdown → Blocks)

```
Markdown string
  → unified() + remarkParse + remarkGfm
  → mdast (AST)
  → nodeToBlock() per child
  → Block[] (flat list with optional children[])
  → Zustand editor store
```

### Serialization (Blocks → Markdown)

```
Block[] from store
  → serializeBlock() per block (switch on type)
  → collect lines with indentation
  → join with \n\n
  → clean Markdown string
```

### Rendering (Blocks → DOM)

```
Zustand store (blocks[])
  → EditorCanvas maps over blocks[]
  → SortableBlock (dnd-kit wrapper)
  → BlockRenderer (looks up BlockRegistry)
  → Specific component (HeadingBlock, ParagraphBlock, etc.)
```

---

## Key Patterns

### Block Registry (Singleton)

- `BlockRegistry` class in `editor-core/src/registry/BlockRegistry.ts`
- Singleton instance exported as `BlockRegistry`
- Methods: `register(BlockDefinition)`, `get(type)`, `getAll()`, `has(type)`
- Registration happens in `apps/web/src/registry/index.ts` at runtime
- `BlockDefinition` interface: `{ type, component, serializer?, parser?, defaultProps? }`

### Rich Text Model

- `RichTextSpan[]` — array of spans, each with `text` + optional flags (`bold`, `italic`, `code`, `strikethrough`, `link`)
- Conversion utilities in `packages/markdown/src/richText.ts`:
  - `richTextToHtml(rt)` / `htmlToRichText(html)` for contentEditable
  - `richTextToMarkdown(rt)` / `markdownToRichText(md)` for serialization
  - Manipulation: `mergeRichText`, `splitRichTextAt`, `applyRichFormat`, `toggleRichFormat`
  - Selection: `getActiveFormats`, `getSelectionRichRange`, `restoreDomRange`

### Editor Store (Zustand + Zundo)

- `useEditorStore` in `editor-core/src/store/editorStore.ts`
- Temporal undo/redo via `zundo` (100 history limit)
- Actions: `addBlock`, `updateBlock`, `replaceBlock`, `removeBlocks`, `moveBlocks`, `indentBlocks`, `outdentBlocks`, `selectBlock`, `setBlocks`, `undo`, `redo`
- UI state in separate `uiStore` (sidebar width, preview, mobile, editor mode)
- Persistence via `useEditorPersistence` hook (localStorage, 600ms debounce)

### Block Types

| Type | Component | Props |
|------|-----------|-------|
| heading | HeadingBlock | level, text |
| paragraph | ParagraphBlock | content (RichText) |
| quote | QuoteBlock | text |
| code | CodeBlock | code, language |
| divider | DividerBlock | — |
| image | ImageBlock | url, alt |
| table | TableBlock | rows (string[][]) |
| callout | CalloutBlock | text, type (note/tip/important/warning/caution) |
| bullet-list | ListBlock | style, html |
| numbered-list | ListBlock | style, html |
| image-grid | ImageGridBlock | cols, images, showCaptions, title?, description? |

### Markdown Pipeline (packages/markdown)

- `parseMarkdown(md)` → `Block[]` — parses full GFM including image-grids, callouts, nested lists
- `serializeMarkdown(blocks)` → `string` — each block type has custom serialization
- `hasImageGridMarker(md)` → `boolean`
- Image grids detected by `<!-- image-grid -->` HTML comment marker or table-of-images heuristic

### Component Architecture

- Server Components by default (Next.js App Router)
- Client components (`"use client"`) only for interactivity: blocks, editor, drag-drop, toolbars
- Layout in `apps/web/src/app/layout.tsx` — server component with Inter font & metadata
- Page in `apps/web/src/app/page.tsx` — client component with full editor
