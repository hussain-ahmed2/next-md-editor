"use client";

import { useMemo, useState } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { GitFork, Rocket, Settings2 } from "lucide-react";
import { themes } from "@/lib/cards/themes";
import { useSettingsStore } from "@/store/settingsStore";
import { useSession } from "@/lib/auth-client";
import { buildCardUrl, type CardKind, type StatsBlockProps } from "@/lib/cards/card-url";

const CARD_KINDS: { value: CardKind; label: string }[] = [
  { value: "stats", label: "Stats card" },
  { value: "top-langs", label: "Top languages" },
  { value: "pin", label: "Repo pin" },
];

const LAYOUTS = [
  { value: "normal", label: "Normal" },
  { value: "compact", label: "Compact" },
  { value: "donut", label: "Donut" },
  { value: "donut-vertical", label: "Donut vertical" },
  { value: "pie", label: "Pie" },
];

const selectStyle: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 12,
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  outline: "none",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};

const inputStyle: React.CSSProperties = {
  ...selectStyle,
  cursor: "text",
  width: 150,
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12,
  color: "var(--text-secondary)",
  cursor: "pointer",
  userSelect: "none",
};

export function GithubStatsBlock({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const blocks = useEditorStore((s) => s.blocks);
  const myBlock = blocks.find((b) => b.id === block.id) ?? block;
  const props = myBlock.props as StatsBlockProps;
  const statsInstanceUrl = useSettingsStore((s) => s.statsInstanceUrl);

  const username = props.username ?? "";
  const card = (props.card as CardKind) ?? "stats";
  const theme = props.theme ?? "default";

  // Signed-in GitHub login (user.name is mapped to the login handle)
  const { data: session } = useSession();
  const sessionLogin = session?.user?.name ?? "";

  const [configOpen, setConfigOpen] = useState(!username);
  const [usernameDraft, setUsernameDraft] = useState(username || sessionLogin);
  const [repoDraft, setRepoDraft] = useState(props.repo ?? "");

  const update = (patch: Partial<StatsBlockProps>) =>
    updateBlock(block.id, patch as Record<string, unknown>);

  const previewUrl = useMemo(() => {
    if (!username || (card === "pin" && !props.repo)) return null;
    return buildCardUrl(props, props.useOwnInstance ? statsInstanceUrl : "");
  }, [props, username, card, statsInstanceUrl]);

  const commitIdentity = () => {
    const patch: Partial<StatsBlockProps> = {};
    if (usernameDraft.trim()) patch.username = usernameDraft.trim();
    if (card === "pin" && repoDraft.trim()) patch.repo = repoDraft.trim();
    if (Object.keys(patch).length > 0) update(patch);
  };

  return (
    <div
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-surface)",
        margin: "8px 0",
        overflow: "hidden",
      }}
    >
      {/* Config header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderBottom: configOpen ? "1px solid var(--border-subtle)" : "none",
          flexWrap: "wrap",
        }}
      >
        <GitFork size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
          GitHub card
        </span>
        <select
          value={card}
          onChange={(e) => update({ card: e.target.value as CardKind })}
          style={selectStyle}
        >
          {CARD_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <select
          value={theme}
          onChange={(e) => update({ theme: e.target.value })}
          style={selectStyle}
          title="Card theme"
        >
          {Object.keys(themes)
            .filter((t) => !t.endsWith("_repocard"))
            .map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
        </select>
        <button
          onClick={() => setConfigOpen((o) => !o)}
          style={{ ...selectStyle, display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" }}
          title="Card options"
        >
          <Settings2 size={13} /> Options
        </button>
      </div>

      {/* Config body */}
      {configOpen && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            flexWrap: "wrap",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <input
            value={usernameDraft}
            onChange={(e) => setUsernameDraft(e.target.value)}
            onBlur={commitIdentity}
            onKeyDown={(e) => e.key === "Enter" && commitIdentity()}
            placeholder="GitHub username"
            style={inputStyle}
          />
          {card === "pin" && (
            <input
              value={repoDraft}
              onChange={(e) => setRepoDraft(e.target.value)}
              onBlur={commitIdentity}
              onKeyDown={(e) => e.key === "Enter" && commitIdentity()}
              placeholder="Repository name"
              style={inputStyle}
            />
          )}
          {card !== "pin" && (
            <label style={labelStyle}>
              <input
                type="checkbox"
                checked={props.showIcons ?? false}
                onChange={(e) => update({ showIcons: e.target.checked })}
              />
              Icons
            </label>
          )}
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={props.hideBorder ?? false}
              onChange={(e) => update({ hideBorder: e.target.checked })}
            />
            Hide border
          </label>
          {card === "stats" && (
            <label style={labelStyle}>
              <input
                type="checkbox"
                checked={props.hideRank ?? false}
                onChange={(e) => update({ hideRank: e.target.checked })}
              />
              Hide rank
            </label>
          )}
          {card === "top-langs" && (
            <select
              value={props.layout ?? "normal"}
              onChange={(e) => update({ layout: e.target.value })}
              style={selectStyle}
              title="Layout"
            >
              {LAYOUTS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          )}
          {statsInstanceUrl && (
            <label style={labelStyle} title={`Serve from ${statsInstanceUrl}`}>
              <input
                type="checkbox"
                checked={props.useOwnInstance ?? false}
                onChange={(e) =>
                  update({ useOwnInstance: e.target.checked, instanceUrl: statsInstanceUrl })
                }
              />
              <Rocket size={12} /> My Vercel instance
            </label>
          )}
        </div>
      )}

      {/* Live preview */}
      <div style={{ padding: 14, display: "flex", justifyContent: "center" }}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="GitHub stats card preview"
            style={{ maxWidth: "100%" }}
            key={previewUrl}
          />
        ) : (
          <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {card === "pin"
              ? "Enter a GitHub username and repository to preview the card."
              : "Enter a GitHub username to preview the card."}
          </span>
        )}
      </div>
    </div>
  );
}
