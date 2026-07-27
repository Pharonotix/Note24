import { useEffect, useMemo, useRef, useState } from 'react'
import type { Attachment, Citation, Equation, NoteSummary } from '@shared/types'
import { useStore } from '../../store/store'
import { openAttachment } from '../../lib/openAttachment'
import styles from './QuickSwitcher.module.css'

type Result =
  | { kind: 'note'; key: string; label: string; sub: string; note: NoteSummary }
  | { kind: 'equation'; key: string; label: string; sub: string; equation: Equation }
  | { kind: 'citation'; key: string; label: string; sub: string; citation: Citation }
  | { kind: 'attachment'; key: string; label: string; sub: string; attachment: Attachment }

const KIND_LABEL: Record<Result['kind'], string> = {
  note: 'Notes',
  equation: 'Equations',
  citation: 'Citations',
  attachment: 'Files'
}

/** Global search: notes, equations, citations, and attachments (PDFs/files). Note
 *  full-text search already covers calculator block content (see plaintext.ts), so
 *  it doesn't need its own category here. */
export function QuickSwitcher(): React.JSX.Element | null {
  const open = useStore((s) => s.quickSwitcherOpen)
  const setOpen = useStore((s) => s.setQuickSwitcher)
  const selectNote = useStore((s) => s.selectNote)
  const setEquationPanel = useStore((s) => s.setEquationPanel)
  const setCitationLibraryOpen = useStore((s) => s.setCitationLibraryOpen)
  const setCitationFocusId = useStore((s) => s.setCitationFocusId)

  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const [equations, setEquations] = useState<Equation[]>([])
  const [citations, setCitations] = useState<Citation[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      window.api.notes.list().then(setNotes)
      setQ('')
      setIdx(0)
      setEquations([])
      setCitations([])
      setAttachments([])
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Only hit the other resource types once there's an actual search term — the
  // no-query state stays a plain "jump to note" list (existing behavior), and
  // avoids fetching every equation/citation/attachment on every open.
  useEffect(() => {
    const term = q.trim()
    if (!term) {
      setEquations([])
      setCitations([])
      setAttachments([])
      return
    }
    let cancelled = false
    Promise.all([
      window.api.equations.search(term),
      window.api.citations.search(term),
      window.api.attachments.list({ query: term })
    ]).then(([eqs, cites, atts]) => {
      if (cancelled) return
      setEquations(eqs.slice(0, 8))
      setCitations(cites.slice(0, 8))
      setAttachments(atts.slice(0, 8))
    })
    return () => {
      cancelled = true
    }
  }, [q])

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase()
    const noteMatches = term ? notes.filter((n) => (n.title || 'Untitled').toLowerCase().includes(term)) : notes
    const noteResults: Result[] = noteMatches
      .slice(0, term ? 8 : 50)
      .map((n) => ({ kind: 'note', key: `note-${n.id}`, label: n.title || 'Untitled', sub: '', note: n }))
    if (!term) return noteResults
    const eqResults: Result[] = equations.map((e) => ({
      kind: 'equation',
      key: `eq-${e.id}`,
      label: e.name,
      sub: e.category,
      equation: e
    }))
    const citeResults: Result[] = citations.map((c) => ({
      kind: 'citation',
      key: `cite-${c.id}`,
      label: c.title || 'Untitled source',
      sub: [c.authors, c.year].filter(Boolean).join(' · '),
      citation: c
    }))
    const attResults: Result[] = attachments.map((a) => ({
      kind: 'attachment',
      key: `att-${a.id}`,
      label: a.filename,
      sub: a.mime,
      attachment: a
    }))
    return [...noteResults, ...eqResults, ...citeResults, ...attResults]
  }, [notes, equations, citations, attachments, q])

  if (!open) return null

  const choose = (r: Result | undefined): void => {
    if (!r) return
    setOpen(false)
    if (r.kind === 'note') selectNote(r.note.id)
    else if (r.kind === 'equation') setEquationPanel(true)
    else if (r.kind === 'citation') {
      setCitationFocusId(r.citation.id)
      setCitationLibraryOpen(true)
    } else if (r.kind === 'attachment') {
      openAttachment(r.attachment)
    }
  }

  let lastKind: Result['kind'] | null = null

  return (
    <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Search notes, equations, citations, files…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setIdx(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setIdx((i) => Math.min(i + 1, results.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setIdx((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter') {
              choose(results[idx])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
        <ul className={styles.results}>
          {results.map((r, i) => {
            const showHeader = r.kind !== lastKind
            lastKind = r.kind
            return (
              <li key={r.key}>
                {showHeader && q.trim() && <div className={styles.groupHead}>{KIND_LABEL[r.kind]}</div>}
                <div
                  className={i === idx ? `${styles.row} ${styles.sel}` : styles.row}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => choose(r)}
                >
                  <span className={styles.rowLabel}>{r.label}</span>
                  {r.sub && <span className={styles.rowSub}>{r.sub}</span>}
                </div>
              </li>
            )
          })}
          {results.length === 0 && <li className={styles.none}>No matches</li>}
        </ul>
      </div>
    </div>
  )
}
