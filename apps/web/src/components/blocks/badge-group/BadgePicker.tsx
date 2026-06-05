"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Badge, TechItem, TECH_LOGOS, buildShieldsUrl } from "./constants";

interface BadgePickerProps {
  onAddPreset: (tech: TechItem) => void;
  onCreateCustom: (badge: Omit<Badge, "id">) => void;
  pickerRef: React.RefObject<HTMLDivElement | null>;
}

export function BadgePicker({
  onAddPreset,
  onCreateCustom,
  pickerRef,
}: BadgePickerProps) {
  const [pickerTab, setPickerTab] = useState<"search" | "custom">("search");
  const [searchText, setSearchText] = useState("");

  // Custom badge fields state
  const [customLabel, setCustomLabel] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [customColor, setCustomColor] = useState("blue");
  const [customLogo, setCustomLogo] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  const handleCreateCustom = () => {
    if (customUrl.trim()) {
      onCreateCustom({
        text: customLabel.trim() || "badge",
        color: "000000",
        logo: "",
        url: customUrl.trim(),
      });
    } else {
      const label = encodeURIComponent(customLabel.trim().replace(/-/g, "--") || "badge");
      const message = encodeURIComponent(customMessage.trim().replace(/-/g, "--") || "");
      const color = customColor.trim().replace("#", "") || "blue";
      const logoStr = customLogo.trim() ? `&logo=${encodeURIComponent(customLogo.trim())}&logoColor=white` : "";
      const builtUrl = message
        ? `https://img.shields.io/badge/${label}-${message}-${color}?style=for-the-badge${logoStr}`
        : `https://img.shields.io/badge/${label}-${color}?style=for-the-badge${logoStr}`;

      onCreateCustom({
        text: customMessage.trim() ? `${customLabel.trim()}-${customMessage.trim()}` : customLabel.trim(),
        color,
        logo: customLogo.trim(),
        url: builtUrl,
      });
    }

    // Reset custom fields
    setCustomLabel("");
    setCustomMessage("");
    setCustomColor("blue");
    setCustomLogo("");
    setCustomUrl("");
  };

  const filteredTech = useMemo(() => {
    if (!searchText) return TECH_LOGOS;
    const q = searchText.toLowerCase();
    return TECH_LOGOS.filter(
      (t) =>
        t.text.toLowerCase().includes(q) ||
        t.logo.toLowerCase().includes(q)
    );
  }, [searchText]);

  return (
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
      {/* Tabs Header */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
        }}
      >
        <button
          onClick={() => setPickerTab("search")}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 11,
            fontWeight: 600,
            color: pickerTab === "search" ? "var(--text-primary)" : "var(--text-muted)",
            border: "none",
            background: pickerTab === "search" ? "var(--bg-elevated)" : "transparent",
            borderBottom: pickerTab === "search" ? "2px solid var(--accent)" : "none",
            cursor: "pointer",
          }}
        >
          Preset Tech
        </button>
        <button
          onClick={() => setPickerTab("custom")}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 11,
            fontWeight: 600,
            color: pickerTab === "custom" ? "var(--text-primary)" : "var(--text-muted)",
            border: "none",
            background: pickerTab === "custom" ? "var(--bg-elevated)" : "transparent",
            borderBottom: pickerTab === "custom" ? "2px solid var(--accent)" : "none",
            cursor: "pointer",
          }}
        >
          Custom Badge
        </button>
      </div>

      {/* Search / Form content */}
      {pickerTab === "custom" ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "12px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>LABEL</label>
            <input
              type="text"
              placeholder="e.g. license, build"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 4,
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: 11,
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>MESSAGE (OPTIONAL)</label>
            <input
              type="text"
              placeholder="e.g. MIT, passing"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 4,
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: 11,
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>COLOR (HEX/NAME)</label>
              <input
                type="text"
                placeholder="e.g. blue, 4E9BCD"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontSize: 11,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>LOGO (OPTIONAL)</label>
              <input
                type="text"
                placeholder="e.g. github, react"
                value={customLogo}
                onChange={(e) => setCustomLogo(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontSize: 11,
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>OR DIRECT BADGE URL</label>
            <input
              type="text"
              placeholder="https://example.com/badge.svg"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 4,
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: 11,
                outline: "none",
              }}
            />
          </div>

          <button
            onClick={handleCreateCustom}
            style={{
              marginTop: 4,
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Create Badge
          </button>
        </div>
      ) : (
        <>
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
                onClick={() => onAddPreset(tech)}
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
        </>
      )}
    </div>
  );
}
