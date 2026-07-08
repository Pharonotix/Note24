import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '@shared/ipc'
import type { Note24Api } from '@shared/api'

const api: Note24Api = {
  notes: {
    list: () => ipcRenderer.invoke(IPC.notesList),
    get: (id) => ipcRenderer.invoke(IPC.notesGet, id),
    create: (input) => ipcRenderer.invoke(IPC.notesCreate, input ?? {}),
    update: (id, patch) => ipcRenderer.invoke(IPC.notesUpdate, id, patch),
    delete: (id) => ipcRenderer.invoke(IPC.notesDelete, id),
    search: (query) => ipcRenderer.invoke(IPC.notesSearch, query),
    setTags: (id, tags) => ipcRenderer.invoke(IPC.notesSetTags, id, tags),
    backlinks: (id) => ipcRenderer.invoke(IPC.notesBacklinks, id)
  },
  folders: {
    list: () => ipcRenderer.invoke(IPC.foldersList),
    create: (name, parentId) => ipcRenderer.invoke(IPC.foldersCreate, name, parentId ?? null),
    rename: (id, name) => ipcRenderer.invoke(IPC.foldersRename, id, name),
    delete: (id) => ipcRenderer.invoke(IPC.foldersDelete, id)
  },
  tags: {
    list: () => ipcRenderer.invoke(IPC.tagsList)
  },
  equations: {
    list: () => ipcRenderer.invoke(IPC.equationsList),
    search: (query) => ipcRenderer.invoke(IPC.equationsSearch, query),
    create: (input) => ipcRenderer.invoke(IPC.equationsCreate, input),
    update: (id, patch) => ipcRenderer.invoke(IPC.equationsUpdate, id, patch),
    delete: (id) => ipcRenderer.invoke(IPC.equationsDelete, id)
  },
  attachments: {
    add: (filename, mime, data) => ipcRenderer.invoke(IPC.attachmentsAdd, filename, mime, data),
    pick: () => ipcRenderer.invoke(IPC.attachmentsPick),
    open: (id) => ipcRenderer.invoke(IPC.attachmentsOpen, id)
  },
  settings: {
    get: (key) => ipcRenderer.invoke(IPC.settingsGet, key),
    set: (key, value) => ipcRenderer.invoke(IPC.settingsSet, key, value),
    getAll: () => ipcRenderer.invoke(IPC.settingsGetAll)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
