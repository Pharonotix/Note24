import { useEffect, useRef, useState } from 'react'
import { type DesmosCalculator, getDesmosApiKey, loadDesmos } from '../../lib/desmos'

/** A small standalone live Desmos calculator embedded in a whiteboard card. */
export function GraphCard({
  state,
  onChange
}: {
  state: string
  onChange: (state: string) => void
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const calcRef = useRef<DesmosCalculator | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    const create = async (): Promise<void> => {
      try {
        const key = await getDesmosApiKey()
        const Desmos = await loadDesmos(key)
        if (cancelled || !containerRef.current) return
        const calc = Desmos.GraphingCalculator(containerRef.current, {
          expressions: true,
          settingsMenu: false,
          zoomButtons: true,
          border: false
        })
        calcRef.current = calc
        if (state) {
          try {
            calc.setState(JSON.parse(state))
          } catch {
            /* ignore malformed state */
          }
        }
        calc.observeEvent('change', () => {
          if (saveTimer.current) clearTimeout(saveTimer.current)
          saveTimer.current = setTimeout(() => onChange(JSON.stringify(calc.getState())), 700)
        })
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }
    create()
    return () => {
      cancelled = true
      if (saveTimer.current) clearTimeout(saveTimer.current)
      calcRef.current?.destroy()
      calcRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {status !== 'ready' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontSize: 11,
            color: 'var(--text-faint)',
            background: 'var(--surface)'
          }}
        >
          {status === 'loading' ? 'Loading…' : 'Failed to load Desmos'}
        </div>
      )}
    </div>
  )
}
