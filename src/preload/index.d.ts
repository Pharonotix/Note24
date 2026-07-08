import { ElectronAPI } from '@electron-toolkit/preload'
import type { Note24Api } from '@shared/api'

declare global {
  interface Window {
    electron: ElectronAPI
    api: Note24Api
  }
}
