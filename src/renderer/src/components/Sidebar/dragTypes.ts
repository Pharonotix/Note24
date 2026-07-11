/** Shared drag/drop types + the "which half of this row" position helper. */

export type DragItem = { kind: 'note' | 'folder'; id: number }

export type DropPosition = 'before' | 'after' | 'into'

export interface DropTarget {
  kind: 'note' | 'folder' | 'root'
  id: number | 'root'
  position: DropPosition
}

/**
 * Given a dragover event on a row, decides whether the drop should insert
 * before/after that row (top/bottom ~35% of its height) or land "into" it
 * (middle) — "into" only makes sense for folder targets (reparent).
 */
export function positionFromEvent(e: React.DragEvent, allowInto: boolean): DropPosition {
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = (e.clientY - rect.top) / rect.height
  if (allowInto && ratio > 0.3 && ratio < 0.7) return 'into'
  return ratio <= 0.5 ? 'before' : 'after'
}
