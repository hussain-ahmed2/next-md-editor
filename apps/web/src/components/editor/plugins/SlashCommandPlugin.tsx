"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import { v4 as uuidv4 } from "uuid";
import { BlockRegistry, useEditorStore } from "@next-md-editor/editor-core";
import { SlashCommandMenu, type SlashMenuItem } from "../SlashCommandMenu";

const SLASH_QUERY = /(?:^|\s)\/([a-zA-Z0-9-]*)$/;

function fuzzyScore(type: string, q: string): number {
  const t = type.toLowerCase();
  if (!q) return 1;
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length ? 1 : 0;
}

function prettyLabel(type: string): string {
  return type
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface MenuState {
  query: string;
  position: { top: number; left: number };
}

/**
 * Notion-style slash commands: typing "/" in a rich-text block opens a
 * fuzzy-searchable block menu; selecting an entry strips the "/query"
 * text and inserts the chosen block right below the current one.
 */
export function SlashCommandPlugin({ blockId }: { blockId: string }) {
  const [editor] = useLexicalComposerContext();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: SlashMenuItem[] = useMemo(() => {
    if (menu === null) return [];
    const q = menu.query.toLowerCase();
    return BlockRegistry.getAll()
      .map((def) => ({
        type: def.type,
        label: prettyLabel(def.type),
        defaultProps: def.defaultProps ?? {},
        s: fuzzyScore(def.type, q),
      }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
  }, [menu]);

  const close = useCallback(() => {
    setMenu(null);
    setSelectedIndex(0);
  }, []);

  const applySelection = useCallback(
    (item: SlashMenuItem) => {
      // 1) Strip the "/query" text the user typed
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel) || !sel.isCollapsed()) return;
        const node = sel.anchor.getNode();
        if (!$isTextNode(node)) return;
        const offset = sel.anchor.offset;
        const before = node.getTextContent().slice(0, offset);
        const m = before.match(SLASH_QUERY);
        if (!m) return;
        const start = offset - (m[1].length + 1);
        node.spliceText(start, m[1].length + 1, "", true);
      });
      // 2) Insert the chosen block below the current one
      const { blocks, addBlock } = useEditorStore.getState();
      const idx = blocks.findIndex((b) => b.id === blockId);
      addBlock(
        { id: uuidv4(), type: item.type, props: { ...item.defaultProps } },
        idx === -1 ? undefined : idx + 1,
      );
      close();
    },
    [editor, blockId, close],
  );

  // Track the "/query" as the user types
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel) || !sel.isCollapsed()) {
          close();
          return;
        }
        const node = sel.anchor.getNode();
        if (!$isTextNode(node)) {
          close();
          return;
        }
        const before = node.getTextContent().slice(0, sel.anchor.offset);
        const m = before.match(SLASH_QUERY);
        if (!m) {
          close();
          return;
        }

        const domSel = window.getSelection();
        const container = editor.getRootElement()?.closest(".lexical-editor-container");
        if (!domSel || domSel.rangeCount === 0 || !container) return;
        const rect = domSel.getRangeAt(0).getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        setMenu({
          query: m[1],
          position: {
            top: rect.bottom - containerRect.top,
            left: Math.max(0, rect.left - containerRect.left),
          },
        });
        setSelectedIndex(0);
      });
    });
  }, [editor, close]);

  // Keyboard navigation while the menu is open
  useEffect(() => {
    if (menu === null) return;

    const unregisterDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (e) => {
        e?.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
    const unregisterUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (e) => {
        e?.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (e) => {
        if (items.length === 0) return false;
        e?.preventDefault();
        applySelection(items[Math.min(selectedIndex, items.length - 1)]);
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
    const unregisterEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        close();
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
    return () => {
      unregisterDown();
      unregisterUp();
      unregisterEnter();
      unregisterEscape();
    };
  }, [editor, menu, items, selectedIndex, applySelection, close]);

  if (menu === null || items.length === 0) return null;

  return (
    <SlashCommandMenu
      position={menu.position}
      items={items}
      selectedIndex={Math.min(selectedIndex, items.length - 1)}
      onSelect={applySelection}
    />
  );
}
