import type {
  Attachment,
  Backlink,
  Equation,
  EquationInput,
  Folder,
  Note,
  NoteCreateInput,
  NoteSummary,
  NoteUpdateInput,
  Tag
} from './types'

/**
 * The typed surface exposed to the renderer as `window.api`.
 * Grows phase by phase; each method is backed by an ipcMain.handle channel.
 */
export interface Note24Api {
  notes: {
    list(): Promise<NoteSummary[]>
    get(id: number): Promise<Note | null>
    create(input?: NoteCreateInput): Promise<Note>
    update(id: number, patch: NoteUpdateInput): Promise<void>
    delete(id: number): Promise<void>
    search(query: string): Promise<NoteSummary[]>
    setTags(id: number, tags: string[]): Promise<void>
    backlinks(id: number): Promise<Backlink[]>
  }
  folders: {
    list(): Promise<Folder[]>
    create(name: string, parentId?: number | null): Promise<Folder>
    rename(id: number, name: string): Promise<void>
    delete(id: number): Promise<void>
  }
  tags: {
    list(): Promise<Tag[]>
  }
  equations: {
    list(): Promise<Equation[]>
    search(query: string): Promise<Equation[]>
    create(input: EquationInput): Promise<Equation>
    update(id: number, patch: Partial<EquationInput>): Promise<void>
    delete(id: number): Promise<void>
  }
  attachments: {
    add(filename: string, mime: string, data: Uint8Array): Promise<Attachment>
    pick(): Promise<Attachment | null>
    open(id: string): Promise<void>
  }
  settings: {
    get(key: string): Promise<string | null>
    set(key: string, value: string): Promise<void>
    getAll(): Promise<Record<string, string>>
  }
}
