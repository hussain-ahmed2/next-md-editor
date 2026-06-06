import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "github-markdown-css/github-markdown.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "next-md-editor — Visual Markdown Editor",
  description: "Block-based, drag-and-drop markdown editor built with Next.js.",
  verification: {
    google: "Y3U47_SQXf9YVFBh6HsJuaTpjFxc5P8oPXXv8djsdvI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
