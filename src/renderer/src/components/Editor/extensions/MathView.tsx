import { useEffect, useRef, useState } from 'react'
import { Keyboard, Pencil } from 'lucide-react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { renderLatex } from '../../../lib/katex'
import { parseVars, serializeVars } from '../../../lib/equationFormat'
import { MathKeyboard } from '../../MathKeyboard/MathKeyboard'
import styles from './MathView.module.css'

/** Shared node view for inline and block math. Block math can carry
 * name/description/variable context (e.g. inserted from the equation library).
 * That metadata is collapsed by default — the equation shows alone, and a
 * toggle reveals the details (name, description, LaTeX-rendered variables) with
 * a checkbox to hide them again and a pencil to edit. Inline math stays
 * compact — no metadata fields or display. */
export function MathView({ node, updateAttributes, selected, editor }: NodeViewProps): React.JSX.Element {
  const displayMode = node.type.name === 'blockMath'
  const latex = node.attrs.latex as string
  const name = (node.attrs.name as string) || ''
  const description = (node.attrs.description as string) || ''
  const variablesJson = (node.attrs.variablesJson as string) || ''
  const collapsed = node.attrs.collapsed !== false
  const hasMetadata = displayMode && (name || description || variablesJson)

  const [editing, setEditing] = useState(latex === '')
  const [draft, setDraft] = useState(latex)
  const [draftName, setDraftName] = useState(name)
  const [draftDescription, setDraftDescription] = useState(description)
  const [draftVariables, setDraftVariables] = useState(() => serializeVars(safeParseVars(variablesJson)))
  const [showKeyboard, setShowKeyboard] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const startEdit = (): void => {
    setDraft(latex)
    setDraftName(name)
    setDraftDescription(description)
    setDraftVariables(serializeVars(safeParseVars(variablesJson)))
    setEditing(true)
  }

  const commit = (): void => {
    updateAttributes(
      displayMode
        ? {
            latex: draft,
            name: draftName,
            description: draftDescription,
            variablesJson: JSON.stringify(parseVars(draftVariables))
          }
        : { latex: draft }
    )
    setEditing(false)
    setShowKeyboard(false)
    editor.commands.focus()
  }
  const cancel = (): void => {
    setDraft(latex)
    setDraftName(name)
    setDraftDescription(description)
    setDraftVariables(serializeVars(safeParseVars(variablesJson)))
    setEditing(false)
    setShowKeyboard(false)
  }

  const preview = renderLatex(editing ? draft : latex, displayMode)

  const rendered = latex ? (
    <span dangerouslySetInnerHTML={{ __html: preview.html }} />
  ) : (
    <span className={styles.empty}>equation</span>
  )

  const variables = hasMetadata && !collapsed ? safeParseVars(variablesJson) : []

  // Click behavior in view mode: bare equations edit on click; equations with
  // metadata toggle the details panel (edit is via the pencil button).
  const onFormulaClick = (): void => {
    if (hasMetadata) updateAttributes({ collapsed: !collapsed })
    else startEdit()
  }

  return (
    <NodeViewWrapper
      as={displayMode ? 'div' : 'span'}
      className={displayMode ? styles.block : styles.inline}
    >
      {editing ? (
        <span
          className={styles.editBox}
          contentEditable={false}
          onBlur={(e) => {
            // Only commit when focus leaves the whole edit box, not when it
            // moves between the latex/name/description/variables fields inside it.
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) commit()
          }}
        >
          <textarea
            ref={inputRef}
            className={styles.input}
            value={draft}
            rows={displayMode ? 2 : 1}
            placeholder="LaTeX, e.g. E = mc^2"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !displayMode) {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                cancel()
              }
            }}
          />
          <button
            type="button"
            className={styles.symbolsToggle}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowKeyboard((v) => !v)}
            title="Symbol keyboard"
          >
            <Keyboard size={14} />
          </button>
          {showKeyboard && <MathKeyboard targetRef={inputRef} value={draft} onChange={setDraft} />}
          <span className={styles.previewRow}>
            {draft ? (
              <span dangerouslySetInnerHTML={{ __html: preview.html }} />
            ) : (
              <span className={styles.empty}>preview</span>
            )}
          </span>

          {displayMode && (
            <span className={styles.metaEdit} onMouseDown={(e) => e.stopPropagation()}>
              <input
                className={styles.metaInput}
                placeholder="Name (optional)"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
              />
              <input
                className={styles.metaInput}
                placeholder="Description (optional)"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
              />
              <textarea
                className={styles.metaInput}
                placeholder="Variables — one per line: symbol | meaning | unit"
                rows={2}
                value={draftVariables}
                onChange={(e) => setDraftVariables(e.target.value)}
              />
              <div className={styles.metaActions}>
                <button type="button" className={styles.metaSave} onClick={commit}>
                  Done
                </button>
                <button type="button" className={styles.metaCancel} onClick={cancel}>
                  Cancel
                </button>
              </div>
            </span>
          )}
        </span>
      ) : (
        <>
          <span
            className={selected ? `${styles.rendered} ${styles.sel}` : styles.rendered}
            onClick={onFormulaClick}
            title={hasMetadata ? (collapsed ? 'Click to show details' : 'Click to hide details') : 'Click to edit'}
          >
            {rendered}
          </span>
          {hasMetadata && (
            <button
              type="button"
              className={styles.detailsToggle}
              title={collapsed ? 'Show details' : 'Hide details'}
              onClick={() => updateAttributes({ collapsed: !collapsed })}
            >
              {collapsed ? 'ⓘ' : '▾'}
            </button>
          )}
          {hasMetadata && !collapsed && (
            <span className={styles.meta}>
              <span className={styles.metaHeader}>
                <label className={styles.metaCheckbox}>
                  <input
                    type="checkbox"
                    checked
                    onChange={() => updateAttributes({ collapsed: true })}
                  />
                  Show details
                </label>
                <button type="button" className={styles.metaEditBtn} title="Edit equation" onClick={startEdit}>
                  <Pencil size={12} />
                </button>
              </span>
              {name && <span className={styles.metaName}>{name}</span>}
              {description && <span className={styles.metaDesc}>{description}</span>}
              {variables.length > 0 && (
                <span className={styles.metaVars}>
                  {variables.map((v, i) => (
                    <span key={i} className={styles.metaVar}>
                      <span
                        className={styles.metaVarSym}
                        dangerouslySetInnerHTML={{ __html: renderLatex(v.symbol, false).html }}
                      />
                      {' — '}
                      {v.meaning}
                      {v.unit ? ` (${v.unit})` : ''}
                    </span>
                  ))}
                </span>
              )}
            </span>
          )}
        </>
      )}
    </NodeViewWrapper>
  )
}

function safeParseVars(json: string): ReturnType<typeof parseVars> {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
