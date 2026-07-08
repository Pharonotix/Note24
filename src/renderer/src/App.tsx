import { useEffect } from 'react'
import { useStore } from './store/store'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Editor } from './components/Editor/Editor'
import { QuickSwitcher } from './components/QuickSwitcher/QuickSwitcher'
import { EquationLibrary } from './components/EquationLibrary/EquationLibrary'
import { AnnotationLayer } from './components/AnnotationLayer/AnnotationLayer'
import styles from './App.module.css'

function App(): React.JSX.Element {
  const init = useStore((s) => s.init)
  const currentNote = useStore((s) => s.currentNote)
  const newNote = useStore((s) => s.newNote)
  const setQuickSwitcher = useStore((s) => s.setQuickSwitcher)
  const equationPanelOpen = useStore((s) => s.equationPanelOpen)
  const setEquationPanel = useStore((s) => s.setEquationPanel)
  const annotationMode = useStore((s) => s.annotationMode)
  const setAnnotationMode = useStore((s) => s.setAnnotationMode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'sage-dark')
    init()
  }, [init])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        setQuickSwitcher(true)
      } else if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        newNote(null)
      } else if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setEquationPanel(!useStore.getState().equationPanelOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [newNote, setQuickSwitcher, setEquationPanel])

  return (
    <div className={equationPanelOpen ? `${styles.app} ${styles.withPanel}` : styles.app}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.actions}>
            {currentNote && (
              <button
                className={annotationMode ? `${styles.action} ${styles.on}` : styles.action}
                onClick={() => setAnnotationMode(!annotationMode)}
                title="Draw over this note"
              >
                ✎ Annotate
              </button>
            )}
            <button
              className={equationPanelOpen ? `${styles.action} ${styles.on}` : styles.action}
              onClick={() => setEquationPanel(!equationPanelOpen)}
              title="Equation library (Ctrl+E)"
            >
              Σ Equations
            </button>
          </div>
        </div>
        <div className={styles.editorArea}>
          {currentNote ? (
            <>
              <Editor key={currentNote.id} note={currentNote} />
              <AnnotationLayer note={currentNote} />
            </>
          ) : (
            <div className={styles.empty}>
              <div>
                <h1>Note24</h1>
                <p>Create a note to get started.</p>
                <button className={styles.cta} onClick={() => newNote(null)}>
                  + New note
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <EquationLibrary />
      <QuickSwitcher />
    </div>
  )
}

export default App
