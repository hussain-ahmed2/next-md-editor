"use client";

import React from "react";

interface Props {
  /** Block type, shown in the fallback so the user knows what failed. */
  blockType: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Isolates a single block's render failure.
 *
 * Without this, one malformed block (e.g. corrupted props from an imported
 * file) throws during render and React unmounts the whole editor tree —
 * the user loses access to their entire workspace. Here the damage is
 * contained to one block and the rest of the document stays editable.
 */
export class BlockErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`Block "${this.props.blockType}" failed to render:`, error, info);
  }

  // A new block object (e.g. the user edited the props) gets a fresh attempt.
  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.children !== this.props.children) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          padding: "10px 12px",
          borderRadius: "var(--radius-sm)",
          background: "var(--danger-muted)",
          border: "1px solid var(--danger-border)",
          color: "var(--danger)",
          fontSize: 12.5,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)" }}>
          Could not render <strong>{this.props.blockType}</strong> block
        </span>
        <button
          onClick={() => this.setState({ error: null })}
          className="ide-btn"
          style={{ color: "var(--danger)" }}
        >
          Retry
        </button>
        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
          The rest of your document is unaffected.
        </span>
      </div>
    );
  }
}
