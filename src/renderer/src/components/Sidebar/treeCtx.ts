import type { Folder, NoteSummary } from '@shared/types'
import type { DropTarget } from './dragTypes'

/** Shared callbacks/state threaded through the recursive folder tree. */
export interface TreeCtx {
  childFoldersOf(parentId: number | null): Folder[]
  notesOf(folderId: number | null): NoteSummary[]
  collapsed: Set<number>
  toggle(id: number): void
  currentNoteId: number | null
  selectNote(id: number): void
  requestDeleteNote(id: number, title: string): void
  newNote(folderId: number | null): void
  newSubfolder(parentId: number): void
  editingFolderId: number | null
  setEditingFolderId(id: number | null): void
  editingNoteId: number | null
  setEditingNoteId(id: number | null): void
  renameNote(id: number, title: string): void
  renameFolder(id: number, name: string): void
  requestDeleteFolder(id: number, name: string): void
  openPickerId: number | null
  setOpenPickerId(id: number | null): void
  updateFolderStyle(id: number, style: { color?: string | null; icon?: string | null }): void
  dropTarget: DropTarget | null
  setDropTarget(t: DropTarget | null): void
  resolveDrop(target: DropTarget): void
  startDragFolder(id: number): void
  startDragNote(id: number): void
  endDrag(): void
}

/** True if `descendantId` is `ancestorId` itself or nested anywhere under it. */
export function isSelfOrDescendant(
  folders: Folder[],
  ancestorId: number,
  descendantId: number
): boolean {
  if (ancestorId === descendantId) return true
  const byParent = new Map<number, number[]>()
  folders.forEach((f) => {
    if (f.parentId != null) byParent.set(f.parentId, [...(byParent.get(f.parentId) ?? []), f.id])
  })
  const stack = [...(byParent.get(ancestorId) ?? [])]
  while (stack.length) {
    const id = stack.pop()!
    if (id === descendantId) return true
    stack.push(...(byParent.get(id) ?? []))
  }
  return false
}
