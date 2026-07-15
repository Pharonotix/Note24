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
  notesReorder: 'notes:reorder',

  foldersList: 'folders:list',
  foldersCreate: 'folders:create',
  foldersRename: 'folders:rename',
  foldersDelete: 'folders:delete',
  foldersUpdateStyle: 'folders:updateStyle',
  foldersMove: 'folders:move',
  foldersReorder: 'folders:reorder',

  tagsList: 'tags:list',

  equationsList: 'equations:list',
  equationsSearch: 'equations:search',
  equationsCreate: 'equations:create',
  equationsUpdate: 'equations:update',
  equationsDelete: 'equations:delete',
  equationsRelationshipsFor: 'equations:relationshipsFor',
  equationsAddRelationship: 'equations:addRelationship',
  equationsRemoveRelationship: 'equations:removeRelationship',
  equationsGetDerivation: 'equations:getDerivation',
  equationsSetDerivation: 'equations:setDerivation',

  attachmentsAdd: 'attachments:add',
  attachmentsPick: 'attachments:pick',
  attachmentsOpen: 'attachments:open',
  attachmentsList: 'attachments:list',
  attachmentsRename: 'attachments:rename',
  attachmentsMove: 'attachments:move',
  attachmentsDelete: 'attachments:delete',
  attachmentsReadBytes: 'attachments:readBytes',

  exportToPdf: 'export:toPdf',
  exportPrint: 'export:print',

  templatesList: 'templates:list',
  templatesCreate: 'templates:create',
  templatesRename: 'templates:rename',
  templatesDelete: 'templates:delete',

  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  settingsGetAll: 'settings:getAll',

  locationsList: 'locations:list',
  locationsPickFolder: 'locations:pickFolder',
  locationsAdd: 'locations:add',
  locationsRename: 'locations:rename',
  locationsSwitch: 'locations:switch',
  locationsRemove: 'locations:remove'
} as const
