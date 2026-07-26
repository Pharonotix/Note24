import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, Pencil, Plus, RotateCcw, Sparkles, Trash2, X, XCircle } from 'lucide-react'
import type { Equation, Flashcard, FlashcardInput } from '@shared/types'
import { useStore } from '../../store/store'
import { renderLatex } from '../../lib/katex'
import { isDue } from '../../lib/spacedRepetition'
import { ConfirmDialog, type ConfirmRequest } from '../ConfirmDialog/ConfirmDialog'
import styles from './StudyPanel.module.css'

type Tab = 'cards' | 'study' | 'sheet'

const EMPTY_FORM: FlashcardInput = { front: '', back: '', backFormat: 'text', category: '' }

function groupByCategory<T extends { category: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = item.category || 'Uncategorized'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

function Latex({ latex }: { latex: string }): React.JSX.Element {
  const { html } = renderLatex(latex, true)
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export function StudyPanel(): React.JSX.Element | null {
  const open = useStore((s) => s.studyPanelOpen)
  const setOpen = useStore((s) => s.setStudyPanelOpen)
  const flashcards = useStore((s) => s.flashcards)
  const refreshFlashcards = useStore((s) => s.refreshFlashcards)
  const generateFromEquations = useStore((s) => s.generateFlashcardsFromEquations)
  const reviewFlashcard = useStore((s) => s.reviewFlashcard)

  const [tab, setTab] = useState<Tab>('cards')
  const [equations, setEquations] = useState<Equation[]>([])
  const [cardsQuery, setCardsQuery] = useState('')
  const [sheetQuery, setSheetQuery] = useState('')
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<FlashcardInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [genMsg, setGenMsg] = useState<string | null>(null)

  const [queue, setQueue] = useState<Flashcard[]>([])
  const [sessionIdx, setSessionIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, missed: 0 })

  useEffect(() => {
    if (open) {
      refreshFlashcards()
      window.api.equations.list().then(setEquations)
    }
  }, [open, refreshFlashcards])

  const dueCards = flashcards.filter((c) => isDue(c.dueAt))

  const filteredCards = useMemo(() => {
    const q = cardsQuery.trim().toLowerCase()
    if (!q) return flashcards
    return flashcards.filter(
      (c) => c.front.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    )
  }, [flashcards, cardsQuery])

  const groupedCards = useMemo(() => groupByCategory(filteredCards), [filteredCards])

  const filteredSheet = useMemo(() => {
    const q = sheetQuery.trim().toLowerCase()
    const groups = groupByCategory(equations)
    if (!q) return groups
    return groups
      .map(([cat, items]) => [
        cat,
        items.filter((eq) => eq.name.toLowerCase().includes(q) || cat.toLowerCase().includes(q))
      ] as [string, Equation[]])
      .filter(([, items]) => items.length > 0)
  }, [equations, sheetQuery])

  if (!open) return null

  const startAdd = (): void => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setEditingId('new')
  }
  const startEdit = (c: Flashcard): void => {
    setForm({ front: c.front, back: c.back, backFormat: c.backFormat, category: c.category })
    setFormError(null)
    setEditingId(c.id)
  }
  const submit = async (): Promise<void> => {
    if (!form.front.trim() || !form.back?.trim()) {
      setFormError('Front and back are both required.')
      return
    }
    if (editingId === 'new') {
      await window.api.flashcards.create(form)
    } else if (typeof editingId === 'number') {
      await window.api.flashcards.update(editingId, form)
    }
    setEditingId(null)
    setFormError(null)
    await refreshFlashcards()
  }
  const remove = async (id: number): Promise<void> => {
    await window.api.flashcards.delete(id)
    setConfirmId(null)
    await refreshFlashcards()
  }
  const runGenerate = async (): Promise<void> => {
    const created = await generateFromEquations()
    setGenMsg(
      created > 0
        ? `Generated ${created} new card${created === 1 ? '' : 's'}.`
        : 'Already up to date — no new equations.'
    )
    setTimeout(() => setGenMsg(null), 3000)
  }

  const startSession = (): void => {
    const source = dueCards.length > 0 ? dueCards : flashcards
    setQueue([...source].sort(() => Math.random() - 0.5))
    setSessionIdx(0)
    setFlipped(false)
    setSessionDone(false)
    setSessionStats({ correct: 0, missed: 0 })
  }

  const grade = async (correct: boolean): Promise<void> => {
    const card = queue[sessionIdx]
    if (!card) return
    await reviewFlashcard(card.id, correct)
    setSessionStats((s) => (correct ? { ...s, correct: s.correct + 1 } : { ...s, missed: s.missed + 1 }))
    if (sessionIdx + 1 >= queue.length) {
      setSessionDone(true)
    } else {
      setSessionIdx((i) => i + 1)
      setFlipped(false)
    }
  }

  const endSession = (): void => {
    setQueue([])
    setSessionDone(false)
  }

  const currentCard = queue[sessionIdx]

  return (
    <aside className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.title}>Study</span>
        <button className={styles.close} onClick={() => setOpen(false)} title="Close">
          <X size={15} />
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={tab === 'cards' ? `${styles.tab} ${styles.tabOn}` : styles.tab}
          onClick={() => setTab('cards')}
        >
          Flashcards{flashcards.length > 0 && <span className={styles.badge}>{flashcards.length}</span>}
        </button>
        <button
          className={tab === 'study' ? `${styles.tab} ${styles.tabOn}` : styles.tab}
          onClick={() => setTab('study')}
        >
          Study{dueCards.length > 0 && <span className={styles.badgeDue}>{dueCards.length}</span>}
        </button>
        <button
          className={tab === 'sheet' ? `${styles.tab} ${styles.tabOn}` : styles.tab}
          onClick={() => setTab('sheet')}
        >
          Formula Sheet
        </button>
      </div>

      {tab === 'cards' && (
        <>
          <div className={styles.controls}>
            <input
              className={styles.search}
              placeholder="Search flashcards…"
              value={cardsQuery}
              onChange={(e) => setCardsQuery(e.target.value)}
            />
            <button className={styles.add} onClick={startAdd} title="Add flashcard">
              <Plus size={16} />
            </button>
          </div>
          <button className={styles.generateBtn} onClick={runGenerate}>
            <Sparkles size={13} /> Generate from Equations
          </button>
          {genMsg && <div className={styles.genMsg}>{genMsg}</div>}

          {editingId !== null && (
            <div className={styles.form}>
              <input
                className={styles.field}
                placeholder="Front (question)"
                value={form.front}
                onChange={(e) => setForm({ ...form, front: e.target.value })}
              />
              <textarea
                className={styles.fieldArea}
                placeholder="Back (answer)"
                value={form.back}
                rows={3}
                onChange={(e) => setForm({ ...form, back: e.target.value })}
              />
              <div className={styles.fieldRow}>
                <input
                  className={styles.field}
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
                <select
                  className={styles.field}
                  value={form.backFormat}
                  onChange={(e) =>
                    setForm({ ...form, backFormat: e.target.value as 'text' | 'latex' })
                  }
                >
                  <option value="text">Plain text</option>
                  <option value="latex">LaTeX</option>
                </select>
              </div>
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
            {groupedCards.map(([cat, items]) => (
              <div key={cat} className={styles.group}>
                <div className={styles.groupTitle}>
                  {cat} <span className={styles.groupCount}>{items.length}</span>
                </div>
                {items.map((c) => (
                  <div key={c.id} className={styles.item}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemTitle}>{c.front}</div>
                      <div className={styles.itemMeta}>
                        {isDue(c.dueAt) ? (
                          <span className={styles.due}>Due now</span>
                        ) : (
                          `Due ${new Date(c.dueAt).toLocaleDateString()}`
                        )}
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
                  </div>
                ))}
              </div>
            ))}
            {filteredCards.length === 0 && (
              <div className={styles.empty}>
                No flashcards yet. Add one, or generate from your equation library.
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'study' && (
        <div className={styles.studyArea}>
          {queue.length === 0 || sessionDone ? (
            <div className={styles.sessionStart}>
              {sessionDone && (
                <div className={styles.sessionSummary}>
                  <Check size={24} />
                  <div>
                    Session complete — {sessionStats.correct} correct, {sessionStats.missed} missed.
                  </div>
                </div>
              )}
              <div className={styles.dueCount}>
                {dueCards.length} card{dueCards.length === 1 ? '' : 's'} due today
              </div>
              <button className={styles.startBtn} disabled={flashcards.length === 0} onClick={startSession}>
                <BookOpen size={14} /> {dueCards.length > 0 ? 'Start Study Session' : 'Review All Cards'}
              </button>
            </div>
          ) : !currentCard ? null : (
            <div className={styles.card}>
              <div className={styles.cardProgress}>
                {sessionIdx + 1} / {queue.length}
              </div>
              <div className={styles.cardFace} onClick={() => setFlipped((f) => !f)}>
                {!flipped ? (
                  <div className={styles.cardFront}>{currentCard.front}</div>
                ) : currentCard.backFormat === 'latex' ? (
                  <div className={styles.cardBack}>
                    <Latex latex={currentCard.back} />
                  </div>
                ) : (
                  <div className={styles.cardBack}>{currentCard.back}</div>
                )}
                <div className={styles.flipHint}>
                  {flipped ? 'Click to flip back' : 'Click to reveal answer'}
                </div>
              </div>
              {flipped && (
                <div className={styles.gradeRow}>
                  <button className={styles.missBtn} onClick={() => grade(false)}>
                    <XCircle size={14} /> Missed it
                  </button>
                  <button className={styles.gotBtn} onClick={() => grade(true)}>
                    <Check size={14} /> Got it
                  </button>
                </div>
              )}
              <button className={styles.restartBtn} onClick={endSession}>
                <RotateCcw size={12} /> End session
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'sheet' && (
        <div className={styles.sheet}>
          <div className={styles.controls}>
            <input
              className={styles.search}
              placeholder="Filter by name/category…"
              value={sheetQuery}
              onChange={(e) => setSheetQuery(e.target.value)}
            />
          </div>
          <div className={styles.list}>
            {filteredSheet.map(([cat, items]) => (
              <div key={cat} className={styles.group}>
                <div className={styles.groupTitle}>
                  {cat} <span className={styles.groupCount}>{items.length}</span>
                </div>
                {items.map((eq) => (
                  <div key={eq.id} className={styles.sheetItem}>
                    <div className={styles.sheetName}>{eq.name}</div>
                    <div className={styles.sheetLatex}>
                      <Latex latex={eq.latex} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {equations.length === 0 && (
              <div className={styles.empty}>No equations in your library yet.</div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        request={
          confirmId != null
            ? ({ title: 'Delete flashcard?', message: 'This flashcard will be permanently deleted.' } as ConfirmRequest)
            : null
        }
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId != null && remove(confirmId)}
      />
    </aside>
  )
}
