import { useEffect, useMemo, useRef } from 'react'

/**
 * Returns a debounced version of `fn` plus a `flush()` that runs any pending
 * call immediately. Pending calls are also flushed on unmount, so edits are
 * never lost when switching notes.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): { debounced: (...args: A) => void; flush: () => void } {
  const fnRef = useRef(fn)
  fnRef.current = fn

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastArgs = useRef<A | null>(null)

  const debounced = useMemo(() => {
    return (...args: A): void => {
      lastArgs.current = args
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        const a = lastArgs.current
        lastArgs.current = null
        if (a) fnRef.current(...a)
      }, ms)
    }
  }, [ms])

  const flush = useMemo(() => {
    return (): void => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
      const a = lastArgs.current
      lastArgs.current = null
      if (a) fnRef.current(...a)
    }
  }, [])

  useEffect(() => flush, [flush])

  return { debounced, flush }
}
