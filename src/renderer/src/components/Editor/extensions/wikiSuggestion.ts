import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'

interface Option {
  label: string
  title: string
}

/**
 * Vanilla DOM popup for the `[[` wiki-link autocomplete. Shows matching note
 * titles plus a "Create …" option for the typed text. Styled with the app's
 * CSS variables (it lives outside the React tree, on document.body).
 */
export function wikiSuggestionRender() {
  let root: HTMLDivElement | null = null
  let items: string[] = []
  let query = ''
  let index = 0
  let command: (item: { title: string }) => void = () => {}
  let getRect: (() => DOMRect | null) | null = null

  const options = (): Option[] => {
    const opts: Option[] = items.map((t) => ({ label: t, title: t }))
    const q = query.trim()
    if (q && !items.some((t) => t.toLowerCase() === q.toLowerCase())) {
      opts.push({ label: `Create “${q}”`, title: q })
    }
    return opts
  }

  const paint = (): void => {
    if (!root) return
    const opts = options()
    if (index >= opts.length) index = Math.max(0, opts.length - 1)
    root.innerHTML = ''
    if (opts.length === 0) {
      const empty = document.createElement('div')
      empty.textContent = 'Type a note title…'
      empty.style.cssText = 'padding:8px 10px;color:var(--text-faint);font-size:13px;'
      root.appendChild(empty)
      return
    }
    opts.forEach((opt, i) => {
      const b = document.createElement('button')
      b.textContent = opt.label
      b.style.cssText = `display:block;width:100%;text-align:left;padding:7px 10px;border-radius:6px;font-size:13px;color:var(--text);background:${
        i === index ? 'var(--surface-3)' : 'transparent'
      };white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`
      b.addEventListener('mouseenter', () => {
        index = i
        paint()
      })
      b.addEventListener('mousedown', (e) => {
        e.preventDefault()
        command({ title: opt.title })
      })
      root!.appendChild(b)
    })
  }

  const position = (): void => {
    if (!root || !getRect) return
    const r = getRect()
    if (!r) return
    root.style.left = `${Math.round(r.left)}px`
    root.style.top = `${Math.round(r.bottom + 6)}px`
  }

  const sync = (props: SuggestionProps): void => {
    items = (props.items as string[]) ?? []
    query = props.query
    command = (item) => props.command(item)
    getRect = props.clientRect ?? null
  }

  return {
    onStart: (props: SuggestionProps): void => {
      sync(props)
      index = 0
      root = document.createElement('div')
      root.style.cssText =
        'position:fixed;z-index:200;min-width:220px;max-width:340px;max-height:280px;overflow:auto;' +
        'padding:5px;background:var(--surface);border:1px solid var(--border-strong);' +
        'border-radius:10px;box-shadow:0 12px 30px var(--shadow);'
      document.body.appendChild(root)
      paint()
      position()
    },
    onUpdate: (props: SuggestionProps): void => {
      sync(props)
      paint()
      position()
    },
    onKeyDown: (props: SuggestionKeyDownProps): boolean => {
      const opts = options()
      const key = props.event.key
      if (key === 'ArrowDown') {
        index = opts.length ? (index + 1) % opts.length : 0
        paint()
        return true
      }
      if (key === 'ArrowUp') {
        index = opts.length ? (index - 1 + opts.length) % opts.length : 0
        paint()
        return true
      }
      if (key === 'Enter') {
        if (opts[index]) command({ title: opts[index].title })
        return true
      }
      if (key === 'Escape') return true
      return false
    },
    onExit: (): void => {
      root?.remove()
      root = null
    }
  }
}
