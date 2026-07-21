import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Blocks,
  FileDown,
  FolderTree,
  HardDrive,
  LayoutTemplate,
  MousePointerClick,
  Sparkles,
  Zap,
} from "lucide-react";

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "next-md-editor — The IDE for your README",
  description:
    "A block-based visual markdown workspace with an IDE-style file tree, GitHub-accurate preview, GitHub stats cards, and one-click export. Free, local-first, open source.",
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    icon: Blocks,
    title: "Notion-style block editor",
    text: "Compose documents from rich blocks — headings, tables, callouts, code, images, badges, tech stacks — with slash commands and a floating format toolbar.",
  },
  {
    icon: FolderTree,
    title: "IDE project tree",
    text: "Organize markdown files in folders like a JetBrains IDE. Create, rename, drag to reorganize, and switch between files with editor tabs.",
  },
  {
    icon: HardDrive,
    title: "Local-first & private",
    text: "Everything is saved instantly to your browser's local storage. No account required, no server round-trips, your documents never leave your machine.",
  },
  {
    icon: GithubIcon,
    title: "GitHub stats cards",
    text: "Embed beautiful GitHub stats, top-languages, and repo cards with dozens of themes — rendered by our built-in API or your own Vercel instance.",
  },
  {
    icon: FileDown,
    title: "Import & export anything",
    text: "Import .md files or whole ZIP projects. Export a single file, a standalone HTML page, a print-perfect PDF, or your entire workspace as a ZIP.",
  },
  {
    icon: MousePointerClick,
    title: "First-class drag & drop",
    text: "Drag blocks from the palette, reorder the canvas, move files between folders, or drop markdown files straight from your desktop.",
  },
  {
    icon: LayoutTemplate,
    title: "GitHub-accurate preview",
    text: "The live preview uses GitHub's own markdown styling, so what you see is exactly what your README will look like — including mermaid diagrams.",
  },
  {
    icon: Sparkles,
    title: "AI-assisted writing",
    text: "Generate sections, improve wording, or scaffold a whole README from a prompt with the built-in AI assistant.",
  },
  {
    icon: Zap,
    title: "Fast and production-ready",
    text: "React 19 with the React Compiler, fine-grained state updates, and a source mode with CodeMirror when you want raw markdown.",
  },
];

const BLOCK_TYPES = [
  "Heading",
  "Paragraph",
  "Quote",
  "Code",
  "Table",
  "Callout",
  "Image grid",
  "Badges",
  "Tech stack",
  "Hero",
  "Roadmap",
  "Contributors",
  "GitHub stats",
  "Collapsible",
  "Mermaid",
  "AI content",
];

function IdeMockup() {
  return (
    <div className="landing-mockup" aria-hidden="true">
      <div className="landing-mockup-titlebar">
        <span className="landing-mockup-dot" />
        <span className="landing-mockup-dot" />
        <span className="landing-mockup-dot" />
      </div>
      <div className="landing-mockup-body">
        <div className="landing-mockup-tree">
          <div className="landing-mockup-tree-row">▾ my-project</div>
          <div className="landing-mockup-tree-row active">
            <span className="indent" />
            README.md
          </div>
          <div className="landing-mockup-tree-row">
            <span className="indent" />
            CONTRIBUTING.md
          </div>
          <div className="landing-mockup-tree-row">
            <span className="indent" />▾ docs
          </div>
          <div className="landing-mockup-tree-row">
            <span className="indent" />
            <span className="indent" />
            getting-started.md
          </div>
          <div className="landing-mockup-tree-row">
            <span className="indent" />
            <span className="indent" />
            api-reference.md
          </div>
          <div className="landing-mockup-tree-row">
            <span className="indent" />
            CHANGELOG.md
          </div>
        </div>
        <div className="landing-mockup-editor">
          <div className="landing-mockup-tabs">
            <div className="landing-mockup-tab active">README.md</div>
            <div className="landing-mockup-tab">getting-started.md</div>
          </div>
          <div className="landing-mockup-content">
            <div className="landing-mockup-h1" />
            <div className="landing-mockup-badges">
              <span className="landing-mockup-badge" />
              <span className="landing-mockup-badge" />
              <span className="landing-mockup-badge" />
            </div>
            <div className="landing-mockup-line" style={{ width: "92%" }} />
            <div className="landing-mockup-line" style={{ width: "78%" }} />
            <div className="landing-mockup-line" style={{ width: "85%" }} />
            <div className="landing-mockup-code">
              <div className="landing-mockup-line" style={{ width: "55%", opacity: 0.6 }} />
              <div className="landing-mockup-line" style={{ width: "70%", opacity: 0.6 }} />
              <div
                className="landing-mockup-line"
                style={{ width: "40%", opacity: 0.6, marginBottom: 0 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-root">
      <nav className="landing-nav">
        <Link href="/" className="landing-nav-brand">
          <span className="landing-logo">M</span>
          next-md-editor
        </Link>
        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">
            Features
          </a>
          <a
            href="https://github.com/hussain-ahmed2/next-md-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-nav-link"
          >
            GitHub
          </a>
          <Link href="/editor" className="landing-btn landing-btn-primary landing-btn-sm">
            Open Editor
          </Link>
        </div>
      </nav>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-glow" />
          <span className="landing-badge">Free · Open source · No sign-up required</span>
          <h1>
            The <em>IDE</em> for your README
          </h1>
          <p className="landing-hero-sub">
            A block-based visual markdown workspace with a real project tree, GitHub-accurate live
            preview, stats cards, and one-click export. Your files stay in your browser — private by
            default.
          </p>
          <div className="landing-hero-ctas">
            <Link href="/editor" className="landing-btn landing-btn-primary">
              Start writing <ArrowRight size={16} />
            </Link>
            <a
              href="https://github.com/hussain-ahmed2/next-md-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-btn landing-btn-secondary"
            >
              <GithubIcon size={16} /> Star on GitHub
            </a>
          </div>
          <IdeMockup />
        </section>

        <section id="features" className="landing-section">
          <h2 className="landing-section-title">Everything a great README needs</h2>
          <p className="landing-section-sub">
            From your first heading to a fully deployed stats card — write, organize, and ship
            markdown without leaving the browser.
          </p>
          <div className="landing-features">
            {FEATURES.map((f) => (
              <div key={f.title} className="landing-feature">
                <div className="landing-feature-icon">
                  <f.icon size={18} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <h2 className="landing-section-title">18+ ready-made blocks</h2>
          <p className="landing-section-sub">
            Drag them in, tweak the props, and the editor writes clean GitHub-Flavored Markdown for
            you.
          </p>
          <div className="landing-blocks">
            {BLOCK_TYPES.map((b) => (
              <span key={b} className="landing-block-chip">
                {b}
              </span>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-cta">
            <h2>Your next README starts here</h2>
            <p>No installs, no accounts — the editor opens instantly in your browser.</p>
            <Link href="/editor" className="landing-btn landing-btn-primary">
              Open the editor <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <span>
          © {new Date().getFullYear()} next-md-editor · MIT License · GitHub stats card design
          adapted from{" "}
          <a
            href="https://github.com/anuraghazra/github-readme-stats"
            target="_blank"
            rel="noopener noreferrer"
          >
            github-readme-stats
          </a>
        </span>
        <a
          href="https://github.com/hussain-ahmed2/next-md-editor"
          target="_blank"
          rel="noopener noreferrer"
        >
          Contribute on GitHub
        </a>
      </footer>
    </div>
  );
}
