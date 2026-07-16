import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useStore } from '../../../store/store'
import { formatInline } from '../../../lib/citationFormat'
import styles from './CitationRef.module.css'

export function CitationRefView({ node }: NodeViewProps): React.JSX.Element {
  const citationId = node.attrs.citationId as number
  const citations = useStore((s) => s.citations)
  const setCitationLibraryOpen = useStore((s) => s.setCitationLibraryOpen)
  const setCitationFocusId = useStore((s) => s.setCitationFocusId)
  const citation = citations.find((c) => c.id === citationId)

  const open = (): void => {
    setCitationFocusId(citationId)
    setCitationLibraryOpen(true)
  }

  return (
    <NodeViewWrapper as="span" className={styles.wrap}>
      <span
        className={citation ? styles.link : styles.unresolved}
        contentEditable={false}
        onClick={open}
        title={citation ? `Open citation: ${citation.title}` : 'Citation not found'}
      >
        {citation ? formatInline(citation) : '(missing citation)'}
      </span>
    </NodeViewWrapper>
  )
}
