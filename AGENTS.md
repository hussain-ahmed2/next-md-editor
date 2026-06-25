# next-md-editor

Block-based visual markdown editor built with Next.js 16, React 19, and Turborepo.

## Quick Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all dev servers (Next.js + package watchers) |
| `npm run build` | Build all packages & web app |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all packages |
| `npm run clean` | Clean all build outputs |

## Context Files

Detailed project context is in `agents/context/`:

- **architecture.md** — Monorepo structure, package graph, data flow, key patterns
- **coding-rules.md** — TypeScript conventions, naming, imports, component patterns, state management
- **product.md** — Product vision, features, block types, user workflows

## Architecture at a Glance

```
apps/web  →  @next-md-editor/editor-core  →  @next-md-editor/types
apps/web  →  @next-md-editor/markdown     →  @next-md-editor/types
```

Data flows: `Markdown ↔ Block[] ↔ Zustand Store ↔ Block Components`

## Key Packages

- `apps/web` — Next.js app, block components, registry, UI
- `@next-md-editor/types` — Shared TypeScript interfaces (Block, EditorState, RichText)
- `@next-md-editor/editor-core` — Zustand store + BlockRegistry singleton
- `@next-md-editor/markdown` — Parser/serializer (unified/remark), rich text utilities
- `@next-md-editor/{ui,themes,mdx,blocks,editor-react}` — Stub packages (not yet implemented)

## Custom coding rules

- **Strict Typing**: Never use the `any` type anywhere in the codebase. Use explicit TS types (such as `Block[]` or `RichText`) or `unknown` and narrow with type guards.
