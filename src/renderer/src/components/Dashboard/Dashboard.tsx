import { useEffect, useState } from 'react'
import { Clock, FileText, LayoutTemplate, Pin, Plus, Save, Sigma, Trash2 } from 'lucide-react'
import { useStore } from '../../store/store'
import { LAYOUT_PRESETS } from '../../lib/workspace'
import styles from './Dashboard.module.css'

/** Application overview: pinned/recent notes, vault stats, and workflow shortcuts. */
export function Dashboard(): React.JSX.Element {
  const notes = useStore((s) => s.notes)
  const citations = useStore((s) => s.citations)
  const recentNoteIds = useStore((s) => s.recentNoteIds)
  const openTabs = useStore((s) => s.openTabs)
  const workspaceSnapshots = useStore((s) => s.workspaceSnapshots)
  const saveWorkspaceSnapshot = useStore((s) => s.saveWorkspaceSnapshot)
  const restoreWorkspaceSnapshot = useStore((s) => s.restoreWorkspaceSnapshot)
  const deleteWorkspaceSnapshot = useStore((s) => s.deleteWorkspaceSnapshot)
  const selectNote = useStore((s) => s.selectNote)
  const newNote = useStore((s) => s.newNote)
  const setTemplatePickerOpen = useStore((s) => s.setTemplatePickerOpen)
  const setEquationPanel = useStore((s) => s.setEquationPanel)
  const setCitationLibraryOpen = useStore((s) => s.setCitationLibraryOpen)
  const setStudyPanelOpen = useStore((s) => s.setStudyPanelOpen)
  const setFileManagerOpen = useStore((s) => s.setFileManagerOpen)

  const [equationCount, setEquationCount] = useState<number | null>(null)
  const [attachmentCount, setAttachmentCount] = useState<number | null>(null)
  const [savingSession, setSavingSession] = useState(false)
  const [sessionName, setSessionName] = useState('')

  useEffect(() => {
    window.api.equations.list().then((eqs) => setEquationCount(eqs.length))
    window.api.attachments.list().then((atts) => setAttachmentCount(atts.length))
  }, [])

  const pinned = notes.filter((n) => n.pinned)
  const recent = recentNoteIds
    .map((id) => notes.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => !!n)
    .slice(0, 8)

  const applyPreset = (id: string): void => {
    setEquationPanel(false)
    setCitationLibraryOpen(false)
    setStudyPanelOpen(false)
    setFileManagerOpen(false)
    if (id === 'study') setStudyPanelOpen(true)
    else if (id === 'homework') setEquationPanel(true)
    else if (id === 'research') setCitationLibraryOpen(true)
    else if (id === 'lab') {
      setFileManagerOpen(true)
      setEquationPanel(true)
    }
  }

  return (
    <div className={styles.host}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Dashboard</h1>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{notes.length}</span>
            <span className={styles.statLabel}>Notes</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{equationCount ?? '–'}</span>
            <span className={styles.statLabel}>Equations</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{citations.length}</span>
            <span className={styles.statLabel}>Citations</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{attachmentCount ?? '–'}</span>
            <span className={styles.statLabel}>Files</span>
          </div>
        </div>

        <div className={styles.quickActions}>
          <button className={styles.action} onClick={() => newNote(null)}>
            <Plus size={14} /> New note
          </button>
          <button className={styles.action} onClick={() => setTemplatePickerOpen(true)}>
            <LayoutTemplate size={14} /> New from template
          </button>
        </div>

        <section className={styles.section}>
          <h2 className={styles.h2}>Jump into a workflow</h2>
          <div className={styles.presetGrid}>
            {LAYOUT_PRESETS.map((p) => (
              <button key={p.id} className={styles.presetCard} onClick={() => applyPreset(p.id)}>
                <div className={styles.presetLabel}>{p.label}</div>
                <div className={styles.presetDesc}>{p.description}</div>
              </button>
            ))}
          </div>
        </section>

        {pinned.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.h2}>
              <Pin size={14} /> Pinned
            </h2>
            <div className={styles.noteGrid}>
              {pinned.map((n) => (
                <button key={n.id} className={styles.noteCard} onClick={() => selectNote(n.id)}>
                  <FileText size={13} /> {n.title || 'Untitled'}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.h2}>
            <Clock size={14} /> Recent
          </h2>
          <div className={styles.noteGrid}>
            {recent.map((n) => (
              <button key={n.id} className={styles.noteCard} onClick={() => selectNote(n.id)}>
                <FileText size={13} /> {n.title || 'Untitled'}
              </button>
            ))}
            {recent.length === 0 && <div className={styles.empty}>No notes opened yet.</div>}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>
            <Save size={14} /> Saved sessions
          </h2>
          {savingSession ? (
            <div className={styles.sessionForm}>
              <input
                autoFocus
                className={styles.sessionInput}
                placeholder="Session name…"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveWorkspaceSnapshot(sessionName)
                    setSessionName('')
                    setSavingSession(false)
                  }
                  if (e.key === 'Escape') setSavingSession(false)
                }}
              />
              <button
                className={styles.action}
                onClick={() => {
                  saveWorkspaceSnapshot(sessionName)
                  setSessionName('')
                  setSavingSession(false)
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <button
              className={styles.action}
              disabled={openTabs.length === 0}
              onClick={() => setSavingSession(true)}
            >
              <Save size={14} /> Save current session ({openTabs.length} tab
              {openTabs.length === 1 ? '' : 's'})
            </button>
          )}
          <div className={styles.noteGrid} style={{ marginTop: 10 }}>
            {workspaceSnapshots.map((s) => (
              <div key={s.id} className={styles.sessionCard}>
                <button className={styles.sessionOpen} onClick={() => restoreWorkspaceSnapshot(s.id)}>
                  {s.name} <span className={styles.sessionMeta}>({s.tabs.length})</span>
                </button>
                <button
                  className={styles.sessionDelete}
                  onClick={() => deleteWorkspaceSnapshot(s.id)}
                  title="Delete session"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {workspaceSnapshots.length === 0 && <div className={styles.empty}>No saved sessions yet.</div>}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>
            <Sigma size={14} /> Vault
          </h2>
          <p className={styles.hint}>
            {notes.length} note{notes.length === 1 ? '' : 's'}, {equationCount ?? '…'} equation
            {equationCount === 1 ? '' : 's'}, {citations.length} citation{citations.length === 1 ? '' : 's'}, and{' '}
            {attachmentCount ?? '…'} attached file{attachmentCount === 1 ? '' : 's'}.
          </p>
        </section>
      </div>
    </div>
  )
}
