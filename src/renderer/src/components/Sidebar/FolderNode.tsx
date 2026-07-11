import type { Folder } from '@shared/types'
import { positionFromEvent } from './dragTypes'
import type { TreeCtx } from './treeCtx'
import { FolderStylePicker } from './FolderStylePicker'
import { getFolderIcon } from './folderIcons'
import { NoteRow } from './NoteRow'
import styles from './Sidebar.module.css'

export function FolderNode({
  folder,
  depth,
  ctx
}: {
  folder: Folder
  depth: number
  ctx: TreeCtx
}): React.JSX.Element {
  const isCollapsed = ctx.collapsed.has(folder.id)
  const children = ctx.childFoldersOf(folder.id)
  const notes = ctx.notesOf(folder.id)
  const dt = ctx.dropTarget
  const isDropOnThis = dt?.kind === 'folder' && dt.id === folder.id
  const editing = ctx.editingFolderId === folder.id
  const FolderIcon = getFolderIcon(folder.icon)

  return (
    <div className={styles.folder} style={{ marginLeft: depth === 0 ? 0 : 10 }}>
      <div
        className={
          isDropOnThis && dt?.position === 'into'
            ? `${styles.folderHead} ${styles.dropOver}`
            : styles.folderHead
        }
        draggable
        onDragStart={(e) => {
          e.stopPropagation()
          ctx.startDragFolder(folder.id)
        }}
        onDragEnd={() => ctx.endDrag()}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const position = positionFromEvent(e, true)
          ctx.setDropTarget({ kind: 'folder', id: folder.id, position })
        }}
        onDragLeave={() => ctx.setDropTarget(null)}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const position = positionFromEvent(e, true)
          ctx.resolveDrop({ kind: 'folder', id: folder.id, position })
        }}
      >
        {isDropOnThis && dt?.position === 'before' && (
          <span className={styles.insertLine} data-pos="before" />
        )}
        <button className={styles.caret} onClick={() => ctx.toggle(folder.id)}>
          {isCollapsed ? '▸' : '▾'}
        </button>
        <span className={styles.folderIcon}>
          <FolderIcon size={15} color={folder.color ?? 'var(--text-muted)'} strokeWidth={2} />
        </span>
        {editing ? (
          <input
            className={styles.folderInput}
            autoFocus
            defaultValue={folder.name}
            onBlur={(e) => {
              ctx.renameFolder(folder.id, e.target.value)
              ctx.setEditingFolderId(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') ctx.setEditingFolderId(null)
            }}
          />
        ) : (
          <span
            className={styles.folderName}
            onDoubleClick={() => ctx.setEditingFolderId(folder.id)}
            title="Double-click to rename"
          >
            {folder.name}
          </span>
        )}
        <span className={styles.count}>{notes.length}</span>
        <button
          className={styles.iconBtn}
          title="Style (color / icon)"
          onClick={(e) => {
            e.stopPropagation()
            ctx.setOpenPickerId(ctx.openPickerId === folder.id ? null : folder.id)
          }}
        >
          🎨
        </button>
        <button
          className={styles.iconBtn}
          title="New subfolder"
          onClick={() => ctx.newSubfolder(folder.id)}
        >
          🗀+
        </button>
        <button className={styles.iconBtn} title="New note in folder" onClick={() => ctx.newNote(folder.id)}>
          +
        </button>
        <button
          className={styles.iconBtn}
          title="Delete folder (notes are kept)"
          onClick={() => ctx.requestDeleteFolder(folder.id, folder.name)}
        >
          ✕
        </button>
        {isDropOnThis && dt?.position === 'after' && (
          <span className={styles.insertLine} data-pos="after" />
        )}

        {ctx.openPickerId === folder.id && (
          <FolderStylePicker
            color={folder.color}
            icon={folder.icon}
            onChange={(style) => ctx.updateFolderStyle(folder.id, style)}
            onClose={() => ctx.setOpenPickerId(null)}
          />
        )}
      </div>

      {!isCollapsed && (
        <div className={styles.folderBody}>
          {children.map((child) => (
            <FolderNode key={child.id} folder={child} depth={depth + 1} ctx={ctx} />
          ))}
          <ul className={styles.folderNotes}>
            {notes.map((n) => {
              const noteIndicator =
                dt?.kind === 'note' && dt.id === n.id ? (dt.position as 'before' | 'after') : null
              return (
                <NoteRow
                  key={n.id}
                  note={n}
                  active={n.id === ctx.currentNoteId}
                  editing={ctx.editingNoteId === n.id}
                  indicator={noteIndicator}
                  onSelect={() => ctx.selectNote(n.id)}
                  onStartRename={() => ctx.setEditingNoteId(n.id)}
                  onRename={(title) => {
                    ctx.renameNote(n.id, title)
                    ctx.setEditingNoteId(null)
                  }}
                  onCancelRename={() => ctx.setEditingNoteId(null)}
                  onRequestDelete={() => ctx.requestDeleteNote(n.id, n.title)}
                  onDragStart={() => ctx.startDragNote(n.id)}
                  onDragEnd={() => ctx.endDrag()}
                  onDragOver={(e) => {
                    const position = positionFromEvent(e, false) as 'before' | 'after'
                    ctx.setDropTarget({ kind: 'note', id: n.id, position })
                  }}
                  onDragLeave={() => ctx.setDropTarget(null)}
                  onDrop={(e) => {
                    const position = positionFromEvent(e, false) as 'before' | 'after'
                    ctx.resolveDrop({ kind: 'note', id: n.id, position })
                  }}
                />
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
