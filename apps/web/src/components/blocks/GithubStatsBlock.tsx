"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { GitFork } from "lucide-react";
import type { ComputedStats } from "@/lib/github-stats";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178C6",
  JavaScript: "#F7DF1E",
  Python: "#3572A5",
  Java: "#B07219",
  "C++": "#F34B7D",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Flutter: "#02569B",
  HTML: "#E34F26",
  CSS: "#563D7C",
  Shell: "#89E051",
  Vue: "#41B883",
  Svelte: "#FF3E00",
  Scala: "#C22D40",
  Haskell: "#5E5086",
  Lua: "#000080",
  "Objective-C": "#438EFF",
  R: "#198CE7",
  Julia: "#A270BA",
  Elixir: "#6E4A7E",
};

const VARIANTS = [
  { value: "default", label: "Default" },
  { value: "compact", label: "Compact" },
  { value: "minimal", label: "Minimal" },
  { value: "classic", label: "Classic" },
] as const;

const THEMES = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function GithubStatsBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const blocks = useEditorStore((s) => s.blocks);
  const myBlock = blocks.find((b) => b.id === block.id) ?? block;
  const username = (myBlock.props.username as string) ?? "";
  const variant = ((myBlock.props.variant as string) ?? "default") as string;
  const theme = ((myBlock.props.theme as string) ?? "auto") as string;

  const [stats, setStats] = useState<ComputedStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [inputUsername, setInputUsername] = useState(username);

  useEffect(() => {
    if (!username.trim()) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/github/${encodeURIComponent(username.trim())}`)
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j.error || r.statusText))))
      .then((data) => {
        if (!cancelled) { setStats(data as ComputedStats); setLoading(false); }
      })
      .catch((err) => {
        if (!cancelled) { setError(err instanceof Error ? err.message : String(err)); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [username]);

  const handleSave = () => {
    const u = inputUsername.trim();
    if (u) updateBlock(block.id, { username: u });
    setEditing(false);
  };

  const handleVariantChange = (newVariant: string) => {
    updateBlock(block.id, { variant: newVariant });
  };

  const handleThemeChange = (newTheme: string) => {
    updateBlock(block.id, { theme: newTheme });
  };

  if (!username.trim()) {
    return <ConnectPrompt inputUsername={inputUsername} setInputUsername={setInputUsername} editing={editing} setEditing={setEditing} handleSave={handleSave} />;
  }

  if (loading) return <Skeleton />;

  if (error || !stats) {
    return (
      <div style={cardStyle}>
        <ConnectPrompt inputUsername={inputUsername} setInputUsername={setInputUsername} editing={editing} setEditing={setEditing} handleSave={handleSave} />
      </div>
    );
  }

  const showProfile = variant === "default" || variant === "compact";
  const showLanguages = variant === "default" || variant === "compact";
  const showRepos = variant === "default";

  return (
    <div style={cardStyle}>
      {/* Toolbar */}
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1, display: "flex", gap: 4, alignItems: "center" }}>
        {editing ? (
          <>
            <input value={inputUsername} onChange={(e) => setInputUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              style={inputStyle} placeholder="GitHub username" autoFocus />
            <button onClick={handleSave} style={btnPrimary}>Save</button>
            <button onClick={() => { setEditing(false); setInputUsername(username); }} style={btnGhost}>Cancel</button>
          </>
        ) : (
          <>
            <select value={variant} onChange={(e) => handleVariantChange(e.target.value)} style={selectStyle}>
              {VARIANTS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
            <select value={theme} onChange={(e) => handleThemeChange(e.target.value)} style={selectStyle}>
              {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button onClick={() => setEditing(true)} style={btnGhost}>Change</button>
          </>
        )}
      </div>

      {/* ═══ Profile ═══ */}
      {showProfile && (
        <>
          <div style={{ display: "flex", gap: 10, padding: "16px 16px 12px", alignItems: "flex-start" }}>
            <img src={stats.avatarUrl} alt={stats.login}
              style={{ width: 48, height: 48, borderRadius: "50%", border: "1.5px solid #30363d", flexShrink: 0 }} />
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f6fc", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {stats.name ?? stats.login}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#8b949e" }}>@{stats.login}</div>
              {stats.bio && (
                <div style={{ fontSize: 11, color: "#8b949e", marginTop: 3, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {stats.bio}
                </div>
              )}
            </div>
          </div>
          <div style={{ height: 1, background: "#30363d", margin: "0 16px" }} />
        </>
      )}

      {/* ═══ Stats ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: showProfile ? "12px 16px" : "16px 16px 12px" }}>
        {[
          { label: "REPOS", value: stats.totalRepos },
          { label: "STARS", value: stats.totalStars },
          { label: "FORKS", value: stats.totalForks },
          { label: "FOLLOWERS", value: stats.followers },
        ].map(({ label, value }) => (
          <div key={label} style={statCardStyle}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f6fc" }}>{fmt(value)}</div>
            <div style={{ fontSize: 10, fontWeight: 500, color: "#8b949e", textTransform: "uppercase" as const }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ═══ Languages ═══ */}
      {showLanguages && stats.topLanguages.length > 0 && (
        <>
          <div style={{ height: 1, background: "#30363d", margin: "0 16px" }} />
          <div style={{ padding: "10px 16px 8px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#8b949e", textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 8 }}>
              Languages
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "#21262d", display: "flex", overflow: "hidden", marginBottom: 10 }}>
              {stats.topLanguages.map((lang) => (
                <div key={lang.name}
                  style={{ width: `${lang.percentage}%`, background: LANG_COLORS[lang.name] ?? "#8b949e", minWidth: lang.percentage > 0 ? 3 : 0 }} />
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
              {stats.topLanguages.slice(0, 6).map((lang) => (
                <div key={lang.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: LANG_COLORS[lang.name] ?? "#8b949e", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#c9d1d9" }}>{lang.name}</span>
                  <span style={{ fontSize: 11, color: "#8b949e" }}>{lang.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══ Repos ═══ */}
      {showRepos && stats.mostStarredRepos.length > 0 && (
        <>
          <div style={{ height: 1, background: "#30363d", margin: "0 16px" }} />
          <div style={{ padding: "10px 16px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#8b949e", textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 8 }}>
              Most Starred
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stats.mostStarredRepos.length, 3)}, 1fr)`, gap: 8 }}>
              {stats.mostStarredRepos.slice(0, 3).map((repo) => (
                <a key={repo.name} href={repo.url} target="_blank" rel="noopener noreferrer"
                  style={repoCardStyle}>
                  <span style={{ fontWeight: 600, color: "#58a6ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                    {repo.name}
                  </span>
                  <span style={{ fontWeight: 500, color: "#8b949e", marginLeft: 6, whiteSpace: "nowrap", flexShrink: 0 }}>
                    ★ {repo.stars}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: 8,
  border: "1px solid #30363d",
  background: "#0d1117",
  margin: "8px 0",
  overflow: "hidden",
  width: "100%",
  maxWidth: 580,
};

const statCardStyle: React.CSSProperties = {
  padding: "12px 8px",
  borderRadius: 6,
  border: "1px solid #30363d",
  background: "#161b22",
  textAlign: "center",
};

const repoCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #30363d",
  background: "#161b22",
  textDecoration: "none",
  overflow: "hidden",
};

const inputStyle: React.CSSProperties = {
  padding: "3px 6px", fontSize: 11, borderRadius: 4,
  border: "1px solid #30363d", background: "#161b22", color: "#f0f6fc",
  outline: "none", width: 120,
};

const selectStyle: React.CSSProperties = {
  padding: "3px 6px", fontSize: 10, borderRadius: 4,
  border: "1px solid #30363d", background: "#161b22", color: "#8b949e",
  outline: "none", cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  padding: "3px 8px", fontSize: 10, fontWeight: 600, borderRadius: 4,
  border: "none", background: "#238636", color: "#fff", cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "3px 8px", fontSize: 10, fontWeight: 600, borderRadius: 4,
  border: "1px solid #30363d", background: "transparent", color: "#8b949e", cursor: "pointer",
};

function Skeleton() {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", gap: 10, padding: "16px 16px 12px" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#21262d", flexShrink: 0 }} />
        <div>
          <div style={{ width: 120, height: 14, borderRadius: 4, background: "#21262d", marginBottom: 4 }} />
          <div style={{ width: 90, height: 10, borderRadius: 4, background: "#21262d" }} />
        </div>
      </div>
      <div style={{ height: 1, background: "#30363d", margin: "0 16px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: "12px 16px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ padding: "12px 8px", borderRadius: 6, border: "1px solid #30363d", background: "#161b22", textAlign: "center" }}>
            <div style={{ width: 30, height: 20, margin: "0 auto 4px", borderRadius: 4, background: "#21262d" }} />
            <div style={{ width: 36, height: 8, margin: "0 auto", borderRadius: 4, background: "#21262d" }} />
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: "#30363d", margin: "0 16px" }} />
      <div style={{ padding: "10px 16px 8px" }}>
        <div style={{ width: 60, height: 8, borderRadius: 4, background: "#21262d", marginBottom: 8 }} />
        <div style={{ height: 6, borderRadius: 3, background: "#21262d", marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 60, height: 10, borderRadius: 4, background: "#21262d" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ConnectPrompt({
  inputUsername, setInputUsername, editing, setEditing, handleSave,
}: {
  inputUsername: string; setInputUsername: (v: string) => void;
  editing: boolean; setEditing: (v: boolean) => void; handleSave: () => void;
}) {
  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <GitFork size={24} style={{ color: "#8b949e" }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: "#c9d1d9" }}>GitHub Stats</div>
      {!editing ? (
        <button onClick={() => setEditing(true)} style={{ ...btnPrimary, padding: "6px 14px", fontSize: 12 }}>Connect GitHub</button>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <input value={inputUsername} onChange={(e) => setInputUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            style={{ ...inputStyle, width: 160, padding: "5px 8px", fontSize: 12 }}
            placeholder="GitHub username" autoFocus />
          <button onClick={handleSave} style={{ ...btnPrimary, padding: "5px 12px", fontSize: 12 }}>Save</button>
        </div>
      )}
    </div>
  );
}
