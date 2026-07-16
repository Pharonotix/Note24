import type {
  Attachment,
  AttachmentFilter,
  AttachmentTarget,
  Backlink,
  Citation,
  CitationInput,
  CitationUsage,
  DataLocation,
  DerivationStep,
  Equation,
  EquationInput,
  EquationRelationshipView,
  Folder,
  LocationsRegistry,
  Note,
  NoteCreateInput,
  NoteSummary,
  NoteUpdateInput,
  RelationKind,
  Tag,
  Template
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
    reorder(folderId: number | null, orderedIds: number[]): Promise<void>
  }
  folders: {
    list(): Promise<Folder[]>
    create(name: string, parentId?: number | null): Promise<Folder>
    rename(id: number, name: string): Promise<void>
    delete(id: number): Promise<void>
    updateStyle(id: number, style: { color?: string | null; icon?: string | null }): Promise<void>
    move(id: number, parentId: number | null): Promise<void>
    reorder(parentId: number | null, orderedIds: number[]): Promise<void>
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
    relationshipsFor(slug: string): Promise<EquationRelationshipView[]>
    addRelationship(fromSlug: string, toSlug: string, kind: RelationKind): Promise<void>
    removeRelationship(id: number): Promise<void>
    getDerivation(slug: string): Promise<DerivationStep[]>
    setDerivation(slug: string, steps: DerivationStep[]): Promise<void>
  }
  attachments: {
    add(filename: string, mime: string, data: Uint8Array, target?: AttachmentTarget): Promise<Attachment>
    pick(target?: AttachmentTarget): Promise<Attachment | null>
    open(id: string): Promise<void>
    list(filter?: AttachmentFilter): Promise<Attachment[]>
    rename(id: string, filename: string): Promise<void>
    move(id: string, target: AttachmentTarget): Promise<void>
    delete(id: string): Promise<void>
    readBytes(id: string): Promise<{ data: Uint8Array; mime: string } | null>
  }
  export: {
    toPdf(suggestedName: string): Promise<{ canceled: boolean; path?: string }>
    print(): Promise<void>
  }
  templates: {
    list(): Promise<Template[]>
    create(name: string, content: string): Promise<Template>
    rename(id: number, name: string): Promise<void>
    delete(id: number): Promise<void>
  }
  citations: {
    list(): Promise<Citation[]>
    search(query: string): Promise<Citation[]>
    create(input: CitationInput): Promise<Citation>
    update(id: number, patch: Partial<CitationInput>): Promise<void>
    delete(id: number): Promise<void>
    usage(id: number): Promise<CitationUsage[]>
  }
  settings: {
    get(key: string): Promise<string | null>
    set(key: string, value: string): Promise<void>
    getAll(): Promise<Record<string, string>>
  }
  locations: {
    list(): Promise<LocationsRegistry>
    pickFolder(): Promise<string | null>
    add(path: string, label?: string): Promise<DataLocation>
    rename(id: string, label: string): Promise<void>
    /** Persists the switch, then relaunches the app — never resolves. */
    switch(id: string): Promise<void>
    remove(id: string): Promise<void>
  }
}
