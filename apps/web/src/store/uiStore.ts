"use client";

import { create } from "zustand";

interface UIState {
  sidebarWidth: number;
  previewRatio: number;
  isResizingSidebar: boolean;
  isResizingPreview: boolean;
  mobileTab: "blocks" | "editor" | "preview";
  previewOpen: boolean;
  isMobile: boolean;
  saveStatus: "saving" | "saved" | "idle";
  editorMode: "canvas" | "source";
  sourceText: string;
  isSearchOpen: boolean;
  searchQuery: string;
  isAiReadmeOpen: boolean;

  setSidebarWidth: (width: number) => void;
  setPreviewRatio: (ratio: number) => void;
  setIsResizingSidebar: (isResizing: boolean) => void;
  setIsResizingPreview: (isResizing: boolean) => void;
  setMobileTab: (tab: "blocks" | "editor" | "preview") => void;
  setPreviewOpen: (open: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  setSaveStatus: (status: "saving" | "saved" | "idle") => void;
  togglePreview: () => void;
  startResizeSidebar: (mouseDownEvent: React.MouseEvent) => void;
  startResizePreview: (mouseDownEvent: React.MouseEvent) => void;
  setEditorMode: (mode: "canvas" | "source") => void;
  setSourceText: (text: string) => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setAiReadmeOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarWidth: 220,
  previewRatio: 0.5,
  isResizingSidebar: false,
  isResizingPreview: false,
  mobileTab: "editor",
  previewOpen: true,
  isMobile: false,
  saveStatus: "idle",
  editorMode: "canvas",
  sourceText: "",
  isSearchOpen: false,
  searchQuery: "",
  isAiReadmeOpen: false,

  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setPreviewRatio: (ratio) => set({ previewRatio: ratio }),
  setIsResizingSidebar: (isResizing) => set({ isResizingSidebar: isResizing }),
  setIsResizingPreview: (isResizing) => set({ isResizingPreview: isResizing }),
  setMobileTab: (tab) => set({ mobileTab: tab }),
  setPreviewOpen: (open) => set({ previewOpen: open }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setEditorMode: (mode) => set({ editorMode: mode }),
  setSourceText: (text) => set({ sourceText: text }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setAiReadmeOpen: (open) => set({ isAiReadmeOpen: open }),
  togglePreview: () => {
    const { isMobile, mobileTab, previewOpen } = get();
    if (isMobile) {
      set({ mobileTab: mobileTab === "preview" ? "editor" : "preview" });
    } else {
      set({ previewOpen: !previewOpen });
    }
  },

  startResizeSidebar: (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    set({ isResizingSidebar: true });
    const startX = mouseDownEvent.clientX;
    const startWidth = get().sidebarWidth;

    const doResize = (mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX;
      const newWidth = Math.max(120, Math.min(480, startWidth + deltaX));
      set({ sidebarWidth: newWidth });
    };

    const stopResize = () => {
      set({ isResizingSidebar: false });
      document.removeEventListener("mousemove", doResize);
      document.removeEventListener("mouseup", stopResize);
    };

    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);
  },

  startResizePreview: (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    set({ isResizingPreview: true });
    const startX = mouseDownEvent.clientX;
    const startRatio = get().previewRatio;
    const parent = (mouseDownEvent.target as HTMLElement).parentElement;
    if (!parent) return;
    const parentWidth = parent.getBoundingClientRect().width;
    const isSourceMode = get().editorMode === "source";
    const hasSidebar = !isSourceMode && !get().isMobile;
    const remainingWidth = parentWidth - (hasSidebar ? get().sidebarWidth : 0) - 16;

    const doResize = (mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX;
      const newRatio = Math.max(0.2, Math.min(0.8, startRatio - deltaX / remainingWidth));
      set({ previewRatio: newRatio });
    };

    const stopResize = () => {
      set({ isResizingPreview: false });
      document.removeEventListener("mousemove", doResize);
      document.removeEventListener("mouseup", stopResize);
    };

    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);
  },
}));
