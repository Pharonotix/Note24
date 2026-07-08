import { useEffect, useMemo, useState } from 'react'
import type { Equation, EquationInput, EquationVariable } from '@shared/types'
import { useStore } from '../../store/store'
import { renderLatex } from '../../lib/katex'
import styles from './EquationLibrary.module.css'

function Rendered({ latex }: { latex: string }): React.JSX.Element {
  const { html } = renderLatex(latex, true)
  return <span className={styles.preview} dangerouslySetInnerHTML={{ __html: html }} />
}

function serializeVars(vars: EquationVariable[]): string {
  return vars.map((v) => [v.symbol, v.meaning, v.unit ?? ''].join(' | ')).join('\n')
}
function parseVars(text: string): EquationVariable[] {
  return text
    .split('\n')
    .map((line) => line.split('|').map((p) => p.trim()))
    .filter((parts) => parts[0])
    .map((parts) => ({ symbol: parts[0], meaning: parts[1] ?? '', unit: parts[2] || undefined }))
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

  const load = async (q: string): Promise<void> => {
    setEquations(q.trim() ? await window.api.equations.search(q) : await window.api.equations.list())
  }

  useEffect(() => {
    if (open) load(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const grouped = useMemo(() => {
    const map = new Map<string, Equation[]>()
    for (const eq of equations) {
      if (!map.has(eq.category)) map.set(eq.category, [])
      map.get(eq.category)!.push(eq)
    }
    return [...map.entries()]
  }, [equations])

  if (!open) return null

  const insert = (latex: string): void => {
    if (!editor) return
    editor.chain().focus().insertBlockMath({ latex }).run()
  }

  const startAdd = (): void => {
    setForm(EMPTY_FORM)
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
    setEditingId(eq.id)
  }

  const submit = async (): Promise<void> => {
    if (!form.name.trim() || !form.latex.trim()) return
    const payload: EquationInput = {
      name: form.name.trim(),
      latex: form.latex.trim(),
      category: form.category.trim() || 'Custom',
      description: form.description.trim(),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      variables: parseVars(form.variables)
    }
    if (editingId === 'new') await window.api.equations.create(payload)
    else if (typeof editingId === 'number') await window.api.equations.update(editingId, payload)
    setEditingId(null)
    await load(query)
  }

  const remove = async (id: number): Promise<void> => {
    await window.api.equations.delete(id)
    await load(query)
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.title}>Equations</span>
        <button className={styles.close} onClick={() => setOpen(false)} title="Close">
          ✕
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
        <button className={styles.add} onClick={startAdd}>
          ＋
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
            className={styles.field}
            placeholder="LaTeX, e.g. E = mc^2"
            rows={2}
            value={form.latex}
            onChange={(e) => setForm({ ...form, latex: e.target.value })}
          />
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
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <textarea
            className={styles.field}
            placeholder="Variables — one per line:  symbol | meaning | unit"
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
        {grouped.map(([category, eqs]) => (
          <div key={category} className={styles.group}>
            <div className={styles.groupTitle}>{category}</div>
            {eqs.map((eq) => (
              <div key={eq.id} className={styles.item}>
                <div className={styles.itemMain} onClick={() => insert(eq.latex)}>
                  <Rendered latex={eq.latex} />
                  <div className={styles.itemName}>{eq.name}</div>
                  {eq.variables.length > 0 && (
                    <div className={styles.vars}>
                      {eq.variables.map((v, i) => (
                        <span key={i} className={styles.var}>
                          {v.symbol.replace(/\\/g, '')} — {v.meaning}
                          {v.unit ? ` (${v.unit})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.itemActions}>
                  <button className={styles.insert} title="Insert into note" onClick={() => insert(eq.latex)}>
                    Insert
                  </button>
                  {!eq.isBuiltin && (
                    <>
                      <button className={styles.mini} title="Edit" onClick={() => startEdit(eq)}>
                        ✎
                      </button>
                      <button className={styles.mini} title="Delete" onClick={() => remove(eq.id)}>
                        🗑
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
        {equations.length === 0 && <div className={styles.empty}>No equations found.</div>}
      </div>
    </aside>
  )
}
