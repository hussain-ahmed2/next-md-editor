"use client";

import { useState, useCallback } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "md-editor-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.dataset.theme === "light" ? "light" : "dark";
    }
    return "dark";
  });

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}
