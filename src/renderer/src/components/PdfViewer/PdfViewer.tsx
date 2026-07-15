import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { useStore } from '../../store/store'
import { loadPdfJs } from '../../lib/pdf'
import styles from './PdfViewer.module.css'

type SidebarMode = 'thumbnails' | 'outline' | 'search' | null

interface OutlineNode {
  title: string
  pageNumber: number | null
  items: OutlineNode[]
}

interface RawOutlineNode {
  title: string
  dest: string | unknown[] | null
  items: RawOutlineNode[]
}

const MIN_SCALE = 0.4
const MAX_SCALE = 3
const SCALE_STEP = 0.2

export function PdfViewer(): React.JSX.Element | null {
  const pdf = useStore((s) => s.pdfViewer)
  const setPdfViewer = useStore((s) => s.setPdfViewer)
  if (!pdf) return null
  return <PdfViewerInner id={pdf.id} filename={pdf.filename} onClose={() => setPdfViewer(null)} />
}

function PdfViewerInner({
  id,
  filename,
  onClose
}: {
  id: string
  filename: string
  onClose: () => void
}): React.JSX.Element {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [scale, setScale] = useState(1.1)
  const [sidebar, setSidebar] = useState<SidebarMode>(null)
  const [outline, setOutline] = useState<OutlineNode[] | null>(null)
  const [thumbUrls, setThumbUrls] = useState<Record<number, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchStatus, setSearchStatus] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [searchResults, setSearchResults] = useState<{ page: number; snippet: string }[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pageTextsRef = useRef<string[] | null>(null)
  const renderGenRef = useRef(0)
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null)

  // Load the document.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [pdfjsLib, bytesRes] = await Promise.all([loadPdfJs(), window.api.attachments.readBytes(id)])
        if (!bytesRes) throw new Error('File not found')
        if (cancelled) return
        const loadingTask = pdfjsLib.getDocument({ data: bytesRes.data })
        loadingTaskRef.current = loadingTask
        const loaded = await loadingTask.promise
        if (cancelled) return
        setDoc(loaded)
        setNumPages(loaded.numPages)
        setStatus('ready')
        loaded.getOutline().then((raw) => {
          if (cancelled || !raw) return
          resolveOutline(loaded, raw as RawOutlineNode[]).then((resolved) => {
            if (!cancelled) setOutline(resolved)
          })
        })
      } catch (e) {
        if (cancelled) return
        setErrorMsg(e instanceof Error ? e.message : 'Failed to open PDF')
        setStatus('error')
      }
    })()
    return () => {
      cancelled = true
      loadingTaskRef.current?.destroy()
    }
  }, [id])

  // Render the current page whenever page/scale/doc changes.
  useEffect(() => {
    if (!doc || !canvasRef.current) return
    const gen = ++renderGenRef.current
    let task: ReturnType<PDFPageProxy['render']> | null = null
    ;(async () => {
      const page = await doc.getPage(pageNum)
      if (gen !== renderGenRef.current) return
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      task = page.render({ canvas, canvasContext: ctx, viewport })
      try {
        await task.promise
      } catch {
        /* superseded by a newer render — ignore */
      }
    })()
    return () => {
      task?.cancel()
    }
  }, [doc, pageNum, scale])

  useEffect(() => setPageInput(String(pageNum)), [pageNum])

  const goToPage = (n: number): void => setPageNum(Math.min(numPages, Math.max(1, n)))

  // Lazily render a thumbnail the first time it scrolls into view.
  const thumbRef = (node: HTMLDivElement | null, n: number): void => {
    if (!node || !doc || thumbUrls[n]) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        observer.disconnect()
        renderThumbnail(doc, n).then((url) => {
          if (url) setThumbUrls((prev) => ({ ...prev, [n]: url }))
        })
      },
      { root: node.parentElement, rootMargin: '200px' }
    )
    observer.observe(node)
  }

  const runSearch = async (query: string): Promise<void> => {
    setSearchQuery(query)
    if (!doc || !query.trim()) {
      setSearchResults([])
      return
    }
    if (!pageTextsRef.current) {
      setSearchStatus('scanning')
      const texts: string[] = []
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p)
        const content = await page.getTextContent()
        texts.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '))
      }
      pageTextsRef.current = texts
      setSearchStatus('done')
    }
    const q = query.trim().toLowerCase()
    const results: { page: number; snippet: string }[] = []
    pageTextsRef.current.forEach((text, i) => {
      const idx = text.toLowerCase().indexOf(q)
      if (idx === -1) return
      const start = Math.max(0, idx - 30)
      const snippet = (start > 0 ? '…' : '') + text.slice(start, idx + q.length + 30) + '…'
      results.push({ page: i + 1, snippet })
    })
    setSearchResults(results)
  }

  const zoomIn = (): void => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))
  const zoomOut = (): void => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))

  return (
    <div className={styles.overlay}>
      <div className={styles.window}>
        <div className={styles.header}>
          <span className={styles.filename} title={filename}>
            📄 {filename}
          </span>
          <div className={styles.headActions}>
            <button className={styles.hbtn} onClick={() => window.api.attachments.open(id)}>
              Open externally
            </button>
            <button className={styles.close} onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        {status === 'ready' && (
          <div className={styles.toolbar}>
            <button
              className={sidebar === 'thumbnails' ? `${styles.tbtn} ${styles.tbtnOn}` : styles.tbtn}
              onClick={() => setSidebar((v) => (v === 'thumbnails' ? null : 'thumbnails'))}
            >
              🖼 Thumbnails
            </button>
            <button
              className={sidebar === 'outline' ? `${styles.tbtn} ${styles.tbtnOn}` : styles.tbtn}
              disabled={!outline || outline.length === 0}
              onClick={() => setSidebar((v) => (v === 'outline' ? null : 'outline'))}
              title={!outline || outline.length === 0 ? 'This PDF has no bookmarks' : undefined}
            >
              🔖 Bookmarks
            </button>
            <button
              className={sidebar === 'search' ? `${styles.tbtn} ${styles.tbtnOn}` : styles.tbtn}
              onClick={() => setSidebar((v) => (v === 'search' ? null : 'search'))}
            >
              🔍 Search
            </button>
            <span className={styles.sep} />
            <button className={styles.tbtn} onClick={() => goToPage(pageNum - 1)} disabled={pageNum <= 1}>
              ‹
            </button>
            <input
              className={styles.pageInput}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => goToPage(Number(pageInput) || pageNum)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') goToPage(Number(pageInput) || pageNum)
              }}
            />
            <span className={styles.pageOf}>/ {numPages}</span>
            <button className={styles.tbtn} onClick={() => goToPage(pageNum + 1)} disabled={pageNum >= numPages}>
              ›
            </button>
            <span className={styles.sep} />
            <button className={styles.tbtn} onClick={zoomOut}>
              −
            </button>
            <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
            <button className={styles.tbtn} onClick={zoomIn}>
              +
            </button>
          </div>
        )}

        <div className={styles.body}>
          {sidebar && status === 'ready' && (
            <div className={styles.sidebar}>
              {sidebar === 'thumbnails' && (
                <div className={styles.thumbList}>
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                    <div
                      key={n}
                      ref={(node) => thumbRef(node, n)}
                      className={n === pageNum ? `${styles.thumb} ${styles.thumbOn}` : styles.thumb}
                      onClick={() => goToPage(n)}
                    >
                      {thumbUrls[n] ? (
                        <img src={thumbUrls[n]} alt={`Page ${n}`} />
                      ) : (
                        <div className={styles.thumbPlaceholder} />
                      )}
                      <span className={styles.thumbNum}>{n}</span>
                    </div>
                  ))}
                </div>
              )}
              {sidebar === 'outline' && outline && (
                <div className={styles.outline}>
                  <OutlineList items={outline} depth={0} onJump={goToPage} />
                </div>
              )}
              {sidebar === 'search' && (
                <div className={styles.search}>
                  <input
                    autoFocus
                    className={styles.searchInput}
                    placeholder="Search this document…"
                    value={searchQuery}
                    onChange={(e) => runSearch(e.target.value)}
                  />
                  {searchStatus === 'scanning' && <div className={styles.searchHint}>Scanning pages…</div>}
                  {searchStatus === 'done' && searchQuery.trim() && (
                    <div className={styles.searchHint}>
                      {searchResults.length} match{searchResults.length === 1 ? '' : 'es'}
                    </div>
                  )}
                  <div className={styles.searchResults}>
                    {searchResults.map((r, i) => (
                      <button key={i} className={styles.searchResult} onClick={() => goToPage(r.page)}>
                        <span className={styles.searchPage}>p. {r.page}</span>
                        <span className={styles.searchSnippet}>{r.snippet}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.pageArea}>
            {status === 'loading' && <div className={styles.status}>Loading PDF…</div>}
            {status === 'error' && <div className={`${styles.status} ${styles.err}`}>⚠ {errorMsg}</div>}
            {status === 'ready' && (
              <div className={styles.canvasWrap}>
                <canvas ref={canvasRef} className={styles.canvas} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function OutlineList({
  items,
  depth,
  onJump
}: {
  items: OutlineNode[]
  depth: number
  onJump: (page: number) => void
}): React.JSX.Element {
  return (
    <div style={{ marginLeft: depth ? 12 : 0 }}>
      {items.map((item, i) => (
        <div key={i}>
          <button
            className={styles.outlineItem}
            disabled={item.pageNumber == null}
            onClick={() => item.pageNumber != null && onJump(item.pageNumber)}
          >
            {item.title}
          </button>
          {item.items.length > 0 && <OutlineList items={item.items} depth={depth + 1} onJump={onJump} />}
        </div>
      ))}
    </div>
  )
}

async function resolveOutline(doc: PDFDocumentProxy, raw: RawOutlineNode[]): Promise<OutlineNode[]> {
  const resolveOne = async (node: RawOutlineNode): Promise<OutlineNode> => {
    const pageNumber = await resolveDestPage(doc, node.dest)
    const items = await Promise.all(node.items.map(resolveOne))
    return { title: node.title, pageNumber, items }
  }
  return Promise.all(raw.map(resolveOne))
}

async function resolveDestPage(doc: PDFDocumentProxy, dest: string | unknown[] | null): Promise<number | null> {
  try {
    let explicitDest = dest
    if (typeof dest === 'string') {
      explicitDest = await doc.getDestination(dest)
    }
    if (!Array.isArray(explicitDest) || !explicitDest.length) return null
    const ref = explicitDest[0]
    const index = typeof ref === 'number' ? ref : await doc.getPageIndex(ref as never)
    return index + 1
  } catch {
    return null
  }
}

async function renderThumbnail(doc: PDFDocumentProxy, pageNumber: number): Promise<string | null> {
  try {
    const page = await doc.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 0.2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    await page.render({ canvas, canvasContext: ctx, viewport }).promise
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}
