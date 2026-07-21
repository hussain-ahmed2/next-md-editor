import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editor",
  description:
    "Write and organize GitHub-Flavored Markdown in a block-based IDE workspace with live GitHub-accurate preview.",
  alternates: { canonical: "/editor" },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
