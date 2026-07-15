/**
 * Shared TipTap attribute builders: every custom node stores its attrs as
 * `data-<name>` DOM attributes with the same parse/render shape. Previously
 * copy-pasted (or hand-rolled inline) in each extension file.
 */

export const strAttr = (
  name: string,
  fallback = ''
): {
  default: string
  parseHTML: (el: HTMLElement) => string
  renderHTML: (attrs: Record<string, unknown>) => Record<string, unknown>
} => ({
  default: fallback,
  parseHTML: (el: HTMLElement) => el.getAttribute(`data-${name}`) || fallback,
  renderHTML: (attrs: Record<string, unknown>) => ({ [`data-${name}`]: attrs[name] })
})

export const numAttr = (
  name: string,
  fallback: number
): {
  default: number
  parseHTML: (el: HTMLElement) => number
  renderHTML: (attrs: Record<string, unknown>) => Record<string, unknown>
} => ({
  default: fallback,
  parseHTML: (el: HTMLElement) => Number(el.getAttribute(`data-${name}`)) || fallback,
  renderHTML: (attrs: Record<string, unknown>) => ({ [`data-${name}`]: attrs[name] })
})
