import { useEffect } from 'react'
import { Download, FolderSearch2, PrinterCheck, Settings as SettingsIcon, Sigma } from 'lucide-react'
import { useStore } from './store/store'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Editor } from './components/Editor/Editor'
import { QuickSwitcher } from './components/QuickSwitcher/QuickSwitcher'
import { EquationLibrary } from './components/EquationLibrary/EquationLibrary'
import { FileManager } from './components/FileManager/FileManager'
import { PdfViewer } from './components/PdfViewer/PdfViewer'
import { ExportPicker } from './components/ExportPicker/ExportPicker'
import { PrintLayer } from './components/PrintLayer/PrintLayer'
import { Settings } from './components/Settings/Settings'
import styles from './App.module.css'

function App(): React.JSX.Element {
  const init = useStore((s) => s.init)
  const currentNote = useStore((s) => s.currentNote)
  const currentNoteId = useStore((s) => s.currentNoteId)
  const newNote = useStore((s) => s.newNote)
  const setQuickSwitcher = useStore((s) => s.setQuickSwitcher)
  const equationPanelOpen = useStore((s) => s.equationPanelOpen)
  const setEquationPanel = useStore((s) => s.setEquationPanel)
  const fileManagerOpen = useStore((s) => s.fileManagerOpen)
  const setFileManagerOpen = useStore((s) => s.setFileManagerOpen)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const setExportPickerOpen = useStore((s) => s.setExportPickerOpen)
  const printJob = useStore((s) => s.printJob)
  const setPrintJob = useStore((s) => s.setPrintJob)

  const openEquations = (v: boolean): void => {
    setEquationPanel(v)
    if (v) setFileManagerOpen(false)
  }
  const openFileManager = (v: boolean): void => {
    setFileManagerOpen(v)
    if (v) setEquationPanel(false)
  }

  useEffect(() => {
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
        openEquations(!useStore.getState().equationPanelOpen)
      } else if (mod && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        openFileManager(!useStore.getState().fileManagerOpen)
      } else if (mod && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newNote, setQuickSwitcher, setSettingsOpen])

  // While a print/export job is active, replace the whole app with the plain
  // print-layout renderer so printToPDF/print() never capture app chrome.
  if (printJob) return <PrintLayer />

  const panelOpen = equationPanelOpen || fileManagerOpen

  return (
    <div className={panelOpen ? `${styles.app} ${styles.withPanel}` : styles.app}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.actions}>
            <button
              className={equationPanelOpen ? `${styles.action} ${styles.on}` : styles.action}
              onClick={() => openEquations(!equationPanelOpen)}
              title="Equation library (Ctrl+E)"
            >
              <Sigma size={15} /> Equations
            </button>
            <button
              className={fileManagerOpen ? `${styles.action} ${styles.on}` : styles.action}
              onClick={() => openFileManager(!fileManagerOpen)}
              title="File manager (Ctrl+Shift+F)"
            >
              <FolderSearch2 size={15} /> Files
            </button>
            <button
              className={styles.action}
              disabled={currentNoteId == null}
              onClick={() => currentNoteId != null && setPrintJob({ noteIds: [currentNoteId], mode: 'print' })}
              title="Print current note"
            >
              <PrinterCheck size={15} /> Print
            </button>
            <button
              className={styles.action}
              onClick={() => setExportPickerOpen(true)}
              title="Export notes to PDF"
            >
              <Download size={15} /> Export
            </button>
            <button
              className={styles.action}
              onClick={() => setSettingsOpen(true)}
              title="Settings (Ctrl+,)"
            >
              <SettingsIcon size={15} />
            </button>
          </div>
        </div>
        <div className={styles.editorArea}>
          {currentNote ? (
            <Editor key={currentNote.id} note={currentNote} />
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
      <FileManager />
      <PdfViewer />
      <ExportPicker />
      <QuickSwitcher />
      <Settings />
    </div>
  )
}

export default App
