import { useEffect, useState } from 'react'
import { FileText, LayoutTemplate, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useStore } from '../../store/store'
import { BUILTIN_TEMPLATES } from '../../lib/builtinTemplates'
import { ConfirmDialog, type ConfirmRequest } from '../ConfirmDialog/ConfirmDialog'
import styles from './TemplatePicker.module.css'

export function TemplatePicker(): React.JSX.Element | null {
  const open = useStore((s) => s.templatePickerOpen)
  const setOpen = useStore((s) => s.setTemplatePickerOpen)
  const currentNote = useStore((s) => s.currentNote)
  const userTemplates = useStore((s) => s.userTemplates)
  const refreshTemplates = useStore((s) => s.refreshTemplates)
  const newNoteFromTemplate = useStore((s) => s.newNoteFromTemplate)
  const saveCurrentNoteAsTemplate = useStore((s) => s.saveCurrentNoteAsTemplate)
  const renameTemplate = useStore((s) => s.renameTemplate)
  const deleteTemplate = useStore((s) => s.deleteTemplate)

  const [savingName, setSavingName] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  useEffect(() => {
    if (open) refreshTemplates()
  }, [open, refreshTemplates])

  if (!open) return null

  const startSave = (): void => setSavingName(currentNote?.title ? `${currentNote.title} template` : 'My template')

  const commitSave = async (): Promise<void> => {
    if (savingName?.trim()) await saveCurrentNoteAsTemplate(savingName.trim())
    setSavingName(null)
  }

  return (
    <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <span className={styles.title}>New from Template</span>
          <button className={styles.close} onClick={() => setOpen(false)} title="Close">
            <X size={15} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.group}>
            <div className={styles.groupTitle}>Built-in</div>
            {BUILTIN_TEMPLATES.map((t) => (
              <div key={t.id} className={styles.item}>
                <span className={styles.itemIcon}>
                  <LayoutTemplate size={15} />
                </span>
                <div className={styles.itemMain}>
                  <div className={styles.itemName}>{t.name}</div>
                  <div className={styles.itemDesc}>{t.description}</div>
                </div>
                <button className={styles.use} onClick={() => newNoteFromTemplate(t.content)}>
                  Use
                </button>
              </div>
            ))}
          </div>

          <div className={styles.group}>
            <div className={styles.groupHead}>
              <span className={styles.groupTitle}>My Templates</span>
              {currentNote && savingName === null && (
                <button className={styles.saveBtn} onClick={startSave} title="Save current note as a template">
                  <Plus size={12} /> Save current note
                </button>
              )}
            </div>

            {savingName !== null && (
              <div className={styles.saveRow}>
                <input
                  className={styles.saveInput}
                  autoFocus
                  value={savingName}
                  onChange={(e) => setSavingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitSave()
                    if (e.key === 'Escape') setSavingName(null)
                  }}
                  placeholder="Template name"
                />
                <button className={styles.saveConfirm} onClick={commitSave}>
                  Save
                </button>
                <button className={styles.saveCancel} onClick={() => setSavingName(null)}>
                  Cancel
                </button>
              </div>
            )}

            {userTemplates.length === 0 && savingName === null && (
              <div className={styles.empty}>No saved templates yet.</div>
            )}

            {userTemplates.map((t) => (
              <div key={t.id} className={styles.item}>
                <span className={styles.itemIcon}>
                  <FileText size={15} />
                </span>
                {editingId === t.id ? (
                  <input
                    className={styles.renameInput}
                    autoFocus
                    defaultValue={t.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim()
                      if (v) renameTemplate(t.id, v)
                      setEditingId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                ) : (
                  <div className={styles.itemMain}>
                    <div className={styles.itemName}>{t.name}</div>
                  </div>
                )}
                <button className={styles.use} onClick={() => newNoteFromTemplate(t.content)}>
                  Use
                </button>
                <button className={styles.mini} title="Rename" onClick={() => setEditingId(t.id)}>
                  <Pencil size={13} />
                </button>
                <button className={styles.mini} title="Delete" onClick={() => setConfirmId(t.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        request={
          confirmId != null
            ? ({ title: 'Delete template?', message: 'This saved template will be permanently deleted.' } as ConfirmRequest)
            : null
        }
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId != null) deleteTemplate(confirmId)
          setConfirmId(null)
        }}
      />
    </div>
  )
}
