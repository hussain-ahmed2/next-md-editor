"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { ToolbarButton } from "./ToolbarButton";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <ToolbarButton
      onClick={toggle}
      tooltip={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </ToolbarButton>
  );
}
