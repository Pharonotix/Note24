import { create } from 'zustand'
import type { Editor } from '@tiptap/react'
import type { Folder, Note, NoteSummary, Tag, Template } from '@shared/types'
import { applyTheme, DEFAULT_THEME, loadTheme, saveTheme, type ThemeConfig } from '../lib/theme'

const LAST_NOTE_KEY = 'lastNoteId'

interface AppState {
  notes: NoteSummary[]
  folders: Folder[]
  tags: Tag[]
  query: string
  activeTag: string | null
  currentNoteId: number | null
  currentNote: Note | null
  quickSwitcherOpen: boolean
  equationPanelOpen: boolean
  fileManagerOpen: boolean
  settingsOpen: boolean
  theme: ThemeConfig
  editor: Editor | null
  /** The note/folder currently being dragged in the sidebar, if any. */
  dragItem: { kind: 'note' | 'folder'; id: number } | null
  /** Bumped after any attachment add/rename/move/delete, so panels know to refetch. */
  attachmentsVersion: number
  /** The PDF currently shown full-viewport, or null when closed. */
  pdfViewer: { id: string; filename: string } | null
  exportPickerOpen: boolean
  /** When set, the app renders only these notes (read-only, print layout) to capture a PDF/print job. */
  printJob: { noteIds: number[]; mode: 'export' | 'print' } | null
  templatePickerOpen: boolean
  userTemplates: Template[]

  init: () => Promise<void>
  refreshNotes: () => Promise<void>
  refreshFolders: () => Promise<void>
  refreshTags: () => Promise<void>
  setQuery: (q: string) => Promise<void>
  setActiveTag: (t: string | null) => void
  selectNote: (id: number) => Promise<void>
  openByTitle: (title: string) => Promise<void>
  newNote: (folderId?: number | null) => Promise<void>
  newNoteFromTemplate: (content: string, folderId?: number | null) => Promise<void>
  removeNote: (id: number) => Promise<void>
  saveContent: (id: number, content: string) => Promise<void>
  renameNote: (id: number, title: string) => Promise<void>
  moveNote: (noteId: number, folderId: number | null) => Promise<void>
  reorderNotes: (folderId: number | null, orderedIds: number[]) => Promise<void>
  setCurrentNoteTags: (tags: string[]) => Promise<void>
  newFolder: (name: string, parentId?: number | null) => Promise<void>
  renameFolder: (id: number, name: string) => Promise<void>
  removeFolder: (id: number) => Promise<void>
  moveFolder: (id: number, parentId: number | null) => Promise<void>
  reorderFolders: (parentId: number | null, orderedIds: number[]) => Promise<void>
  updateFolderStyle: (id: number, style: { color?: string | null; icon?: string | null }) => Promise<void>
  setDragItem: (item: { kind: 'note' | 'folder'; id: number } | null) => void
  setQuickSwitcher: (open: boolean) => void
  setEquationPanel: (open: boolean) => void
  setFileManagerOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setPdfViewer: (pdf: { id: string; filename: string } | null) => void
  setExportPickerOpen: (open: boolean) => void
  setPrintJob: (job: { noteIds: number[]; mode: 'export' | 'print' } | null) => void
  setTemplatePickerOpen: (open: boolean) => void
  refreshTemplates: () => Promise<void>
  saveCurrentNoteAsTemplate: (name: string) => Promise<void>
  renameTemplate: (id: number, name: string) => Promise<void>
  deleteTemplate: (id: number) => Promise<void>
  setTheme: (cfg: ThemeConfig) => void
  setEditor: (editor: Editor | null) => void
  bumpAttachments: () => void
  attachFilesToNote: (noteId: number, files: FileList | File[]) => Promise<void>
  attachFilesToFolder: (folderId: number, files: FileList | File[]) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  notes: [],
  folders: [],
  tags: [],
  query: '',
  activeTag: null,
  currentNoteId: null,
  currentNote: null,
  quickSwitcherOpen: false,
  equationPanelOpen: false,
  fileManagerOpen: false,
  settingsOpen: false,
  theme: DEFAULT_THEME,
  editor: null,
  dragItem: null,
  attachmentsVersion: 0,
  pdfViewer: null,
  exportPickerOpen: false,
  printJob: null,
  templatePickerOpen: false,
  userTemplates: [],

  init: async () => {
    const theme = await loadTheme()
    applyTheme(theme)
    set({ theme })
    await Promise.all([get().refreshNotes(), get().refreshFolders(), get().refreshTags()])
    const last = await window.api.settings.get(LAST_NOTE_KEY)
    const lastId = last ? Number(last) : null
    const notes = get().notes
    const target = lastId && notes.some((n) => n.id === lastId) ? lastId : (notes[0]?.id ?? null)
    if (target != null) await get().selectNote(target)
  },

  refreshNotes: async () => {
    const { query } = get()
    const notes = query.trim() ? await window.api.notes.search(query) : await window.api.notes.list()
    set({ notes })
  },

  refreshFolders: async () => set({ folders: await window.api.folders.list() }),
  refreshTags: async () => set({ tags: await window.api.tags.list() }),

  setQuery: async (q) => {
    set({ query: q })
    await get().refreshNotes()
  },

  setActiveTag: (t) => set({ activeTag: t }),

  selectNote: async (id) => {
    const note = await window.api.notes.get(id)
    set({ currentNoteId: id, currentNote: note })
    await window.api.settings.set(LAST_NOTE_KEY, String(id))
  },

  openByTitle: async (title) => {
    const all = await window.api.notes.list()
    const found = all.find((n) => n.title === title)
    const id = found ? found.id : (await window.api.notes.create({ title })).id
    await get().refreshNotes()
    await get().selectNote(id)
  },

  newNote: async (folderId = null) => {
    const note = await window.api.notes.create({ folderId })
    await get().refreshNotes()
    set({ currentNoteId: note.id, currentNote: note })
    await window.api.settings.set(LAST_NOTE_KEY, String(note.id))
  },

  newNoteFromTemplate: async (content, folderId = null) => {
    const note = await window.api.notes.create({ folderId, content })
    await get().refreshNotes()
    set({ currentNoteId: note.id, currentNote: note, templatePickerOpen: false })
    await window.api.settings.set(LAST_NOTE_KEY, String(note.id))
  },

  removeNote: async (id) => {
    await window.api.notes.delete(id)
    await get().refreshNotes()
    if (get().currentNoteId === id) {
      const next = get().notes[0]?.id ?? null
      if (next != null) await get().selectNote(next)
      else set({ currentNoteId: null, currentNote: null })
    }
  },

  saveContent: async (id, content) => {
    await window.api.notes.update(id, { content })
    const cur = get().currentNote
    if (cur && cur.id === id) set({ currentNote: { ...cur, content } })
    await get().refreshNotes()
  },

  renameNote: async (id, title) => {
    await window.api.notes.update(id, { title })
    const cur = get().currentNote
    if (cur && cur.id === id) set({ currentNote: { ...cur, title } })
    await get().refreshNotes()
  },

  moveNote: async (noteId, folderId) => {
    await window.api.notes.update(noteId, { folderId })
    await get().refreshNotes()
    if (get().currentNoteId === noteId) {
      const cur = get().currentNote
      if (cur) set({ currentNote: { ...cur, folderId } })
    }
  },

  reorderNotes: async (folderId, orderedIds) => {
    await window.api.notes.reorder(folderId, orderedIds)
    await get().refreshNotes()
  },

  setCurrentNoteTags: async (tags) => {
    const id = get().currentNoteId
    if (id == null) return
    await window.api.notes.setTags(id, tags)
    await Promise.all([get().refreshNotes(), get().refreshTags()])
  },

  newFolder: async (name, parentId = null) => {
    await window.api.folders.create(name, parentId)
    await get().refreshFolders()
  },

  renameFolder: async (id, name) => {
    await window.api.folders.rename(id, name)
    await get().refreshFolders()
  },

  removeFolder: async (id) => {
    await window.api.folders.delete(id)
    await Promise.all([get().refreshFolders(), get().refreshNotes()])
  },

  moveFolder: async (id, parentId) => {
    await window.api.folders.move(id, parentId)
    await get().refreshFolders()
  },

  reorderFolders: async (parentId, orderedIds) => {
    await window.api.folders.reorder(parentId, orderedIds)
    await get().refreshFolders()
  },

  updateFolderStyle: async (id, style) => {
    await window.api.folders.updateStyle(id, style)
    await get().refreshFolders()
  },

  setQuickSwitcher: (open) => set({ quickSwitcherOpen: open }),
  setEquationPanel: (open) => set({ equationPanelOpen: open }),
  setFileManagerOpen: (open) => set({ fileManagerOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setPdfViewer: (pdf) => set({ pdfViewer: pdf }),
  setExportPickerOpen: (open) => set({ exportPickerOpen: open }),
  setPrintJob: (job) => set({ printJob: job }),
  setTemplatePickerOpen: (open) => set({ templatePickerOpen: open }),

  refreshTemplates: async () => set({ userTemplates: await window.api.templates.list() }),

  saveCurrentNoteAsTemplate: async (name) => {
    const note = get().currentNote
    if (!note) return
    await window.api.templates.create(name, note.content)
    await get().refreshTemplates()
  },

  renameTemplate: async (id, name) => {
    await window.api.templates.rename(id, name)
    await get().refreshTemplates()
  },

  deleteTemplate: async (id) => {
    await window.api.templates.delete(id)
    await get().refreshTemplates()
  },
  setTheme: (cfg) => {
    applyTheme(cfg)
    set({ theme: cfg })
    void saveTheme(cfg)
  },
  setEditor: (editor) => set({ editor }),
  setDragItem: (item) => set({ dragItem: item }),

  bumpAttachments: () => set((s) => ({ attachmentsVersion: s.attachmentsVersion + 1 })),

  attachFilesToNote: async (noteId, files) => {
    for (const file of Array.from(files)) {
      const data = new Uint8Array(await file.arrayBuffer())
      await window.api.attachments.add(file.name, file.type || '', data, { noteId })
    }
    get().bumpAttachments()
  },

  attachFilesToFolder: async (folderId, files) => {
    for (const file of Array.from(files)) {
      const data = new Uint8Array(await file.arrayBuffer())
      await window.api.attachments.add(file.name, file.type || '', data, { folderId })
    }
    get().bumpAttachments()
  }
}))
