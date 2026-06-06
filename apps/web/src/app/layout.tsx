import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "github-markdown-css/github-markdown.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const siteUrl = "https://next-md-editor.vercel.app";
const siteName = "next-md-editor";
const defaultTitle = "next-md-editor — Visual Markdown Editor";
const defaultDescription =
  "A professional block-based visual markdown editor. Drag, drop, and edit GitHub-Flavored Markdown with a live preview matching GitHub's rendering.";

export const metadata: Metadata = {
  title: { default: defaultTitle, template: `%s | ${siteName}` },
  description: defaultDescription,
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  keywords: [
    "markdown editor",
    "visual markdown",
    "github flavored markdown",
    "block editor",
    "notion alternative",
    "next.js editor",
    "drag drop markdown",
  ],
  authors: [{ name: "Hussain Ahmed", url: "https://github.com/hussain-ahmed2" }],
  creator: "Hussain Ahmed",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  verification: {
    google: "Y3U47_SQXf9YVFBh6HsJuaTpjFxc5P8oPXXv8djsdvI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: siteName,
              description: defaultDescription,
              url: siteUrl,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web",
              browserRequirements: "Requires JavaScript",
              author: {
                "@type": "Person",
                name: "Hussain Ahmed",
                url: "https://github.com/hussain-ahmed2",
              },
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
