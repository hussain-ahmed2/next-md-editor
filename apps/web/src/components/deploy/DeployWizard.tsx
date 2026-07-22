"use client";

import { useState } from "react";
import { Check, ExternalLink, Loader2, Rocket, X } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";

const DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fanuraghazra%2Fgithub-readme-stats&env=PAT_1&envDescription=GitHub%20Personal%20Access%20Token%20(repo%2C%20read%3Auser%20scopes)&project-name=github-readme-stats&repository-name=github-readme-stats";

const PAT_URL =
  "https://github.com/settings/tokens/new?scopes=repo,read:user&description=github-readme-stats";

const stepTitleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: 6,
};

const stepNumStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "var(--accent-muted)",
  color: "var(--accent)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  flexShrink: 0,
};

const stepBodyStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  margin: "0 0 16px 30px",
};

/**
 * Guided flow for deploying a personal github-readme-stats instance on
 * Vercel. Entirely user-driven — we never touch their Vercel/GitHub
 * accounts; the deploy happens through Vercel's own Deploy Button flow.
 */
export function DeployWizard({ username, onClose }: { username: string; onClose: () => void }) {
  const setStatsInstanceUrl = useSettingsStore((s) => s.setStatsInstanceUrl);
  const savedUrl = useSettingsStore((s) => s.statsInstanceUrl);

  const [urlDraft, setUrlDraft] = useState(savedUrl);
  const [checkState, setCheckState] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [testUrl, setTestUrl] = useState<string | null>(null);

  const normalized = urlDraft.trim().replace(/\/+$/, "");

  const startValidation = () => {
    if (!/^https:\/\//.test(normalized)) {
      setCheckState("fail");
      return;
    }
    setCheckState("checking");
    // Loading the SVG as an image sidesteps CORS — onLoad means the
    // instance answered with a renderable card.
    setTestUrl(`${normalized}/api?username=${encodeURIComponent(username || "octocat")}`);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1500,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          maxHeight: "90vh",
          overflow: "auto",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-md)",
          padding: 16,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
            <Rocket size={16} style={{ color: "var(--accent)" }} />
            Deploy your own stats instance
          </div>
          <button
            onClick={onClose}
            className="ide-btn"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
          Running github-readme-stats on your own Vercel account gives you private-repo stats and
          your own rate limits. Three steps, all free:
        </p>

        <div style={stepTitleStyle}>
          <span style={stepNumStyle}>1</span> Create a GitHub token
        </div>
        <div style={stepBodyStyle}>
          Create a classic Personal Access Token with <code>repo</code> and <code>read:user</code>{" "}
          scopes. Copy it — Vercel will ask for it in the next step.
          <div style={{ marginTop: 8 }}>
            <a href={PAT_URL} target="_blank" rel="noopener noreferrer" className="ide-btn primary" style={{ textDecoration: "none" }}>
              Create token <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div style={stepTitleStyle}>
          <span style={stepNumStyle}>2</span> Deploy to Vercel
        </div>
        <div style={stepBodyStyle}>
          Vercel clones the github-readme-stats repository into your GitHub account and deploys it.
          Paste your token as the <code>PAT_1</code> environment variable when prompted.
          <div style={{ marginTop: 8 }}>
            <a href={DEPLOY_URL} target="_blank" rel="noopener noreferrer" className="ide-btn primary" style={{ textDecoration: "none" }}>
              Deploy with Vercel <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div style={stepTitleStyle}>
          <span style={stepNumStyle}>3</span> Connect your instance
        </div>
        <div style={{ ...stepBodyStyle, marginBottom: 8 }}>
          Paste your deployment URL (e.g.{" "}
          <code>https://github-readme-stats-yourname.vercel.app</code>) and we&apos;ll verify it,
          then use it for your stats cards automatically.
        </div>
        <div style={{ display: "flex", gap: 8, margin: "0 0 8px 30px", flexWrap: "wrap" }}>
          <input
            value={urlDraft}
            onChange={(e) => {
              setUrlDraft(e.target.value);
              setCheckState("idle");
            }}
            placeholder="https://your-instance.vercel.app"
            className="ide-input"
            style={{ flex: 1, minWidth: 220 }}
          />
          <button onClick={startValidation} className="ide-btn primary" disabled={checkState === "checking"}>
            {checkState === "checking" ? (
              <>
                <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Checking…
              </>
            ) : (
              "Verify & save"
            )}
          </button>
        </div>

        {testUrl && checkState === "checking" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={testUrl}
            alt=""
            style={{ display: "none" }}
            onLoad={() => {
              setStatsInstanceUrl(normalized);
              setCheckState("ok");
            }}
            onError={() => setCheckState("fail")}
          />
        )}

        {checkState === "ok" && (
          <div style={{ margin: "0 0 0 30px", fontSize: 13, color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={14} /> Instance connected! Stats blocks can now use it — toggle “My Vercel
            instance” in a GitHub card block.
          </div>
        )}
        {checkState === "fail" && (
          <div style={{ margin: "0 0 0 30px", fontSize: 13, color: "var(--danger)" }}>
            Could not reach that instance. Check the URL (it must start with https://) and that the
            deployment finished.
          </div>
        )}
      </div>
    </div>
  );
}
