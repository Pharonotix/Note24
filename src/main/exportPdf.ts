import { BrowserWindow, dialog } from 'electron'
import { writeFileSync } from 'fs'

let mainWindow: BrowserWindow | null = null

/** Registers the window whose currently-rendered page gets captured for export/print. */
export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win
}

/**
 * Saves the main window's current page to a PDF file the user picks. The renderer is
 * responsible for having already swapped its DOM into a print-layout view (see the
 * `exportMode` store flag) and settled all async rendering (fonts, KaTeX, canvases)
 * before invoking this — printToPDF captures whatever is laid out at call time.
 */
export async function exportToPdf(
  suggestedName: string
): Promise<{ canceled: boolean; path?: string }> {
  if (!mainWindow) return { canceled: true }
  const res = await dialog.showSaveDialog(mainWindow, {
    defaultPath: suggestedName.endsWith('.pdf') ? suggestedName : `${suggestedName}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (res.canceled || !res.filePath) return { canceled: true }
  const buffer = await mainWindow.webContents.printToPDF({ printBackground: true })
  writeFileSync(res.filePath, buffer)
  return { canceled: false, path: res.filePath }
}

/** Opens the OS print dialog for the main window's current page. */
export function printCurrent(): Promise<void> {
  return new Promise((resolve) => {
    if (!mainWindow) {
      resolve()
      return
    }
    mainWindow.webContents.print({ printBackground: true }, () => resolve())
  })
}
