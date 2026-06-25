"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Replace, ReplaceAll, X, CaseSensitive, Regex } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block, RichText } from "@next-md-editor/types";
import { deleteRichRange, insertRichText } from "@next-md-editor/markdown";

interface SearchMatch {
  blockId: string;
  field: string;
  offset: number;
  length: number;
}

function extractBlockText(block: Block): string {
  const p = block.props;
  switch (block.type) {
    case "heading":
    case "paragraph":
      return ((p.content as RichText) ?? []).map((s) => s.text).join("");
    case "quote":
    case "callout":
      return (p.text as string) ?? "";
    case "code":
      return (p.code as string) ?? "";
    case "bullet-list":
    case "numbered-list": {
      const items = p.items as Array<{ content: RichText }> | undefined;
      if (!items) return "";
      return items.map((i) => (i.content ?? []).map((s) => s.text).join("")).join(" ");
    }
    case "collapsible":
      return ((p.summary as string) ?? "") + " " + ((p.content as string) ?? "");
    default:
      return "";
  }
}

function findMatches(text: string, query: string, matchCase: boolean, useRegex: boolean): { offset: number; length: number }[] {
  if (!query) return [];
  const results: { offset: number; length: number }[] = [];
  try {
    if (useRegex) {
      const flags = matchCase ? "g" : "gi";
      const regex = new RegExp(query, flags);
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        results.push({ offset: m.index, length: m[0].length });
        if (!regex.global) break;
        if (m.index === regex.lastIndex) regex.lastIndex++;
      }
    } else {
      const searchStr = matchCase ? text : text.toLowerCase();
      const q = matchCase ? query : query.toLowerCase();
      let i = 0;
      while ((i = searchStr.indexOf(q, i)) !== -1) {
        results.push({ offset: i, length: query.length });
        i += query.length;
      }
    }
  } catch {
    // Invalid regex
  }
  return results;
}

function replaceInBlock(block: Block, field: string, match: SearchMatch, replacement: string): void {
  const updateBlock = useEditorStore.getState().updateBlock;
  const p = block.props;

  if (field === "content") {
    const content = [...((p.content as RichText) ?? [])];
    const newContent = deleteRichRange(content, match.offset, match.offset + match.length);
    const inserted = insertRichText(newContent, match.offset, replacement);
    updateBlock(block.id, { content: inserted });
  } else if (field === "items") {
    const items = [...((p.items as Array<{ content: RichText }>) ?? [])];
    let cursor = 0;
    for (let i = 0; i < items.length; i++) {
      const itemText = (items[i].content ?? []).map((s) => s.text).join("");
      const itemLen = itemText.length + 1; // +1 for the space separator
      if (match.offset >= cursor && match.offset < cursor + itemLen) {
        const localOffset = match.offset - cursor;
        const richText = [...items[i].content];
        const deleted = deleteRichRange(richText, localOffset, localOffset + match.length);
        const inserted = insertRichText(deleted, localOffset, replacement);
        items[i] = { ...items[i], content: inserted };
        break;
      }
      cursor += itemLen;
    }
    updateBlock(block.id, { items });
  } else if (field === "text") {
    const text = (p.text as string) ?? "";
    const newText = text.slice(0, match.offset) + replacement + text.slice(match.offset + match.length);
    updateBlock(block.id, { text: newText });
  } else if (field === "code") {
    const code = (p.code as string) ?? "";
    const newCode = code.slice(0, match.offset) + replacement + code.slice(match.offset + match.length);
    updateBlock(block.id, { code: newCode });
  }
}

export function SearchReplaceOverlay() {
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const blocks = useEditorStore((s) => s.blocks);

  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const scrollToBlock = useCallback((blockId: string) => {
    const el = document.querySelector(`[data-block-id="${blockId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const matches = useMemo((): SearchMatch[] => {
    if (!query) return [];
    const result: SearchMatch[] = [];

    for (const block of blocks) {
      const p = block.props;
      let text = "";
      let field = "";

      if (block.type === "paragraph" || block.type === "heading") {
        text = extractBlockText(block);
        field = "content";
      } else if (block.type === "quote" || block.type === "callout") {
        text = (p.text as string) ?? "";
        field = "text";
      } else if (block.type === "code") {
        text = (p.code as string) ?? "";
        field = "code";
      } else if (block.type === "bullet-list" || block.type === "numbered-list") {
        text = extractBlockText(block);
        field = "items";
      }

      if (!text) continue;
      const found = findMatches(text, query, matchCase, useRegex);
      for (const m of found) {
        result.push({ blockId: block.id, field, offset: m.offset, length: m.length });
      }
    }
    return result;
  }, [blocks, query, matchCase, useRegex]);

  const clampedIndex = Math.min(currentIndex, Math.max(0, matches.length - 1));

  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  const [prevSearchState, setPrevSearchState] = useState({ query, matchCase, useRegex });
  if (
    query !== prevSearchState.query ||
    matchCase !== prevSearchState.matchCase ||
    useRegex !== prevSearchState.useRegex
  ) {
    setPrevSearchState({ query, matchCase, useRegex });
    setCurrentIndex(0);
  }

  useEffect(() => {
    if (matches.length > 0 && matches[clampedIndex]) {
      scrollToBlock(matches[clampedIndex].blockId);
    }
  }, [clampedIndex, matches, scrollToBlock]);

  const handleNext = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const handlePrev = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const handleReplace = useCallback(() => {
    if (matches.length === 0 || clampedIndex >= matches.length || !replacement) return;
    const match = matches[clampedIndex];
    const block = blocks.find((b) => b.id === match.blockId);
    if (!block) return;
    replaceInBlock(block, match.field, match, replacement);
    setCurrentIndex((prev) => Math.min(prev, matches.length - 2));
  }, [matches, clampedIndex, blocks, replacement]);

  const handleReplaceAll = useCallback(() => {
    if (matches.length === 0 || !replacement) return;
    for (const match of matches) {
      const block = useEditorStore.getState().blocks.find((b) => b.id === match.blockId);
      if (!block) continue;
      replaceInBlock(block, match.field, match, replacement);
    }
    setCurrentIndex(0);
  }, [matches, replacement]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) handlePrev();
        else handleNext();
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    },
    [handleNext, handlePrev, setSearchOpen],
  );

  if (!isSearchOpen) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 16px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        flexShrink: 0,
        flexWrap: "wrap",
      }}
      onKeyDown={handleKeyDown}
    >
      <div style={{ position: "relative", flex: "0 1 200px", minWidth: 120 }}>
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find…"
          style={{
            width: "100%",
            padding: "5px 28px 5px 8px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--bg-base)",
            color: "var(--text-primary)",
            fontSize: 12.5,
            outline: "none",
            fontFamily: "var(--font-sans)",
            boxSizing: "border-box",
          }}
        />
        <span
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 10,
            color: "var(--text-muted)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {matches.length > 0 ? `${clampedIndex + 1} / ${matches.length}` : ""}
        </span>
      </div>

      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          onClick={handlePrev}
          disabled={matches.length === 0}
          title="Previous match (Shift+Enter)"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: matches.length > 0 ? "pointer" : "default",
            opacity: matches.length > 0 ? 1 : 0.4,
            padding: 0,
          }}
        >
          <ArrowUp size={12} />
        </button>
        <button
          onClick={handleNext}
          disabled={matches.length === 0}
          title="Next match (Enter)"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: matches.length > 0 ? "pointer" : "default",
            opacity: matches.length > 0 ? 1 : 0.4,
            padding: 0,
          }}
        >
          <ArrowDown size={12} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        <div style={{ position: "relative", flex: "0 1 160px", minWidth: 80 }}>
          <input
            ref={replaceRef}
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Replace…"
            style={{
              width: "100%",
              padding: "5px 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-base)",
              color: "var(--text-primary)",
              fontSize: 12.5,
              outline: "none",
              fontFamily: "var(--font-sans)",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={handleReplace}
          disabled={matches.length === 0 || !replacement}
          title="Replace"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: matches.length > 0 && replacement ? "pointer" : "default",
            opacity: matches.length > 0 && replacement ? 1 : 0.4,
            padding: 0,
          }}
        >
          <Replace size={12} />
        </button>
        <button
          onClick={handleReplaceAll}
          disabled={matches.length === 0 || !replacement}
          title="Replace all"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 24,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: matches.length > 0 && replacement ? "pointer" : "default",
            opacity: matches.length > 0 && replacement ? 1 : 0.4,
            padding: "0 6px",
            fontSize: 11,
            whiteSpace: "nowrap",
          }}
        >
          <ReplaceAll size={12} />
          <span style={{ marginLeft: 3 }}>All</span>
        </button>
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        <button
          onClick={() => setMatchCase((c) => !c)}
          title="Match case"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            border: `1px solid ${matchCase ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)",
            background: matchCase ? "var(--accent-muted)" : "transparent",
            color: matchCase ? "var(--accent)" : "var(--text-secondary)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <CaseSensitive size={12} />
        </button>
        <button
          onClick={() => setUseRegex((r) => !r)}
          title="Use regex"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            border: `1px solid ${useRegex ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)",
            background: useRegex ? "var(--accent-muted)" : "transparent",
            color: useRegex ? "var(--accent)" : "var(--text-secondary)",
            cursor: "pointer",
            padding: 0,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          <Regex size={12} />
        </button>
      </div>

      <button
        onClick={() => setSearchOpen(false)}
        title="Close (Esc)"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          border: "none",
          borderRadius: "var(--radius-sm)",
          background: "transparent",
          color: "var(--text-secondary)",
          cursor: "pointer",
          marginLeft: "auto",
          padding: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
