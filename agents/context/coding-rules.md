# Coding Rules

## TypeScript

- Strict mode enabled in all `tsconfig.json` files
- **No `any` types** — use `unknown` and narrow with type guards
- Prefer explicit interfaces over type aliases for object shapes
- Use `import type` for type-only imports
- All packages use `moduleResolution: "bundler"`

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Components | PascalCase | `HeadingBlock.tsx`, `EditorCanvas.tsx` |
| Functions/variables | camelCase | `parseMarkdown`, `useEditorStore` |
| Constants | SCREAMING_SNAKE | `DEMO_MARKDOWN` |
| Types/interfaces | PascalCase | `Block`, `EditorState`, `RichTextSpan` |
| Files (components) | PascalCase | `SortableBlock.tsx` |
| Files (utils/hooks) | camelCase | `editorShortcuts.ts`, `useDragAndDrop.ts` |
| Test files | kebab-case | `parse-image-grid.test.ts` |

## Imports

- Web app uses `@/` path alias (`"@/*": ["./src/*"]`)
- Packages import workspace deps by name: `@next-md-editor/types`, `@next-md-editor/editor-core`
- Group imports: external → workspace → relative
- Use named exports only — no `export default`

## Components

- Each block is a client component (`"use client"`) with interactive editing
- Components are pure functions — no class components
- Props typed inline or via exported interface
- Block components receive `{ block: Block }` prop from `BlockRenderer`
- Use `contentEditable` with `dangerouslySetInnerHTML` for rich text editing (sanitized via richText utilities)
- **Modularity & Directory Structure**: Split complex blocks or large editor components with rich logic, multiple sub-forms, or extensive constants into dedicated sub-folders (e.g., `badge-group/` inside `components/blocks/`, or `toolbar/`/`markdown-preview/`/`sortable-block/` inside `components/editor/`). The primary file acts as the coordinator (managing Zustand store bindings, global events, and orchestration), while sub-components handle isolated UI parts.

## Shared Hooks

- `useBlockFocus` — automatically focuses the DOM ref of a block when it is selected/focused. Used by interactive blocks: `ParagraphBlock`, `QuoteBlock`, `HeadingBlock`, `ListBlock`, `ImageBlock`, `ImageGridBlock`, and `BadgeGroupBlock`.
- `useContentSync` — syncs the innerHTML of a contentEditable element with store changes while preserving caret position (mostly used for undo/redo reconciliation).


## State Management

- **Zustand** for global state:
  - `useEditorStore` — block data, selection, CRUD (in `editor-core`)
  - `useUIStore` — sidebar width, preview, mobile, editor mode (in `apps/web`)
- **Zundo** for undo/redo (temporal store wrapping editor store)
- Local React state for ephemeral UI (dropdowns, tooltips, input values)
- `useEffect` for syncing DOM content ↔ store (caret preservation)
- `useCallback`/`useMemo` for performance in hot paths

## Block Structure

Every block follows the `Block` interface:
```ts
interface Block {
  id: string;        // uuid v4
  type: BlockType;   // string union
  props: Record<string, unknown>;  // type-specific data
  children?: Block[];  // nested blocks (lists)
}
```

- `props` is always `Record<string, unknown>` — cast at consumption
- `children` used for nested lists and potentially other nesting
- IDs are generated with `uuid` v4

## Block Registry

- All block types must be registered in `apps/web/src/registry/index.ts`
- Each registration includes `type`, `component`, `defaultProps`, and optionally `serializer`/`parser`
- `BlockRegistry` is a singleton — import from `@next-md-editor/editor-core`

## File Organization

```
apps/web/src/
├── app/              # Next.js App Router (layout, page)
├── components/
│   ├── blocks/       # One coordinator file per block type + sub-folders (badge-group/, image-grid/)
│   └── editor/       # Coordinator files (EditorCanvas, EditorToolbar) + sub-folders (sortable-block/, toolbar/, markdown-preview/)
├── constants/        # Demo data, shared constants (calloutTypes.tsx)
├── features/         # Feature modules (markdown serializer, highlighter)
├── hooks/            # Custom React hooks (useBlockFocus.ts, useContentSync.ts)
├── registry/         # Block registry initialization
├── store/            # Zustand UI store
└── utils/            # Utility functions
```

## Testing

- Vitest in `packages/markdown` (the only package with tests currently)
- Test files in `src/__tests__/*.test.ts`
- Environment: `node`
- Run: `npm run test` (turbo) or `npx vitest run` in markdown package
- Focus on parse/serialize roundtrip, edge cases, marker detection

## CSS

- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- Custom CSS variables for theming (GitHub Dark)
- No CSS-in-JS libraries
- Global styles in `apps/web/src/app/globals.css`

## Build

- Packages: `tsup` (ESM + CJS + .d.ts)
- Web app: `next build`
- Orchestration: `turbo run build` (respects dependency graph)
- Dev: `turbo run dev` (parallel watchers)

## Error Handling

- Use try/catch for markdown parsing (graceful fallback)
- Block registry shows "Unknown block type" fallback UI for unregistered types
- No console.log in production code — use proper logging if needed
