/**
 * Pure text-splicing helper for inserting a symbol/snippet at a caret
 * position in a *controlled* textarea/input. Returns the new value and where
 * the caret should end up — `cursorOffsetFromEnd` lets a snippet like
 * `\frac{}{}` place the caret inside the first braces instead of at the end.
 * Callers are responsible for updating their own React state with the
 * returned value and then restoring the caret on the DOM node.
 */
export function spliceAtCursor(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  insertText: string,
  cursorOffsetFromEnd = 0
): { value: string; cursor: number } {
  const next = value.slice(0, selectionStart) + insertText + value.slice(selectionEnd)
  const cursor = selectionStart + insertText.length - cursorOffsetFromEnd
  return { value: next, cursor }
}
