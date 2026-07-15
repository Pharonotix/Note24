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
    backlinks: (id) => ipcRenderer.invoke(IPC.notesBacklinks, id),
    reorder: (folderId, orderedIds) => ipcRenderer.invoke(IPC.notesReorder, folderId, orderedIds)
  },
  folders: {
    list: () => ipcRenderer.invoke(IPC.foldersList),
    create: (name, parentId) => ipcRenderer.invoke(IPC.foldersCreate, name, parentId ?? null),
    rename: (id, name) => ipcRenderer.invoke(IPC.foldersRename, id, name),
    delete: (id) => ipcRenderer.invoke(IPC.foldersDelete, id),
    updateStyle: (id, style) => ipcRenderer.invoke(IPC.foldersUpdateStyle, id, style),
    move: (id, parentId) => ipcRenderer.invoke(IPC.foldersMove, id, parentId),
    reorder: (parentId, orderedIds) => ipcRenderer.invoke(IPC.foldersReorder, parentId, orderedIds)
  },
  tags: {
    list: () => ipcRenderer.invoke(IPC.tagsList)
  },
  equations: {
    list: () => ipcRenderer.invoke(IPC.equationsList),
    search: (query) => ipcRenderer.invoke(IPC.equationsSearch, query),
    create: (input) => ipcRenderer.invoke(IPC.equationsCreate, input),
    update: (id, patch) => ipcRenderer.invoke(IPC.equationsUpdate, id, patch),
    delete: (id) => ipcRenderer.invoke(IPC.equationsDelete, id),
    relationshipsFor: (slug) => ipcRenderer.invoke(IPC.equationsRelationshipsFor, slug),
    addRelationship: (fromSlug, toSlug, kind) =>
      ipcRenderer.invoke(IPC.equationsAddRelationship, fromSlug, toSlug, kind),
    removeRelationship: (id) => ipcRenderer.invoke(IPC.equationsRemoveRelationship, id),
    getDerivation: (slug) => ipcRenderer.invoke(IPC.equationsGetDerivation, slug),
    setDerivation: (slug, steps) => ipcRenderer.invoke(IPC.equationsSetDerivation, slug, steps)
  },
  attachments: {
    add: (filename, mime, data, target) =>
      ipcRenderer.invoke(IPC.attachmentsAdd, filename, mime, data, target),
    pick: (target) => ipcRenderer.invoke(IPC.attachmentsPick, target),
    open: (id) => ipcRenderer.invoke(IPC.attachmentsOpen, id),
    list: (filter) => ipcRenderer.invoke(IPC.attachmentsList, filter),
    rename: (id, filename) => ipcRenderer.invoke(IPC.attachmentsRename, id, filename),
    move: (id, target) => ipcRenderer.invoke(IPC.attachmentsMove, id, target),
    delete: (id) => ipcRenderer.invoke(IPC.attachmentsDelete, id),
    readBytes: (id) => ipcRenderer.invoke(IPC.attachmentsReadBytes, id)
  },
  export: {
    toPdf: (suggestedName) => ipcRenderer.invoke(IPC.exportToPdf, suggestedName),
    print: () => ipcRenderer.invoke(IPC.exportPrint)
  },
  settings: {
    get: (key) => ipcRenderer.invoke(IPC.settingsGet, key),
    set: (key, value) => ipcRenderer.invoke(IPC.settingsSet, key, value),
    getAll: () => ipcRenderer.invoke(IPC.settingsGetAll)
  },
  locations: {
    list: () => ipcRenderer.invoke(IPC.locationsList),
    pickFolder: () => ipcRenderer.invoke(IPC.locationsPickFolder),
    add: (path, label) => ipcRenderer.invoke(IPC.locationsAdd, path, label),
    rename: (id, label) => ipcRenderer.invoke(IPC.locationsRename, id, label),
    switch: (id) => ipcRenderer.invoke(IPC.locationsSwitch, id),
    remove: (id) => ipcRenderer.invoke(IPC.locationsRemove, id)
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
