"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  /** Base URL of the user's own github-readme-stats deployment on Vercel. */
  statsInstanceUrl: string;
  setStatsInstanceUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      statsInstanceUrl: "",
      setStatsInstanceUrl: (url) => set({ statsInstanceUrl: url.replace(/\/+$/, "") }),
    }),
    { name: "nme:settings" },
  ),
);
