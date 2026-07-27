/**
 * Walks a ProseMirror document (JSON string) and returns its plain text,
 * used to feed the full-text search index. Also tolerant of malformed input.
 */
interface PmNode {
  text?: string
  content?: PmNode[]
  attrs?: Record<string, unknown>
  type?: string
}

export function extractPlaintext(contentJson: string): string {
  try {
    const doc = JSON.parse(contentJson) as PmNode
    const parts: string[] = []
    const walk = (node: PmNode | undefined): void => {
      if (!node) return
      if (typeof node.text === 'string') parts.push(node.text)
      // Include math LaTeX, wiki-link titles, and calculator block text so they're
      // searchable too (global search — Note24 v0.15.0 — expects calculator blocks
      // to be findable, and this is the one node type whose content otherwise has
      // no plain `text` child nodes to walk into).
      if (node.attrs) {
        if (typeof node.attrs.latex === 'string') parts.push(node.attrs.latex)
        if (typeof node.attrs.title === 'string') parts.push(node.attrs.title)
        if (node.type === 'calculator' && typeof node.attrs.text === 'string') parts.push(node.attrs.text)
      }
      node.content?.forEach(walk)
    }
    walk(doc)
    return parts.join(' ')
  } catch {
    return ''
  }
}
