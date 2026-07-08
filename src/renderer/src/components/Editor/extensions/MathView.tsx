import { useEffect, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { renderLatex } from '../../../lib/katex'
import styles from './MathView.module.css'

/** Shared node view for inline and block math. Click to edit LaTeX in place. */
export function MathView({ node, updateAttributes, selected, editor }: NodeViewProps): React.JSX.Element {
  const displayMode = node.type.name === 'blockMath'
  const latex = node.attrs.latex as string
  const [editing, setEditing] = useState(latex === '')
  const [draft, setDraft] = useState(latex)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = (): void => {
    updateAttributes({ latex: draft })
    setEditing(false)
    editor.commands.focus()
  }
  const cancel = (): void => {
    setDraft(latex)
    setEditing(false)
  }

  const preview = renderLatex(editing ? draft : latex, displayMode)

  const rendered = latex ? (
    <span dangerouslySetInnerHTML={{ __html: preview.html }} />
  ) : (
    <span className={styles.empty}>equation</span>
  )

  return (
    <NodeViewWrapper
      as={displayMode ? 'div' : 'span'}
      className={displayMode ? styles.block : styles.inline}
    >
      {editing ? (
        <span className={styles.editBox} contentEditable={false}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={draft}
            rows={displayMode ? 2 : 1}
            placeholder="LaTeX, e.g. E = mc^2"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                cancel()
              }
            }}
            onBlur={commit}
          />
          <span className={styles.previewRow}>
            {draft ? (
              <span dangerouslySetInnerHTML={{ __html: preview.html }} />
            ) : (
              <span className={styles.empty}>preview</span>
            )}
          </span>
        </span>
      ) : (
        <span
          className={selected ? `${styles.rendered} ${styles.sel}` : styles.rendered}
          onClick={() => {
            setDraft(latex)
            setEditing(true)
          }}
          title="Click to edit"
        >
          {rendered}
        </span>
      )}
    </NodeViewWrapper>
  )
}
