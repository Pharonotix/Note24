import { app, dialog, ipcMain, shell } from 'electron'
import { IPC } from '@shared/ipc'
import type {
  AttachmentFilter,
  AttachmentTarget,
  DerivationStep,
  EquationInput,
  NoteCreateInput,
  NoteUpdateInput,
  RelationKind
} from '@shared/types'
import * as notes from '../db/notes'
import * as folders from '../db/folders'
import * as tags from '../db/tags'
import * as equations from '../db/equations'
import * as equationGraph from '../db/equationGraph'
import * as links from '../db/links'
import * as settings from '../db/settings'
import * as attachments from '../attachments'
import * as locations from '../locations'
import * as exportPdf from '../exportPdf'
import * as templates from '../db/templates'

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
  ipcMain.handle(IPC.notesReorder, (_e, folderId: number | null, orderedIds: number[]) =>
    notes.reorderNotes(folderId, orderedIds)
  )

  // Folders
  ipcMain.handle(IPC.foldersList, () => folders.listFolders())
  ipcMain.handle(IPC.foldersCreate, (_e, name: string, parentId: number | null) =>
    folders.createFolder(name, parentId)
  )
  ipcMain.handle(IPC.foldersRename, (_e, id: number, name: string) => folders.renameFolder(id, name))
  ipcMain.handle(IPC.foldersDelete, (_e, id: number) => folders.deleteFolder(id))
  ipcMain.handle(
    IPC.foldersUpdateStyle,
    (_e, id: number, style: { color?: string | null; icon?: string | null }) =>
      folders.updateFolderStyle(id, style)
  )
  ipcMain.handle(IPC.foldersMove, (_e, id: number, parentId: number | null) =>
    folders.moveFolder(id, parentId)
  )
  ipcMain.handle(IPC.foldersReorder, (_e, parentId: number | null, orderedIds: number[]) =>
    folders.reorderFolders(parentId, orderedIds)
  )

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
  ipcMain.handle(IPC.equationsRelationshipsFor, (_e, slug: string) =>
    equationGraph.relationshipsFor(slug)
  )
  ipcMain.handle(
    IPC.equationsAddRelationship,
    (_e, fromSlug: string, toSlug: string, kind: RelationKind) =>
      equationGraph.addRelationship(fromSlug, toSlug, kind)
  )
  ipcMain.handle(IPC.equationsRemoveRelationship, (_e, id: number) =>
    equationGraph.removeRelationship(id)
  )
  ipcMain.handle(IPC.equationsGetDerivation, (_e, slug: string) =>
    equationGraph.getDerivation(slug)
  )
  ipcMain.handle(IPC.equationsSetDerivation, (_e, slug: string, steps: DerivationStep[]) =>
    equationGraph.setDerivation(slug, steps)
  )

  // Attachments
  ipcMain.handle(
    IPC.attachmentsAdd,
    (_e, filename: string, mime: string, data: Uint8Array, target?: AttachmentTarget) =>
      attachments.addAttachment(filename, mime, data, target)
  )
  ipcMain.handle(IPC.attachmentsPick, async (_e, target?: AttachmentTarget) => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Attachable files', extensions: attachments.PICKABLE_EXTENSIONS }]
    })
    if (res.canceled || !res.filePaths[0]) return null
    return attachments.addAttachmentFromPath(res.filePaths[0], target)
  })
  ipcMain.handle(IPC.attachmentsOpen, (_e, id: string) => {
    const p = attachments.attachmentFsPath(id)
    if (p) shell.openPath(p)
  })
  ipcMain.handle(IPC.attachmentsList, (_e, filter?: AttachmentFilter) =>
    attachments.listAttachments(filter)
  )
  ipcMain.handle(IPC.attachmentsRename, (_e, id: string, filename: string) =>
    attachments.renameAttachment(id, filename)
  )
  ipcMain.handle(IPC.attachmentsMove, (_e, id: string, target: AttachmentTarget) =>
    attachments.moveAttachment(id, target)
  )
  ipcMain.handle(IPC.attachmentsDelete, (_e, id: string) => attachments.deleteAttachment(id))
  ipcMain.handle(IPC.attachmentsReadBytes, (_e, id: string) => {
    const res = attachments.readAttachmentBytes(id)
    return res ? { data: res.data, mime: res.mime } : null
  })

  // Export / print
  ipcMain.handle(IPC.exportToPdf, (_e, suggestedName: string) => exportPdf.exportToPdf(suggestedName))
  ipcMain.handle(IPC.exportPrint, () => exportPdf.printCurrent())

  // Templates
  ipcMain.handle(IPC.templatesList, () => templates.listTemplates())
  ipcMain.handle(IPC.templatesCreate, (_e, name: string, content: string) =>
    templates.createTemplate(name, content)
  )
  ipcMain.handle(IPC.templatesRename, (_e, id: number, name: string) =>
    templates.renameTemplate(id, name)
  )
  ipcMain.handle(IPC.templatesDelete, (_e, id: number) => templates.deleteTemplate(id))

  // Settings
  ipcMain.handle(IPC.settingsGet, (_e, key: string) => settings.getSetting(key))
  ipcMain.handle(IPC.settingsSet, (_e, key: string, value: string) => settings.setSetting(key, value))
  ipcMain.handle(IPC.settingsGetAll, () => settings.getAllSettings())

  // Data storage locations
  ipcMain.handle(IPC.locationsList, () => locations.listLocations())
  ipcMain.handle(IPC.locationsPickFolder, async () => {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
    if (res.canceled || !res.filePaths[0]) return null
    return res.filePaths[0]
  })
  ipcMain.handle(IPC.locationsAdd, (_e, path: string, label?: string) =>
    locations.addLocation(path, label)
  )
  ipcMain.handle(IPC.locationsRename, (_e, id: string, label: string) =>
    locations.renameLocation(id, label)
  )
  ipcMain.handle(IPC.locationsSwitch, (_e, id: string) => {
    locations.switchActiveLocation(id)
    app.relaunch()
    app.exit(0)
  })
  ipcMain.handle(IPC.locationsRemove, (_e, id: string) => locations.removeLocation(id))
}
