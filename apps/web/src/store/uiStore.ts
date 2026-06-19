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
    const parent = (mouseDownEvent.target as HTMLElement).parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();

    const doResize = (mouseMoveEvent: MouseEvent) => {
      const endX = parentRect.right;
      const previewPx = endX - mouseMoveEvent.clientX;
      const ratio = Math.max(0.2, Math.min(0.8, previewPx / parentRect.width));
      set({ previewRatio: ratio });
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
