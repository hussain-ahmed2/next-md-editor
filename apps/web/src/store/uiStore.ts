"use client";

import { create } from "zustand";

interface UIState {
  sidebarWidth: number;
  previewWidth: number;
  isResizingSidebar: boolean;
  isResizingPreview: boolean;
  mobileTab: "blocks" | "editor" | "preview";
  previewOpen: boolean;
  isMobile: boolean;
  saveStatus: "saving" | "saved" | "idle";

  setSidebarWidth: (width: number) => void;
  setPreviewWidth: (width: number) => void;
  setIsResizingSidebar: (isResizing: boolean) => void;
  setIsResizingPreview: (isResizing: boolean) => void;
  setMobileTab: (tab: "blocks" | "editor" | "preview") => void;
  setPreviewOpen: (open: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  setSaveStatus: (status: "saving" | "saved" | "idle") => void;
  togglePreview: () => void;
  startResizeSidebar: (mouseDownEvent: React.MouseEvent) => void;
  startResizePreview: (mouseDownEvent: React.MouseEvent) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarWidth: 220,
  previewWidth: 360,
  isResizingSidebar: false,
  isResizingPreview: false,
  mobileTab: "editor",
  previewOpen: true,
  isMobile: false,
  saveStatus: "idle",

  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setPreviewWidth: (width) => set({ previewWidth: width }),
  setIsResizingSidebar: (isResizing) => set({ isResizingSidebar: isResizing }),
  setIsResizingPreview: (isResizing) => set({ isResizingPreview: isResizing }),
  setMobileTab: (tab) => set({ mobileTab: tab }),
  setPreviewOpen: (open) => set({ previewOpen: open }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setSaveStatus: (status) => set({ saveStatus: status }),
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
    const startWidth = get().previewWidth;

    const doResize = (mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX;
      const newWidth = Math.max(200, Math.min(1000, startWidth - deltaX));
      set({ previewWidth: newWidth });
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
