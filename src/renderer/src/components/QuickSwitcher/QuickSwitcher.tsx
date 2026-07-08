import { useEffect, useMemo, useRef, useState } from 'react'
import type { NoteSummary } from '@shared/types'
import { useStore } from '../../store/store'
import styles from './QuickSwitcher.module.css'

export function QuickSwitcher(): React.JSX.Element | null {
  const open = useStore((s) => s.quickSwitcherOpen)
  const setOpen = useStore((s) => s.setQuickSwitcher)
  const selectNote = useStore((s) => s.selectNote)

  const [all, setAll] = useState<NoteSummary[]>([])
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      window.api.notes.list().then(setAll)
      setQ('')
      setIdx(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = term ? all.filter((n) => (n.title || 'Untitled').toLowerCase().includes(term)) : all
    return list.slice(0, 50)
  }, [all, q])

  if (!open) return null

  const choose = (n: NoteSummary | undefined): void => {
    if (!n) return
    selectNote(n.id)
    setOpen(false)
  }

  return (
    <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Jump to note…"
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
          {results.map((n, i) => (
            <li
              key={n.id}
              className={i === idx ? `${styles.row} ${styles.sel}` : styles.row}
              onMouseEnter={() => setIdx(i)}
              onClick={() => choose(n)}
            >
              {n.title || 'Untitled'}
            </li>
          ))}
          {results.length === 0 && <li className={styles.none}>No matches</li>}
        </ul>
      </div>
    </div>
  )
}
