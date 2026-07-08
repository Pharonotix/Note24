/** Canonical IPC channel names, shared by the main handlers and preload bridge. */
export const IPC = {
  notesList: 'notes:list',
  notesGet: 'notes:get',
  notesCreate: 'notes:create',
  notesUpdate: 'notes:update',
  notesDelete: 'notes:delete',
  notesSearch: 'notes:search',
  notesSetTags: 'notes:setTags',
  notesBacklinks: 'notes:backlinks',

  foldersList: 'folders:list',
  foldersCreate: 'folders:create',
  foldersRename: 'folders:rename',
  foldersDelete: 'folders:delete',

  tagsList: 'tags:list',

  equationsList: 'equations:list',
  equationsSearch: 'equations:search',
  equationsCreate: 'equations:create',
  equationsUpdate: 'equations:update',
  equationsDelete: 'equations:delete',

  attachmentsAdd: 'attachments:add',
  attachmentsPick: 'attachments:pick',
  attachmentsOpen: 'attachments:open',

  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  settingsGetAll: 'settings:getAll'
} as const
