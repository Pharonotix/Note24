import { app, shell, BrowserWindow, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase } from './db/database'
import { registerIpcHandlers } from './ipc/handlers'
import { readAttachmentBytes } from './attachments'

// Custom scheme used to serve embedded attachment files to the renderer.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'note24-attachment',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
])

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    title: 'Note24',
    backgroundColor: '#1a1c1e',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Dev aid: forward renderer console + crashes to the main-process terminal.
  if (is.dev) {
    mainWindow.webContents.on('console-message', (...args: unknown[]) => {
      const detail = args[0] as { message?: string } | undefined
      const message = typeof args[2] === 'string' ? args[2] : (detail?.message ?? '')
      if (message) console.log('[renderer]', message)
    })
    mainWindow.webContents.on('render-process-gone', (_e, details) => {
      console.error('[renderer gone]', details.reason)
    })
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Open the database and expose the data layer to the renderer.
  initDatabase()
  registerIpcHandlers()

  // Serve embedded attachments to the renderer via a safe custom scheme.
  protocol.handle('note24-attachment', (request) => {
    const url = new URL(request.url)
    const id = decodeURIComponent(url.pathname.replace(/^\/+/, '') || url.hostname)
    const res = readAttachmentBytes(id)
    if (!res) return new Response('Not found', { status: 404 })
    return new Response(new Uint8Array(res.data), { headers: { 'Content-Type': res.mime } })
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  closeDatabase()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
