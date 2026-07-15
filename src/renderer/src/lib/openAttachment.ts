import { useStore } from '../store/store'

/** Opens a PDF in the in-app viewer; everything else falls back to the OS's default app. */
export function openAttachment(att: { id: string; filename: string; mime: string }): void {
  if (att.mime === 'application/pdf') {
    useStore.getState().setPdfViewer({ id: att.id, filename: att.filename })
  } else {
    window.api.attachments.open(att.id)
  }
}
