/**
 * Shared pointer-drag resize used by every resizable block node view
 * (calculator, Desmos graph, drawing, image). Call from the resize handle's
 * onPointerDown; drags from the pointer-down position, clamping to minimums.
 * Height tracking is enabled by passing `startH` (blocks that only resize
 * horizontally omit it and ignore the height argument in their callbacks).
 */
export function startResizeDrag(
  e: React.PointerEvent,
  opts: {
    startW: number
    startH?: number
    minW: number
    minH?: number
    /** Live feedback during the drag (unrounded). */
    onLive: (w: number, h: number) => void
    /** Final size on pointer-up (rounded) — persist it here. */
    onCommit: (w: number, h: number) => void
  }
): void {
  e.preventDefault()
  e.stopPropagation()
  const startX = e.clientX
  const startY = e.clientY
  let lw = opts.startW
  let lh = opts.startH ?? 0
  const move = (ev: PointerEvent): void => {
    lw = Math.max(opts.minW, opts.startW + (ev.clientX - startX))
    if (opts.startH != null) lh = Math.max(opts.minH ?? 0, opts.startH + (ev.clientY - startY))
    opts.onLive(lw, lh)
  }
  const up = (): void => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    opts.onCommit(Math.round(lw), Math.round(lh))
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}
