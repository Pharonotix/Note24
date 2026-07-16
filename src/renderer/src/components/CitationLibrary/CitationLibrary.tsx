import { useEffect, useMemo, useState } from 'react'
import { Copy, FileText, Link2, Paperclip, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { Citation, CitationInput, CitationStyle, CitationUsage } from '@shared/types'
import { useStore } from '../../store/store'
import { CITATION_STYLES, CITATION_TYPES, formatCitation } from '../../lib/citationFormat'
import { openAttachment } from '../../lib/openAttachment'
import { ConfirmDialog, type ConfirmRequest } from '../ConfirmDialog/ConfirmDialog'
import styles from './CitationLibrary.module.css'

const EMPTY_FORM: CitationInput = {
  type: 'book',
  title: '',
  authors: '',
  year: '',
  publisher: '',
  url: '',
  doi: '',
  attachmentId: null
}

export function CitationLibrary(): React.JSX.Element | null {
  const open = useStore((s) => s.citationLibraryOpen)
  const setOpen = useStore((s) => s.setCitationLibraryOpen)
  const citations = useStore((s) => s.citations)
  const refreshCitations = useStore((s) => s.refreshCitations)
  const focusId = useStore((s) => s.citationFocusId)
  const setFocusId = useStore((s) => s.setCitationFocusId)
  const editor = useStore((s) => s.editor)

  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<CitationInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [detailFor, setDetailFor] = useState<number | null>(null)
  const [style, setStyle] = useState<CitationStyle>('apa')
  const [usage, setUsage] = useState<CitationUsage[]>([])
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [copyDone, setCopyDone] = useState(false)

  useEffect(() => {
    if (open) refreshCitations()
  }, [open, refreshCitations])

  useEffect(() => {
    if (open && focusId != null) {
      setDetailFor(focusId)
      setFocusId(null)
    }
  }, [open, focusId, setFocusId])

  useEffect(() => {
    if (detailFor != null) window.api.citations.usage(detailFor).then(setUsage)
  }, [detailFor])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return citations
    return citations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.authors.toLowerCase().includes(q) ||
        c.publisher.toLowerCase().includes(q)
    )
  }, [citations, query])

  const grouped = useMemo(() => {
    const map = new Map<Citation['type'], Citation[]>()
    for (const t of CITATION_TYPES) map.set(t.value, [])
    for (const c of filtered) map.get(c.type)?.push(c)
    return CITATION_TYPES.map((t) => ({ ...t, items: map.get(t.value) ?? [] })).filter(
      (g) => g.items.length > 0
    )
  }, [filtered])

  if (!open) return null

  const startAdd = (): void => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setEditingId('new')
  }

  const startEdit = (c: Citation): void => {
    setForm({
      type: c.type,
      title: c.title,
      authors: c.authors,
      year: c.year,
      publisher: c.publisher,
      url: c.url,
      doi: c.doi,
      attachmentId: c.attachmentId
    })
    setFormError(null)
    setEditingId(c.id)
  }

  const submit = async (): Promise<void> => {
    if (!form.title?.trim()) {
      setFormError('A title is required.')
      return
    }
    if (editingId === 'new') {
      const created = await window.api.citations.create(form)
      setDetailFor(created.id)
    } else if (typeof editingId === 'number') {
      await window.api.citations.update(editingId, form)
    }
    setFormError(null)
    setEditingId(null)
    await refreshCitations()
  }

  const remove = async (id: number): Promise<void> => {
    await window.api.citations.delete(id)
    if (detailFor === id) setDetailFor(null)
    setConfirmId(null)
    await refreshCitations()
  }

  const attachPdf = async (): Promise<void> => {
    const att = await window.api.attachments.pick()
    if (att) setForm((f) => ({ ...f, attachmentId: att.id }))
  }

  const insertRef = (c: Citation): void => {
    if (!editor) return
    editor.chain().focus().insertCitationRef(c.id).run()
  }

  const copyFormatted = (c: Citation): void => {
    navigator.clipboard.writeText(formatCitation(c, style))
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 1200)
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.title}>Citations</span>
        <button className={styles.close} onClick={() => setOpen(false)} title="Close">
          <X size={15} />
        </button>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Search citations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className={styles.add} onClick={startAdd} title="Add citation">
          <Plus size={16} />
        </button>
      </div>

      {editingId !== null && (
        <div className={styles.form}>
          <select
            className={styles.field}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as Citation['type'] })}
          >
            {CITATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            className={styles.field}
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className={styles.field}
            placeholder="Authors — Last, First; Last, First"
            value={form.authors}
            onChange={(e) => setForm({ ...form, authors: e.target.value })}
          />
          <div className={styles.fieldRow}>
            <input
              className={styles.field}
              placeholder="Year"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
            <input
              className={styles.field}
              placeholder="Publisher / Journal / Site"
              value={form.publisher}
              onChange={(e) => setForm({ ...form, publisher: e.target.value })}
            />
          </div>
          <input
            className={styles.field}
            placeholder="URL (optional)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <input
            className={styles.field}
            placeholder="DOI (optional)"
            value={form.doi}
            onChange={(e) => setForm({ ...form, doi: e.target.value })}
          />
          <button type="button" className={styles.attachBtn} onClick={attachPdf}>
            <Paperclip size={12} /> {form.attachmentId ? 'Replace attached PDF' : 'Attach PDF'}
          </button>
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
        {grouped.map((g) => (
          <div key={g.value} className={styles.group}>
            <div className={styles.groupTitle}>
              {g.label} <span className={styles.groupCount}>{g.items.length}</span>
            </div>
            {g.items.map((c) => (
              <div key={c.id} className={styles.item}>
                <div className={styles.itemMain} onClick={() => setDetailFor(detailFor === c.id ? null : c.id)}>
                  <div className={styles.itemTitle}>{c.title}</div>
                  <div className={styles.itemMeta}>
                    {[c.authors, c.year].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <button className={styles.mini} title="Edit" onClick={() => startEdit(c)}>
                    <Pencil size={13} />
                  </button>
                  <button className={styles.mini} title="Delete" onClick={() => setConfirmId(c.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>

                {detailFor === c.id && (
                  <div className={styles.detail}>
                    <div className={styles.styleRow}>
                      {CITATION_STYLES.map((s) => (
                        <button
                          key={s.value}
                          className={style === s.value ? `${styles.styleBtn} ${styles.styleOn}` : styles.styleBtn}
                          onClick={() => setStyle(s.value)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <div className={styles.formatted}>{formatCitation(c, style)}</div>
                    <div className={styles.detailActions}>
                      <button className={styles.detailBtn} onClick={() => copyFormatted(c)}>
                        <Copy size={12} /> {copyDone ? 'Copied!' : 'Copy'}
                      </button>
                      {editor && (
                        <button className={styles.detailBtn} onClick={() => insertRef(c)}>
                          <Link2 size={12} /> Insert into note
                        </button>
                      )}
                      {c.attachmentId && (
                        <button
                          className={styles.detailBtn}
                          onClick={() =>
                            openAttachment({ id: c.attachmentId!, filename: `${c.title}.pdf`, mime: 'application/pdf' })
                          }
                        >
                          <FileText size={12} /> Open PDF
                        </button>
                      )}
                    </div>
                    {usage.length > 0 && (
                      <div className={styles.usage}>
                        <div className={styles.usageLabel}>Used in</div>
                        {usage.map((u) => (
                          <button
                            key={u.noteId}
                            className={styles.usageItem}
                            onClick={() => useStore.getState().selectNote(u.noteId)}
                          >
                            {u.title || 'Untitled'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && <div className={styles.empty}>No citations found.</div>}
      </div>

      <ConfirmDialog
        request={
          confirmId != null
            ? ({ title: 'Delete citation?', message: 'This citation will be permanently deleted. Any attached PDF stays in your files.' } as ConfirmRequest)
            : null
        }
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId != null && remove(confirmId)}
      />
    </aside>
  )
}
