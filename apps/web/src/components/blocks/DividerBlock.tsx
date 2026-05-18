"use client";

import type { Block } from "@next-md-editor/types";

export function DividerBlock({ block: _ }: { block: Block }) {
  return (
    <div style={{ padding: "12px 0" }}>
      <hr style={{
        height: "0.25em",
        backgroundColor: "#30363d",
        border: 0,
        margin: 0,
      }} />
    </div>
  );
}
