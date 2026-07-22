import { defaultSchema } from "rehype-sanitize";
import type { Options as SanitizeOptions } from "rehype-sanitize";

/**
 * HTML sanitization schema for rendering markdown that may come from
 * untrusted sources (imported .md files, dropped files, ZIP projects).
 *
 * Based on rehype-sanitize's `defaultSchema` — which mirrors GitHub's own
 * sanitizer — so the preview matches how GitHub actually renders a README,
 * while stripping scripts, event handlers, and other XSS vectors. We extend
 * it only with the presentational attributes/elements this editor's blocks
 * legitimately emit (align, image sizing, <details>, <picture>, badges).
 */
const attributes = defaultSchema.attributes ?? {};

export const markdownSanitizeSchema: SanitizeOptions = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "picture",
    "source",
    "kbd",
    "samp",
  ],
  attributes: {
    ...attributes,
    "*": [...(attributes["*"] ?? []), "align"],
    img: [...(attributes.img ?? []), "align", "width", "height"],
    a: [...(attributes.a ?? []), "align"],
    div: [...(attributes.div ?? []), "align"],
    p: [...(attributes.p ?? []), "align"],
    h1: [...(attributes.h1 ?? []), "align"],
    h2: [...(attributes.h2 ?? []), "align"],
    h3: [...(attributes.h3 ?? []), "align"],
    h4: [...(attributes.h4 ?? []), "align"],
    h5: [...(attributes.h5 ?? []), "align"],
    h6: [...(attributes.h6 ?? []), "align"],
    source: ["srcSet", "src", "media", "type", "sizes"],
    // Task-list checkboxes emitted by remark-gfm
    input: [...(attributes.input ?? []), "type", "checked", "disabled"],
  },
};
