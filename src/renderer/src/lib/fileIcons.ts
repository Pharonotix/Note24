/** A single representative emoji for a file's mime type, used across attachment UIs. */
export function iconForMime(mime: string): string {
  if (mime.startsWith('image/')) return '🖼'
  if (mime.startsWith('audio/')) return '🎵'
  if (mime.startsWith('video/')) return '🎬'
  if (mime === 'application/pdf') return '📄'
  if (mime === 'application/zip') return '🗜'
  if (mime.includes('wordprocessingml') || mime === 'application/msword') return '📝'
  if (mime.startsWith('text/')) return '📃'
  return '📎'
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
