import { useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, Network, Pencil, Plus, Trash2, X } from 'lucide-react'
import type {
  DerivationStep,
  Equation,
  EquationInput,
  EquationRelationshipView,
  RelationKind
} from '@shared/types'
import { useStore } from '../../store/store'
import { renderLatex } from '../../lib/katex'
import { serializeVars, parseVars } from '../../lib/equationFormat'
import { MathKeyboard } from '../MathKeyboard/MathKeyboard'
import styles from './EquationLibrary.module.css'

const REL_KINDS: { value: RelationKind; label: string }[] = [
  { value: 'related', label: 'Related to' },
  { value: 'derives-from', label: 'Derives from' },
  { value: 'special-case-of', label: 'Special case of' }
]

/** Serializes derivation steps to editable "latex | note" lines. */
function serializeDeriv(steps: DerivationStep[]): string {
  return steps.map((s) => (s.note ? `${s.latex} | ${s.note}` : s.latex)).join('\n')
}
/** Parses "latex | note" lines back into derivation steps (blank lines dropped). */
function parseDeriv(text: string): DerivationStep[] {
  return text
    .split('\n')
    .map((line) => {
      const [latex, ...rest] = line.split('|')
      return { latex: latex.trim(), note: rest.join('|').trim() || undefined }
    })
    .filter((s) => s.latex)
}

function Rendered({ latex }: { latex: string }): React.JSX.Element {
  const { html } = renderLatex(latex, true)
  return <span className={styles.preview} dangerouslySetInnerHTML={{ __html: html }} />
}

const EMPTY_FORM = { name: '', latex: '', category: 'Custom', description: '', tags: '', variables: '' }

export function EquationLibrary(): React.JSX.Element | null {
  const open = useStore((s) => s.equationPanelOpen)
  const setOpen = useStore((s) => s.setEquationPanel)
  const editor = useStore((s) => s.editor)

  const [equations, setEquations] = useState<Equation[]>([])
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showKeyboard, setShowKeyboard] = useState(false)
  const latexRef = useRef<HTMLTextAreaElement>(null)

  // Knowledge-graph detail view (relationships + derivation) for one equation.
  const [allEqs, setAllEqs] = useState<Equation[]>([])
  const [detailFor, setDetailFor] = useState<number | null>(null)
  const [rels, setRels] = useState<EquationRelationshipView[]>([])
  const [derivText, setDerivText] = useState('')
  const [derivDirty, setDerivDirty] = useState(false)
  const [linkKind, setLinkKind] = useState<RelationKind>('related')
  const [linkTarget, setLinkTarget] = useState('')

  const load = async (q: string): Promise<void> => {
    setEquations(q.trim() ? await window.api.equations.search(q) : await window.api.equations.list())
  }

  useEffect(() => {
    if (open) {
      load(query)
      // Full list backs the relationship target picker regardless of search state.
      window.api.equations.list().then(setAllEqs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const openDetail = async (eq: Equation): Promise<void> => {
    if (detailFor === eq.id) {
      setDetailFor(null)
      return
    }
    setDetailFor(eq.id)
    setLinkKind('related')
    setLinkTarget('')
    setDerivDirty(false)
    if (!eq.slug) {
      setRels([])
      setDerivText('')
      return
    }
    const [r, d] = await Promise.all([
      window.api.equations.relationshipsFor(eq.slug),
      window.api.equations.getDerivation(eq.slug)
    ])
    setRels(r)
    setDerivText(serializeDeriv(d))
  }

  const refreshRels = async (slug: string): Promise<void> => {
    setRels(await window.api.equations.relationshipsFor(slug))
  }

  const addLink = async (eq: Equation): Promise<void> => {
    if (!eq.slug || !linkTarget) return
    await window.api.equations.addRelationship(eq.slug, linkTarget, linkKind)
    setLinkTarget('')
    await refreshRels(eq.slug)
  }

  const removeLink = async (eq: Equation, id: number): Promise<void> => {
    if (!eq.slug) return
    await window.api.equations.removeRelationship(id)
    await refreshRels(eq.slug)
  }

  const saveDeriv = async (eq: Equation): Promise<void> => {
    if (!eq.slug) return
    await window.api.equations.setDerivation(eq.slug, parseDeriv(derivText))
    setDerivText(serializeDeriv(await window.api.equations.getDerivation(eq.slug)))
    setDerivDirty(false)
  }

  const relGroup = (
    label: string,
    items: EquationRelationshipView[],
    eq: Equation
  ): React.JSX.Element | null => {
    if (items.length === 0) return null
    return (
      <div className={styles.relGroup}>
        <span className={styles.relGroupLabel}>{label}:</span>
        {items.map((r) => (
          <span key={r.id} className={styles.relChip}>
            {r.equation.name}
            <button
              className={styles.relRemove}
              title="Remove link"
              onClick={() => removeLink(eq, r.id)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    )
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Equation[]>()
    for (const eq of equations) {
      if (!map.has(eq.category)) map.set(eq.category, [])
      map.get(eq.category)!.push(eq)
    }
    return [...map.entries()]
  }, [equations])

  const isSearching = query.trim().length > 0
  const toggleCategory = (category: string): void =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(category) ? next.delete(category) : next.add(category)
      return next
    })

  if (!open) return null

  const insert = (eq: Equation): void => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertBlockMath({
        latex: eq.latex,
        name: eq.name,
        description: eq.description,
        variablesJson: JSON.stringify(eq.variables)
      })
      .run()
  }

  const startAdd = (): void => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowKeyboard(false)
    setEditingId('new')
  }
  const startEdit = (eq: Equation): void => {
    setForm({
      name: eq.name,
      latex: eq.latex,
      category: eq.category,
      description: eq.description,
      tags: eq.tags.join(', '),
      variables: serializeVars(eq.variables)
    })
    setFormError(null)
    setShowKeyboard(false)
    setEditingId(eq.id)
  }

  const submit = async (): Promise<void> => {
    if (!form.name.trim() || !form.latex.trim()) {
      setFormError('Name and LaTeX are required.')
      return
    }
    if (!form.description.trim()) {
      setFormError('A description is required — explain what the equation means.')
      return
    }
    const variables = parseVars(form.variables)
    if (variables.length === 0) {
      setFormError('At least one variable definition is required.')
      return
    }
    const payload: EquationInput = {
      name: form.name.trim(),
      latex: form.latex.trim(),
      category: form.category.trim() || 'Custom',
      description: form.description.trim(),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      variables
    }
    if (editingId === 'new') await window.api.equations.create(payload)
    else if (typeof editingId === 'number') await window.api.equations.update(editingId, payload)
    setFormError(null)
    setEditingId(null)
    await load(query)
    setAllEqs(await window.api.equations.list())
  }

  const remove = async (id: number): Promise<void> => {
    await window.api.equations.delete(id)
    if (detailFor === id) setDetailFor(null)
    await load(query)
    setAllEqs(await window.api.equations.list())
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.title}>Equations</span>
        <button className={styles.close} onClick={() => setOpen(false)} title="Close">
          <X size={15} />
        </button>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Search equations…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            load(e.target.value)
          }}
        />
        <button className={styles.add} onClick={startAdd} title="Add equation">
          <Plus size={16} />
        </button>
      </div>

      {editingId !== null && (
        <div className={styles.form}>
          <input
            className={styles.field}
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            ref={latexRef}
            className={styles.field}
            placeholder="LaTeX, e.g. E = mc^2"
            rows={2}
            value={form.latex}
            onChange={(e) => setForm({ ...form, latex: e.target.value })}
          />
          <button
            type="button"
            className={styles.symbolsToggle}
            onClick={() => setShowKeyboard((v) => !v)}
          >
            <Keyboard size={13} /> Symbols
          </button>
          {showKeyboard && (
            <MathKeyboard
              targetRef={latexRef}
              value={form.latex}
              onChange={(v) => setForm({ ...form, latex: v })}
            />
          )}
          {form.latex.trim() && (
            <div className={styles.formPreview}>
              <Rendered latex={form.latex} />
            </div>
          )}
          <input
            className={styles.field}
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <input
            className={styles.field}
            placeholder="Description — what does this equation mean? (required)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <textarea
            className={styles.field}
            placeholder="Variable definitions (required) — one per line:  symbol | meaning | unit"
            rows={2}
            value={form.variables}
            onChange={(e) => setForm({ ...form, variables: e.target.value })}
          />
          <input
            className={styles.field}
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
          {formError && <div className={styles.formError}>{formError}</div>}
          <div className={styles.formActions}>
            <button className={styles.save} onClick={submit}>
              {editingId === 'new' ? 'Add' : 'Save'}
            </button>
            <button className={styles.cancel} onClick={() => setEditingId(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {grouped.map(([category, eqs]) => {
          const isOpen = isSearching || expanded.has(category)
          return (
            <div key={category} className={styles.group}>
              <button className={styles.groupTitle} onClick={() => toggleCategory(category)}>
                <span className={styles.groupCaret}>{isOpen ? '▾' : '▸'}</span>
                {category}
                <span className={styles.groupCount}>{eqs.length}</span>
              </button>
              {isOpen &&
                eqs.map((eq) => (
                  <div key={eq.id} className={styles.item}>
                    <div className={styles.itemMain} onClick={() => insert(eq)}>
                      <Rendered latex={eq.latex} />
                      <div className={styles.itemName}>{eq.name}</div>
                      <div className={styles.itemDesc}>{eq.description}</div>
                      {eq.variables.length > 0 && (
                        <div className={styles.vars}>
                          {eq.variables.map((v, i) => (
                            <span key={i} className={styles.var}>
                              <span
                                className={styles.varSym}
                                dangerouslySetInnerHTML={{ __html: renderLatex(v.symbol, false).html }}
                              />
                              {' — '}
                              {v.meaning}
                              {v.unit ? ` (${v.unit})` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={styles.itemActions}>
                      <button className={styles.insert} title="Insert into note" onClick={() => insert(eq)}>
                        Insert
                      </button>
                      <button
                        className={detailFor === eq.id ? `${styles.mini} ${styles.miniOn}` : styles.mini}
                        title="Relationships & derivation"
                        onClick={() => openDetail(eq)}
                      >
                        <Network size={13} />
                      </button>
                      {!eq.isBuiltin && (
                        <>
                          <button className={styles.mini} title="Edit" onClick={() => startEdit(eq)}>
                            <Pencil size={13} />
                          </button>
                          <button className={styles.mini} title="Delete" onClick={() => remove(eq.id)}>
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                    {detailFor === eq.id && (
                      <div className={styles.detail}>
                        {!eq.slug ? (
                          <div className={styles.detailEmpty}>
                            Save this equation first to add relationships and a derivation.
                          </div>
                        ) : (
                          <>
                            <div className={styles.detailSection}>
                              <div className={styles.detailLabel}>Relationships</div>
                              {rels.length === 0 && (
                                <div className={styles.detailEmpty}>No links yet.</div>
                              )}
                              {relGroup('Related', rels.filter((r) => r.kind === 'related'), eq)}
                              {relGroup(
                                'Derives from',
                                rels.filter((r) => r.kind === 'derives-from' && r.direction === 'out'),
                                eq
                              )}
                              {relGroup(
                                'Used in',
                                rels.filter((r) => r.kind === 'derives-from' && r.direction === 'in'),
                                eq
                              )}
                              {relGroup(
                                'Special case of',
                                rels.filter((r) => r.kind === 'special-case-of' && r.direction === 'out'),
                                eq
                              )}
                              {relGroup(
                                'Generalizes',
                                rels.filter((r) => r.kind === 'special-case-of' && r.direction === 'in'),
                                eq
                              )}
                              <div className={styles.linkRow}>
                                <select
                                  className={styles.linkKind}
                                  value={linkKind}
                                  onChange={(e) => setLinkKind(e.target.value as RelationKind)}
                                >
                                  {REL_KINDS.map((k) => (
                                    <option key={k.value} value={k.value}>
                                      {k.label}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className={styles.linkTarget}
                                  value={linkTarget}
                                  onChange={(e) => setLinkTarget(e.target.value)}
                                >
                                  <option value="">Select equation…</option>
                                  {allEqs
                                    .filter((o) => o.slug && o.slug !== eq.slug)
                                    .map((o) => (
                                      <option key={o.id} value={o.slug!}>
                                        {o.name}
                                      </option>
                                    ))}
                                </select>
                                <button
                                  className={styles.linkAdd}
                                  disabled={!linkTarget}
                                  onClick={() => addLink(eq)}
                                >
                                  Link
                                </button>
                              </div>
                            </div>

                            <div className={styles.detailSection}>
                              <div className={styles.detailLabel}>Derivation</div>
                              {parseDeriv(derivText).length > 0 && (
                                <div className={styles.derivChain}>
                                  {parseDeriv(derivText).map((s, i) => (
                                    <div key={i} className={styles.derivStep}>
                                      <span
                                        dangerouslySetInnerHTML={{ __html: renderLatex(s.latex, true).html }}
                                      />
                                      {s.note && <div className={styles.derivNote}>{s.note}</div>}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <textarea
                                className={styles.derivInput}
                                rows={3}
                                placeholder="One step per line:  latex | optional note"
                                value={derivText}
                                onChange={(e) => {
                                  setDerivText(e.target.value)
                                  setDerivDirty(true)
                                }}
                              />
                              <button
                                className={styles.derivSave}
                                disabled={!derivDirty}
                                onClick={() => saveDeriv(eq)}
                              >
                                Save derivation
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )
        })}
        {equations.length === 0 && <div className={styles.empty}>No equations found.</div>}
      </div>
    </aside>
  )
}
