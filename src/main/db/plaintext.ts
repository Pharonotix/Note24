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
      // Include math LaTeX and wiki-link titles so they're searchable too.
      if (node.attrs) {
        if (typeof node.attrs.latex === 'string') parts.push(node.attrs.latex)
        if (typeof node.attrs.title === 'string') parts.push(node.attrs.title)
      }
      node.content?.forEach(walk)
    }
    walk(doc)
    return parts.join(' ')
  } catch {
    return ''
  }
}
