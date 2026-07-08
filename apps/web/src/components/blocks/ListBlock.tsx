"use client";

import { useMemo } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { itemsToHtml, htmlToItems, defaultItems } from "./listBlockUtils";
import type { ListItemData } from "./listBlockUtils";
import { LexicalRichText } from "@/components/editor/LexicalRichText";

export function ListBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const myBlock = blocks.find((b) => b.id === block.id) ?? block;
  const styleType = (myBlock.props.style as "bullet" | "numbered") ?? "bullet";

  const initialHtml = useMemo(() => {
    // If we've already migrated to using content, prefer that.
    if (typeof myBlock.props.content === "string" && myBlock.props.content) {
      return myBlock.props.content;
    }

    // Otherwise generate HTML from legacy items
    let items: ListItemData[];
    if (Array.isArray(myBlock.props.items)) {
      items = myBlock.props.items as ListItemData[];
    } else {
      const html = (myBlock.props.html as string) ?? "";
      if (html) {
        const parsed = htmlToItems(html);
        items = parsed.length > 0 ? parsed : defaultItems();
      } else {
        items = defaultItems();
      }
    }
    
    // Convert items back to full HTML wrapped in the list tag
    return itemsToHtml(items, styleType);
  }, [myBlock.props.content, myBlock.props.items, myBlock.props.html, styleType]);

  return (
    <div
      className="rich-list-content"
      style={{
        position: "relative",
        padding: "4px 8px",
        borderRadius: "var(--radius-md)",
      }}
    >
      <LexicalRichText
        blockId={block.id}
        initialHtml={initialHtml}
        placeholder="List item..."
      />
    </div>
  );
}
