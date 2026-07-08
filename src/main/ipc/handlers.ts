import { dialog, ipcMain, shell } from 'electron'
import { IPC } from '@shared/ipc'
import type { EquationInput, NoteCreateInput, NoteUpdateInput } from '@shared/types'
import * as notes from '../db/notes'
import * as folders from '../db/folders'
import * as tags from '../db/tags'
import * as equations from '../db/equations'
import * as links from '../db/links'
import * as settings from '../db/settings'
import * as attachments from '../attachments'

/** Registers every ipcMain.handle channel. Call once after the DB is ready. */
export function registerIpcHandlers(): void {
  // Notes
  ipcMain.handle(IPC.notesList, () => notes.listNotes())
  ipcMain.handle(IPC.notesGet, (_e, id: number) => notes.getNote(id))
  ipcMain.handle(IPC.notesCreate, (_e, input: NoteCreateInput) => notes.createNote(input))
  ipcMain.handle(IPC.notesUpdate, (_e, id: number, patch: NoteUpdateInput) =>
    notes.updateNote(id, patch)
  )
  ipcMain.handle(IPC.notesDelete, (_e, id: number) => notes.deleteNote(id))
  ipcMain.handle(IPC.notesSearch, (_e, query: string) => notes.searchNotes(query))
  ipcMain.handle(IPC.notesSetTags, (_e, id: number, t: string[]) => notes.setNoteTags(id, t))
  ipcMain.handle(IPC.notesBacklinks, (_e, id: number) => links.getBacklinks(id))

  // Folders
  ipcMain.handle(IPC.foldersList, () => folders.listFolders())
  ipcMain.handle(IPC.foldersCreate, (_e, name: string, parentId: number | null) =>
    folders.createFolder(name, parentId)
  )
  ipcMain.handle(IPC.foldersRename, (_e, id: number, name: string) => folders.renameFolder(id, name))
  ipcMain.handle(IPC.foldersDelete, (_e, id: number) => folders.deleteFolder(id))

  // Tags
  ipcMain.handle(IPC.tagsList, () => tags.listTags())

  // Equations
  ipcMain.handle(IPC.equationsList, () => equations.listEquations())
  ipcMain.handle(IPC.equationsSearch, (_e, query: string) => equations.searchEquations(query))
  ipcMain.handle(IPC.equationsCreate, (_e, input: EquationInput) => equations.createEquation(input))
  ipcMain.handle(IPC.equationsUpdate, (_e, id: number, patch: Partial<EquationInput>) =>
    equations.updateEquation(id, patch)
  )
  ipcMain.handle(IPC.equationsDelete, (_e, id: number) => equations.deleteEquation(id))

  // Attachments
  ipcMain.handle(IPC.attachmentsAdd, (_e, filename: string, mime: string, data: Uint8Array) =>
    attachments.addAttachment(filename, mime, data)
  )
  ipcMain.handle(IPC.attachmentsPick, async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images & files', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'pdf', 'txt', 'md', 'csv'] }
      ]
    })
    if (res.canceled || !res.filePaths[0]) return null
    return attachments.addAttachmentFromPath(res.filePaths[0])
  })
  ipcMain.handle(IPC.attachmentsOpen, (_e, id: string) => {
    const p = attachments.attachmentFsPath(id)
    if (p) shell.openPath(p)
  })

  // Settings
  ipcMain.handle(IPC.settingsGet, (_e, key: string) => settings.getSetting(key))
  ipcMain.handle(IPC.settingsSet, (_e, key: string, value: string) => settings.setSetting(key, value))
  ipcMain.handle(IPC.settingsGetAll, () => settings.getAllSettings())
}
