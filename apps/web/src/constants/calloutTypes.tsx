import { Info, Lightbulb, Megaphone, TriangleAlert, OctagonX } from "lucide-react";
import React from "react";

/**
 * Single source of truth for callout/alert type metadata.
 * Used by CalloutBlock (editor) and MarkdownPreview (preview).
 */
export const CALLOUT_TYPES = {
  note: {
    label: "Note",
    icon: React.createElement(Info, { size: 14 }),
    bg: "var(--callout-note-bg)",
    border: "var(--callout-note-border)",
    accent: "var(--callout-note-accent)",
    previewBorder: "var(--callout-note-preview-border)",
    previewBg: "var(--callout-note-preview-bg)",
    previewColor: "var(--callout-note-preview-color)",
  },
  tip: {
    label: "Tip",
    icon: React.createElement(Lightbulb, { size: 14 }),
    bg: "var(--callout-tip-bg)",
    border: "var(--callout-tip-border)",
    accent: "var(--callout-tip-accent)",
    previewBorder: "var(--callout-tip-preview-border)",
    previewBg: "var(--callout-tip-preview-bg)",
    previewColor: "var(--callout-tip-preview-color)",
  },
  important: {
    label: "Important",
    icon: React.createElement(Megaphone, { size: 14 }),
    bg: "var(--callout-important-bg)",
    border: "var(--callout-important-border)",
    accent: "var(--callout-important-accent)",
    previewBorder: "var(--callout-important-preview-border)",
    previewBg: "var(--callout-important-preview-bg)",
    previewColor: "var(--callout-important-preview-color)",
  },
  warning: {
    label: "Warning",
    icon: React.createElement(TriangleAlert, { size: 14 }),
    bg: "var(--callout-warning-bg)",
    border: "var(--callout-warning-border)",
    accent: "var(--callout-warning-accent)",
    previewBorder: "var(--callout-warning-preview-border)",
    previewBg: "var(--callout-warning-preview-bg)",
    previewColor: "var(--callout-warning-preview-color)",
  },
  caution: {
    label: "Caution",
    icon: React.createElement(OctagonX, { size: 14 }),
    bg: "var(--callout-caution-bg)",
    border: "var(--callout-caution-border)",
    accent: "var(--callout-caution-accent)",
    previewBorder: "var(--callout-caution-preview-border)",
    previewBg: "var(--callout-caution-preview-bg)",
    previewColor: "var(--callout-caution-preview-color)",
  },
} as const;

export type CalloutKey = keyof typeof CALLOUT_TYPES;
