import { BrowserWindow, dialog } from 'electron'
import { writeFileSync } from 'fs'

/**
 * Saves a `data:` URL (image or PDF, produced client-side — e.g. html-to-image or
 * jsPDF) to a file the user picks. Generic across export formats since they all reduce
 * to "here's a base64 payload and an extension" by the time the renderer calls this.
 */
export async function saveDataUrl(
  win: BrowserWindow | null,
  dataUrl: string,
  suggestedName: string,
  extension: string
): Promise<{ canceled: boolean; path?: string }> {
  if (!win) return { canceled: true }
  const defaultPath = suggestedName.endsWith(`.${extension}`) ? suggestedName : `${suggestedName}.${extension}`
  const res = await dialog.showSaveDialog(win, {
    defaultPath,
    filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
  })
  if (res.canceled || !res.filePath) return { canceled: true }
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  writeFileSync(res.filePath, Buffer.from(base64, 'base64'))
  return { canceled: false, path: res.filePath }
}
