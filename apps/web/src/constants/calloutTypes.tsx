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
    bg: "rgba(56, 139, 253, 0.08)",
    border: "rgba(56, 139, 253, 0.3)",
    accent: "#388bfd",
    // Preview panel colours
    previewBorder: "#388bfd",
    previewBg: "rgba(56,139,253,0.08)",
    previewColor: "#58a6ff",
  },
  tip: {
    label: "Tip",
    icon: React.createElement(Lightbulb, { size: 14 }),
    bg: "rgba(63, 185, 80, 0.08)",
    border: "rgba(63, 185, 80, 0.3)",
    accent: "#3fb950",
    previewBorder: "#3fb950",
    previewBg: "rgba(63,185,80,0.08)",
    previewColor: "#56d364",
  },
  important: {
    label: "Important",
    icon: React.createElement(Megaphone, { size: 14 }),
    bg: "rgba(163, 113, 247, 0.08)",
    border: "rgba(163, 113, 247, 0.3)",
    accent: "#a371f7",
    previewBorder: "#a371f7",
    previewBg: "rgba(163,113,247,0.08)",
    previewColor: "#bc8cff",
  },
  warning: {
    label: "Warning",
    icon: React.createElement(TriangleAlert, { size: 14 }),
    bg: "rgba(210, 153, 34, 0.08)",
    border: "rgba(210, 153, 34, 0.3)",
    accent: "#d29922",
    previewBorder: "#d29922",
    previewBg: "rgba(210,153,34,0.08)",
    previewColor: "#e3b341",
  },
  caution: {
    label: "Caution",
    icon: React.createElement(OctagonX, { size: 14 }),
    bg: "rgba(248, 113, 113, 0.08)",
    border: "rgba(248, 113, 113, 0.3)",
    accent: "#f85149",
    previewBorder: "#f85149",
    previewBg: "rgba(248,113,113,0.08)",
    previewColor: "#ff7b72",
  },
} as const;

export type CalloutKey = keyof typeof CALLOUT_TYPES;
