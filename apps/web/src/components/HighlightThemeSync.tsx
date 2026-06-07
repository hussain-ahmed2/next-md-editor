"use client";

import { useEffect } from "react";

const HIGHLIGHT_LIGHT = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";
const HIGHLIGHT_DARK = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";

export function HighlightThemeSync() {
  useEffect(() => {
    const theme = document.documentElement.dataset.theme || "dark";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = "hljs-theme";
    link.href = theme === "light" ? HIGHLIGHT_LIGHT : HIGHLIGHT_DARK;
    document.head.appendChild(link);

    const observer = new MutationObserver(() => {
      const current = document.documentElement.dataset.theme || "dark";
      const el = document.getElementById("hljs-theme") as HTMLLinkElement | null;
      if (el) {
        el.href = current === "light" ? HIGHLIGHT_LIGHT : HIGHLIGHT_DARK;
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return null;
}
