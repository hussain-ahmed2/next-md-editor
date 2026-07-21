"use client";

import { useEffect, useState } from "react";
import { LogOut, Rocket } from "lucide-react";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { DeployWizard } from "@/components/deploy/DeployWizard";
import { ToolbarButton } from "@/components/editor/toolbar/ToolbarButton";

function GithubMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menuOpen]);

  if (isPending) return null;

  if (!session) {
    return (
      <ToolbarButton
        onClick={() => signIn.social({ provider: "github", callbackURL: "/editor" })}
        tooltip="Sign in with GitHub — autofill your stats and deploy your own cards"
      >
        <GithubMark size={14} />
        <span className="btn-label">Sign in</span>
      </ToolbarButton>
    );
  }

  const user = session.user;

  return (
    <>
      <div style={{ position: "relative" }} onMouseDown={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          title={user.name}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            overflow: "hidden",
            border: "1.5px solid var(--border)",
            background: "var(--bg-hover)",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
          }}
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name} style={{ width: "100%", height: "100%" }} />
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-primary)" }}>
              {user.name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </button>
        {menuOpen && (
          <div
            className="ws-context-menu"
            style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, left: "auto" }}
          >
            <div
              style={{
                padding: "6px 10px",
                fontSize: 12,
                color: "var(--text-muted)",
                borderBottom: "1px solid var(--border-subtle)",
                marginBottom: 4,
              }}
            >
              Signed in as <strong style={{ color: "var(--text-secondary)" }}>{user.name}</strong>
            </div>
            <button
              className="ws-context-item"
              onClick={() => {
                setWizardOpen(true);
                setMenuOpen(false);
              }}
            >
              <Rocket size={14} /> Deploy your stats on Vercel
            </button>
            <button
              className="ws-context-item"
              onClick={() => {
                signOut();
                setMenuOpen(false);
              }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>
      {wizardOpen && (
        <DeployWizard username={user.name ?? ""} onClose={() => setWizardOpen(false)} />
      )}
    </>
  );
}
