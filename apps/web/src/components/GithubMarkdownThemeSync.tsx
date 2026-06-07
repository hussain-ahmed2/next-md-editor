"use client";

import { useEffect } from "react";

const GM_LIGHT = "https://unpkg.com/github-markdown-css@5.9.0/github-markdown-light.css";
const GM_DARK = "https://unpkg.com/github-markdown-css@5.9.0/github-markdown-dark.css";

export function GithubMarkdownThemeSync() {
  useEffect(() => {
    const theme = document.documentElement.dataset.theme || "dark";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = "gm-theme";
    link.href = theme === "light" ? GM_LIGHT : GM_DARK;
    document.head.appendChild(link);

    const observer = new MutationObserver(() => {
      const current = document.documentElement.dataset.theme || "dark";
      const el = document.getElementById("gm-theme") as HTMLLinkElement | null;
      if (el) {
        el.href = current === "light" ? GM_LIGHT : GM_DARK;
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return null;
}
