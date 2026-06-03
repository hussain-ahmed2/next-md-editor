"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts } from "@/utils/editorShortcuts";
import { Trash2, Plus, Award, ChevronUp, ChevronDown, Search, X } from "lucide-react";

interface Badge {
  id: string;
  text: string;
  color: string;
  logo: string;
}

interface TechItem {
  text: string;
  color: string;
  logo: string;
}

const TECH_LOGOS: TechItem[] = [
  { text: "Python", color: "3776AB", logo: "python" },
  { text: "Flask", color: "000000", logo: "flask" },
  { text: "Django", color: "092E20", logo: "django" },
  { text: "Kotlin", color: "0095D5", logo: "kotlin" },
  { text: "Dart", color: "0175C2", logo: "dart" },
  { text: "Flutter", color: "02569B", logo: "flutter" },
  { text: "Java", color: "ED8B00", logo: "java" },
  { text: "Spring", color: "6DB33F", logo: "spring" },
  { text: "C", color: "A8B9CC", logo: "c" },
  { text: "C++", color: "00599C", logo: "cplusplus" },
  { text: "C#", color: "239120", logo: "csharp" },
  { text: ".NET", color: "512BD4", logo: "dotnet" },
  { text: "JavaScript", color: "F7DF1E", logo: "javascript" },
  { text: "TypeScript", color: "3178C6", logo: "typescript" },
  { text: "React", color: "61DAFB", logo: "react" },
  { text: "Next.js", color: "000000", logo: "nextdotjs" },
  { text: "Vue.js", color: "4FC08D", logo: "vuedotjs" },
  { text: "Angular", color: "DD0031", logo: "angular" },
  { text: "Node.js", color: "339933", logo: "nodedotjs" },
  { text: "Express", color: "000000", logo: "express" },
  { text: "Go", color: "00ADD8", logo: "go" },
  { text: "Rust", color: "000000", logo: "rust" },
  { text: "Swift", color: "F05138", logo: "swift" },
  { text: "PHP", color: "777BB4", logo: "php" },
  { text: "Ruby", color: "CC342D", logo: "ruby" },
  { text: "Lua", color: "2C2D72", logo: "lua" },
  { text: "R", color: "276DC3", logo: "r" },
  { text: "Scala", color: "DC322F", logo: "scala" },
  { text: "Elixir", color: "4B275F", logo: "elixir" },
  { text: "HTML5", color: "E34F26", logo: "html5" },
  { text: "CSS3", color: "1572B6", logo: "css3" },
  { text: "Sass", color: "CC6699", logo: "sass" },
  { text: "Tailwind CSS", color: "06B6D4", logo: "tailwindcss" },
  { text: "Bootstrap", color: "7952B3", logo: "bootstrap" },
  { text: "MySQL", color: "4479A1", logo: "mysql" },
  { text: "PostgreSQL", color: "4169E1", logo: "postgresql" },
  { text: "SQLite", color: "003B57", logo: "sqlite" },
  { text: "MongoDB", color: "47A248", logo: "mongodb" },
  { text: "Redis", color: "DC382D", logo: "redis" },
  { text: "Firebase", color: "FFCA28", logo: "firebase" },
  { text: "Supabase", color: "3ECF8E", logo: "supabase" },
  { text: "GraphQL", color: "E10098", logo: "graphql" },
  { text: "Docker", color: "2496ED", logo: "docker" },
  { text: "Kubernetes", color: "326CE5", logo: "kubernetes" },
  { text: "AWS", color: "FF9900", logo: "amazonwebservices" },
  { text: "Google Cloud", color: "4285F4", logo: "googlecloud" },
  { text: "Azure", color: "0078D4", logo: "microsoftazure" },
  { text: "Heroku", color: "430098", logo: "heroku" },
  { text: "Vercel", color: "000000", logo: "vercel" },
  { text: "Netlify", color: "00C7B7", logo: "netlify" },
  { text: "Git", color: "F05032", logo: "git" },
  { text: "GitHub", color: "181717", logo: "github" },
  { text: "GitLab", color: "FCA121", logo: "gitlab" },
  { text: "Bitbucket", color: "0052CC", logo: "bitbucket" },
  { text: "Jira", color: "0052CC", logo: "jira" },
  { text: "Postman", color: "FF6C37", logo: "postman" },
  { text: "Figma", color: "F24E1E", logo: "figma" },
  { text: "Adobe XD", color: "FF61F6", logo: "adobexd" },
  { text: "Photoshop", color: "31A8FF", logo: "adobephotoshop" },
  { text: "Linux", color: "FCC624", logo: "linux" },
  { text: "Ubuntu", color: "E95420", logo: "ubuntu" },
  { text: "Windows", color: "0078D6", logo: "windows" },
  { text: "macOS", color: "000000", logo: "apple" },
  { text: "Android", color: "3DDC84", logo: "android" },
  { text: "iOS", color: "000000", logo: "ios" },
  { text: "Arduino", color: "00979D", logo: "arduino" },
  { text: "Raspberry Pi", color: "A22846", logo: "raspberrypi" },
  { text: "Nginx", color: "009639", logo: "nginx" },
  { text: "JSON", color: "5E5C5C", logo: "json" },
  { text: "YAML", color: "CB171E", logo: "yaml" },
  { text: "Markdown", color: "000000", logo: "markdown" },
  { text: "Wix", color: "000000", logo: "wix" },
  { text: "Google Play", color: "414141", logo: "googleplay" },
  { text: "Unity", color: "000000", logo: "unity" },
  { text: "Webpack", color: "8DD6F9", logo: "webpack" },
  { text: "Vite", color: "646CFF", logo: "vite" },
  { text: "npm", color: "CB3837", logo: "npm" },
  { text: "Yarn", color: "2C8EBB", logo: "yarn" },
  { text: "Electron", color: "47848F", logo: "electron" },
];

function buildShieldsUrl(badge: Badge): string {
  const label = encodeURIComponent(badge.text.replace(/-/g, "--"));
  const color = badge.color.replace("#", "");
  const logo = badge.logo ? `&logo=${encodeURIComponent(badge.logo)}&logoColor=white` : "";
  return `https://img.shields.io/badge/${label}-${color}?style=for-the-badge${logo}`;
}

export function BadgeGroupBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const indentBlocks = useEditorStore((s) => s.indentBlocks);
  const outdentBlocks = useEditorStore((s) => s.outdentBlocks);

  const badges = (block.props.badges as Badge[]) ?? [];
  const alignment = (block.props.alignment as "left" | "center" | "right") ?? "left";

  const [showPicker, setShowPicker] = useState(false);
  const [searchText, setSearchText] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const filteredTech = useMemo(() => {
    if (!searchText) return TECH_LOGOS;
    const q = searchText.toLowerCase();
    return TECH_LOGOS.filter(
      (t) =>
        t.text.toLowerCase().includes(q) ||
        t.logo.toLowerCase().includes(q),
    );
  }, [searchText]);

  useEffect(() => {
    const isSelected =
      selectedBlockIds[selectedBlockIds.length - 1] === block.id;
    if (isSelected && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [selectedBlockIds, block.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPicker]);

  const handleAddBadge = (tech: TechItem) => {
    const newBadge: Badge = {
      id: Math.random().toString(36).substring(7),
      text: tech.text,
      color: tech.color,
      logo: tech.logo,
    };
    updateBlock(block.id, {
      badges: [...badges, newBadge],
      alignment,
    });
    setShowPicker(false);
    setSearchText("");
  };

  const handleRemoveBadge = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = badges.filter((b) => b.id !== id);
    updateBlock(block.id, {
      badges: filtered,
      alignment,
    });
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...badges];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updateBlock(block.id, { badges: updated, alignment });
  };

  const handleMoveDown = (index: number) => {
    if (index >= badges.length - 1) return;
    const updated = [...badges];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updateBlock(block.id, { badges: updated, alignment });
  };

  const toggleAlignment = () => {
    const next = alignment === "left" ? "center" : alignment === "center" ? "right" : "left";
    updateBlock(block.id, { badges, alignment: next });
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setShowPicker(false);
        }
        handleEditorKeyboardShortcuts(
          e,
          block,
          blocks,
          selectedBlockIds,
          addBlock,
          removeBlocks,
          updateBlock,
          selectBlock,
          indentBlocks,
          outdentBlocks,
        );
      }}
      style={{
        outline: "none",
        width: "100%",
        padding: "12px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)",
        background: "rgba(255, 255, 255, 0.01)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Control panel bar */}
      <div
        contentEditable={false}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 8px",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <Award size={14} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>
            TECH STACK
          </span>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {badges.length} badges
          </span>
        </div>

        <div
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleAlignment();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title={`Alignment: ${alignment}`}
            style={{
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              cursor: "pointer",
              textTransform: "uppercase",
              minWidth: 60,
              textAlign: "center",
            }}
          >
            {alignment}
          </button>

          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPicker(!showPicker);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Plus size={11} /> Add Badge
            </button>

            {/* Icon Picker Popover */}
            {showPicker && (
              <div
                ref={pickerRef}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  zIndex: 100,
                  width: 320,
                  maxHeight: 400,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Search */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <Search size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search tech..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      color: "var(--text-primary)",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />
                  {searchText && (
                    <button
                      onClick={() => setSearchText("")}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 4,
                    padding: "8px 10px",
                    overflowY: "auto",
                    flex: 1,
                  }}
                >
                  {filteredTech.map((tech) => (
                    <button
                      key={tech.logo}
                      onClick={() => handleAddBadge(tech)}
                      title={tech.text}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        padding: "6px 4px",
                        borderRadius: 6,
                        border: "1px solid transparent",
                        background: "transparent",
                        cursor: "pointer",
                        transition: "all 0.1s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-hover)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "transparent";
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={buildShieldsUrl({
                          id: "",
                          text: tech.text,
                          color: tech.color,
                          logo: tech.logo,
                        })}
                        alt={tech.text}
                        style={{ width: "100%", height: 20, objectFit: "contain" }}
                      />
                      <span
                        style={{
                          fontSize: 8,
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "100%",
                        }}
                      >
                        {tech.text}
                      </span>
                    </button>
                  ))}
                  {filteredTech.length === 0 && (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        padding: "16px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: 11,
                      }}
                    >
                      No results for &quot;{searchText}&quot;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badge display container */}
      <div
        contentEditable={false}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          width: "100%",
          justifyContent:
            alignment === "center"
              ? "center"
              : alignment === "right"
                ? "flex-end"
                : "flex-start",
        }}
      >
        {badges.map((badge, index) => (
          <div
            key={badge.id}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderRadius: 4,
              padding: "2px",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={buildShieldsUrl(badge)}
              alt={badge.text}
              style={{ height: 28, cursor: "default" }}
            />

            {/* Hover actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                opacity: 0,
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={index === 0}
                title="Move left"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-muted)",
                  cursor: index === 0 ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  opacity: index === 0 ? 0.3 : 1,
                }}
              >
                <ChevronUp size={10} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={index === badges.length - 1}
                title="Move right"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-muted)",
                  cursor: index === badges.length - 1 ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  opacity: index === badges.length - 1 ? 0.3 : 1,
                }}
              >
                <ChevronDown size={10} />
              </button>
              <button
                onClick={(e) => handleRemoveBadge(badge.id, e)}
                onMouseDown={(e) => e.stopPropagation()}
                title="Remove"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  border: "1px solid rgba(255,100,100,0.3)",
                  background: "rgba(248, 81, 73, 0.15)",
                  color: "#ff7b72",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                <Trash2 size={9} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
