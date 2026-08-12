import { describe, expect, it } from "vitest";

/**
 * Multi-block drag insert-index math.
 *
 * dnd-kit reports `source.index` as the post-move index computed as if only
 * ONE item were removed, but `moveBlocks` removes the entire selection before
 * splicing. Dragging a multi-block selection downward therefore landed
 * (selectionSize - 1) slots too far. This mirrors the adjustment in
 * `useDragAndDrop.handleDragEnd` and the splice in `editorStore.moveBlocks`.
 */

/** The correction applied in useDragAndDrop. */
function insertIndexFor(
  blockIds: string[],
  idsToMove: string[],
  sourceId: string,
  toIndex: number,
): number {
  if (idsToMove.length <= 1) return toIndex;
  const movedAbove = idsToMove.reduce((count, id) => {
    if (id === sourceId) return count;
    const idx = blockIds.indexOf(id);
    return idx !== -1 && idx < toIndex ? count + 1 : count;
  }, 0);
  return Math.max(0, toIndex - movedAbove);
}

/** The store's move: remove all selected, then splice at the index. */
function applyMove(blockIds: string[], idsToMove: string[], toIndex: number): string[] {
  const set = new Set(idsToMove);
  const moving = blockIds.filter((b) => set.has(b));
  const remaining = blockIds.filter((b) => !set.has(b));
  const safe = Math.max(0, Math.min(toIndex, remaining.length));
  return [...remaining.slice(0, safe), ...moving, ...remaining.slice(safe)];
}

function drag(blockIds: string[], idsToMove: string[], sourceId: string, reportedIndex: number) {
  return applyMove(
    blockIds,
    idsToMove,
    insertIndexFor(blockIds, idsToMove, sourceId, reportedIndex),
  );
}

describe("multi-block drag insert index", () => {
  it("moves a 2-block selection downward to the right slot", () => {
    // [A B C D E], drag A with A+B selected, dnd-kit reports index 3
    expect(drag(["A", "B", "C", "D", "E"], ["A", "B"], "A", 3)).toEqual([
      "C",
      "D",
      "A",
      "B",
      "E",
    ]);
  });

  it("moves a 3-block selection downward to the right slot", () => {
    expect(drag(["A", "B", "C", "D", "E", "F"], ["A", "B", "C"], "A", 3)).toEqual([
      "D",
      "A",
      "B",
      "C",
      "E",
      "F",
    ]);
  });

  it("leaves upward multi-drags unchanged", () => {
    // Dragging D (D+E selected) up to index 1: nothing moved is above the target
    expect(drag(["A", "B", "C", "D", "E"], ["D", "E"], "D", 1)).toEqual([
      "A",
      "D",
      "E",
      "B",
      "C",
    ]);
  });

  it("leaves single-block drags unchanged", () => {
    expect(drag(["A", "B", "C"], ["A"], "A", 2)).toEqual(["B", "C", "A"]);
    expect(drag(["A", "B", "C"], ["C"], "C", 0)).toEqual(["C", "A", "B"]);
  });
});
