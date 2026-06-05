"use client";

import { useEffect, RefObject } from "react";

/**
 * Auto-focuses the block's DOM ref when it becomes the last selected block.
 * Replaces the duplicated `useEffect` that exists in ImageBlock, ImageGridBlock,
 * BadgeGroupBlock, ListBlock and others.
 */
export function useBlockFocus(
  ref: RefObject<HTMLElement | null>,
  blockId: string,
  selectedBlockIds: string[],
) {
  useEffect(() => {
    const isSelected = selectedBlockIds[selectedBlockIds.length - 1] === blockId;
    if (isSelected && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [selectedBlockIds, blockId, ref]);
}
