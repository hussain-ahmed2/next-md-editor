/**
 * Bridge between the workspace store and the active-file persistence hook.
 *
 * The hook debounces writes of the active file's content. Before the store
 * switches/closes/deletes files it must synchronously flush any pending
 * write so edits can never land on the wrong file (or be lost).
 */

let flushFn: (() => void) | null = null;

export function registerFlush(fn: (() => void) | null): void {
  flushFn = fn;
}

export function flushPendingSave(): void {
  flushFn?.();
}
