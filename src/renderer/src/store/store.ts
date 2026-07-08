import { create } from 'zustand'
import type { Editor } from '@tiptap/react'
import type { Folder, Note, NoteSummary, Tag } from '@shared/types'
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
  settingsOpen: boolean
  annotationMode: boolean
  theme: ThemeConfig
  editor: Editor | null

  init: () => Promise<void>
  refreshNotes: () => Promise<void>
  refreshFolders: () => Promise<void>
  refreshTags: () => Promise<void>
  setQuery: (q: string) => Promise<void>
  setActiveTag: (t: string | null) => void
  selectNote: (id: number) => Promise<void>
  openByTitle: (title: string) => Promise<void>
  newNote: (folderId?: number | null) => Promise<void>
  removeNote: (id: number) => Promise<void>
  saveContent: (id: number, content: string) => Promise<void>
  renameNote: (id: number, title: string) => Promise<void>
  moveNote: (noteId: number, folderId: number | null) => Promise<void>
  setCurrentNoteTags: (tags: string[]) => Promise<void>
  newFolder: (name: string) => Promise<void>
  renameFolder: (id: number, name: string) => Promise<void>
  removeFolder: (id: number) => Promise<void>
  setQuickSwitcher: (open: boolean) => void
  setEquationPanel: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setTheme: (cfg: ThemeConfig) => void
  setAnnotationMode: (on: boolean) => void
  updateAnnotations: (id: number, annotations: string) => Promise<void>
  setEditor: (editor: Editor | null) => void
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
  settingsOpen: false,
  annotationMode: false,
  theme: DEFAULT_THEME,
  editor: null,

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
    set({ currentNoteId: id, currentNote: note, annotationMode: false })
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
    set({ currentNoteId: note.id, currentNote: note, annotationMode: false })
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

  setCurrentNoteTags: async (tags) => {
    const id = get().currentNoteId
    if (id == null) return
    await window.api.notes.setTags(id, tags)
    await Promise.all([get().refreshNotes(), get().refreshTags()])
  },

  newFolder: async (name) => {
    await window.api.folders.create(name)
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

  setQuickSwitcher: (open) => set({ quickSwitcherOpen: open }),
  setEquationPanel: (open) => set({ equationPanelOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setTheme: (cfg) => {
    applyTheme(cfg)
    set({ theme: cfg })
    void saveTheme(cfg)
  },
  setAnnotationMode: (on) => set({ annotationMode: on }),

  updateAnnotations: async (id, annotations) => {
    await window.api.notes.update(id, { annotations })
    const cur = get().currentNote
    if (cur && cur.id === id) set({ currentNote: { ...cur, annotations } })
  },

  setEditor: (editor) => set({ editor })
}))
