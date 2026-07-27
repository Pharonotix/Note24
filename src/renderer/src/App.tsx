import { useEffect } from 'react'
import {
  BookMarked,
  BookOpenText,
  Download,
  FolderSearch2,
  GraduationCap,
  Infinity as InfinityIcon,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  PrinterCheck,
  Settings as SettingsIcon,
  Sigma
} from 'lucide-react'
import { useStore } from './store/store'
import { matchShortcut } from './lib/shortcuts'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Editor } from './components/Editor/Editor'
import { Dashboard } from './components/Dashboard/Dashboard'
import { TabBar } from './components/TabBar/TabBar'
import { QuickSwitcher } from './components/QuickSwitcher/QuickSwitcher'
import { EquationLibrary } from './components/EquationLibrary/EquationLibrary'
import { CitationLibrary } from './components/CitationLibrary/CitationLibrary'
import { StudyPanel } from './components/StudyPanel/StudyPanel'
import { Whiteboard } from './components/Whiteboard/Whiteboard'
import { FileManager } from './components/FileManager/FileManager'
import { PdfViewer } from './components/PdfViewer/PdfViewer'
import { ExportPicker } from './components/ExportPicker/ExportPicker'
import { PrintLayer } from './components/PrintLayer/PrintLayer'
import { TemplatePicker } from './components/TemplatePicker/TemplatePicker'
import { Settings } from './components/Settings/Settings'
import { VersionHistory } from './components/VersionHistory/VersionHistory'
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
  const citationLibraryOpen = useStore((s) => s.citationLibraryOpen)
  const setCitationLibraryOpen = useStore((s) => s.setCitationLibraryOpen)
  const studyPanelOpen = useStore((s) => s.studyPanelOpen)
  const setStudyPanelOpen = useStore((s) => s.setStudyPanelOpen)
  const whiteboardOpen = useStore((s) => s.whiteboardOpen)
  const setWhiteboardOpen = useStore((s) => s.setWhiteboardOpen)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const setExportPickerOpen = useStore((s) => s.setExportPickerOpen)
  const printJob = useStore((s) => s.printJob)
  const setPrintJob = useStore((s) => s.setPrintJob)
  const readingMode = useStore((s) => s.readingMode)
  const setReadingMode = useStore((s) => s.setReadingMode)
  const focusMode = useStore((s) => s.focusMode)
  const setFocusMode = useStore((s) => s.setFocusMode)
  const dashboardOpen = useStore((s) => s.dashboardOpen)
  const setDashboardOpen = useStore((s) => s.setDashboardOpen)
  const noteReloadToken = useStore((s) => s.noteReloadToken)

  const openEquations = (v: boolean): void => {
    setEquationPanel(v)
    if (v) {
      setFileManagerOpen(false)
      setCitationLibraryOpen(false)
      setStudyPanelOpen(false)
    }
  }
  const openFileManager = (v: boolean): void => {
    setFileManagerOpen(v)
    if (v) {
      setEquationPanel(false)
      setCitationLibraryOpen(false)
      setStudyPanelOpen(false)
    }
  }
  const openCitations = (v: boolean): void => {
    setCitationLibraryOpen(v)
    if (v) {
      setEquationPanel(false)
      setFileManagerOpen(false)
      setStudyPanelOpen(false)
    }
  }
  const openStudy = (v: boolean): void => {
    setStudyPanelOpen(v)
    if (v) {
      setEquationPanel(false)
      setFileManagerOpen(false)
      setCitationLibraryOpen(false)
    }
  }

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const s = useStore.getState().shortcuts
      if (matchShortcut(e, s.quickSwitcher)) {
        e.preventDefault()
        setQuickSwitcher(true)
      } else if (matchShortcut(e, s.newNote)) {
        e.preventDefault()
        newNote(null)
      } else if (matchShortcut(e, s.equations)) {
        e.preventDefault()
        openEquations(!useStore.getState().equationPanelOpen)
      } else if (matchShortcut(e, s.fileManager)) {
        e.preventDefault()
        openFileManager(!useStore.getState().fileManagerOpen)
      } else if (matchShortcut(e, s.study)) {
        e.preventDefault()
        openStudy(!useStore.getState().studyPanelOpen)
      } else if (matchShortcut(e, s.whiteboard)) {
        e.preventDefault()
        setWhiteboardOpen(!useStore.getState().whiteboardOpen)
      } else if (matchShortcut(e, s.settings)) {
        e.preventDefault()
        setSettingsOpen(true)
      } else if (matchShortcut(e, s.readingMode)) {
        e.preventDefault()
        setReadingMode(!useStore.getState().readingMode)
      } else if (matchShortcut(e, s.focusMode)) {
        e.preventDefault()
        setFocusMode(!useStore.getState().focusMode)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newNote, setQuickSwitcher, setSettingsOpen, setWhiteboardOpen, setReadingMode, setFocusMode])

  // While a print/export job is active, replace the whole app with the plain
  // print-layout renderer so printToPDF/print() never capture app chrome.
  if (printJob) return <PrintLayer />

  // The whiteboard is a full-screen takeover (an infinite canvas needs the room),
  // not another docked side panel — same reasoning as PrintLayer above.
  if (whiteboardOpen) return <Whiteboard />

  const panelOpen = equationPanelOpen || fileManagerOpen || citationLibraryOpen || studyPanelOpen

  const appClass = [styles.app, panelOpen && styles.withPanel, focusMode && styles.focusMode]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={appClass}>
      {!focusMode && <Sidebar />}
      <main className={styles.main}>
        {!focusMode && (
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
                className={citationLibraryOpen ? `${styles.action} ${styles.on}` : styles.action}
                onClick={() => openCitations(!citationLibraryOpen)}
                title="Citation library"
              >
                <BookMarked size={15} /> Citations
              </button>
              <button
                className={studyPanelOpen ? `${styles.action} ${styles.on}` : styles.action}
                onClick={() => openStudy(!studyPanelOpen)}
                title="Study — flashcards & formula sheets (Ctrl+Shift+S)"
              >
                <GraduationCap size={15} /> Study
              </button>
              <button
                className={styles.action}
                onClick={() => setWhiteboardOpen(true)}
                title="Infinite whiteboard (Ctrl+Shift+W)"
              >
                <InfinityIcon size={15} /> Whiteboard
              </button>
              <button
                className={readingMode ? `${styles.action} ${styles.on}` : styles.action}
                onClick={() => setReadingMode(!readingMode)}
                title="Reading mode — wider column, read-only (Ctrl+Shift+R)"
              >
                <BookOpenText size={15} /> Read
              </button>
              <button
                className={styles.action}
                onClick={() => setFocusMode(true)}
                title="Focus mode — hide all chrome (Ctrl+Shift+D)"
              >
                <Maximize2 size={15} /> Focus
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
              <button className={styles.action} onClick={() => setSettingsOpen(true)} title="Settings (Ctrl+,)">
                <SettingsIcon size={15} />
              </button>
              <button
                className={dashboardOpen ? `${styles.action} ${styles.on}` : styles.action}
                onClick={() => setDashboardOpen(!dashboardOpen)}
                title="Dashboard"
              >
                <LayoutDashboard size={15} />
              </button>
            </div>
          </div>
        )}
        {focusMode && (
          <button
            className={styles.focusExit}
            onClick={() => setFocusMode(false)}
            title="Exit focus mode (Ctrl+Shift+D)"
          >
            <Minimize2 size={14} />
          </button>
        )}
        {!focusMode && !dashboardOpen && <TabBar />}
        <div className={styles.editorArea}>
          {dashboardOpen ? (
            <Dashboard />
          ) : currentNote ? (
            <Editor key={`${currentNote.id}-${noteReloadToken}`} note={currentNote} />
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
      <CitationLibrary />
      <StudyPanel />
      <FileManager />
      <PdfViewer />
      <ExportPicker />
      <TemplatePicker />
      <QuickSwitcher />
      <Settings />
      <VersionHistory />
    </div>
  )
}

export default App
