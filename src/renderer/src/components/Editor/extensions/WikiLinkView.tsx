import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useStore } from '../../../store/store'
import styles from './WikiLink.module.css'

export function WikiLinkView({ node }: NodeViewProps): React.JSX.Element {
  const title = (node.attrs.title as string) || ''
  const notes = useStore((s) => s.notes)
  const openByTitle = useStore((s) => s.openByTitle)
  const exists = notes.some((n) => n.title === title)

  return (
    <NodeViewWrapper as="span" className={styles.wrap}>
      <span
        className={exists ? styles.link : styles.unresolved}
        contentEditable={false}
        onClick={() => title && openByTitle(title)}
        title={exists ? `Open “${title}”` : `Create “${title}”`}
      >
        {title || 'untitled link'}
      </span>
    </NodeViewWrapper>
  )
}
