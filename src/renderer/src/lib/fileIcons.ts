import {
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  type LucideIcon
} from 'lucide-react'

/** A representative Lucide icon component for a file's mime type, used across attachment UIs. */
export function iconForMime(mime: string): LucideIcon {
  if (mime.startsWith('image/')) return FileImage
  if (mime.startsWith('audio/')) return FileAudio
  if (mime.startsWith('video/')) return FileVideo
  if (mime === 'application/pdf') return FileText
  if (mime === 'application/zip') return FileArchive
  if (mime.includes('wordprocessingml') || mime === 'application/msword') return FileText
  if (mime.startsWith('text/')) return FileText
  return File
}

/** Human-readable file size, e.g. "512 B", "3.2 KB", "1.4 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`
}
