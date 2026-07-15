import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { MathView } from './MathView'
import { strAttr } from './nodeAttrs'

export interface BlockMathAttrs {
  latex?: string
  /** Optional context carried over when inserted from the equation library. */
  name?: string
  description?: string
  /** JSON-stringified EquationVariable[]. */
  variablesJson?: string
  /** When true, metadata is hidden and only the formula shows. Defaults collapsed. */
  collapsed?: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockMath: {
      insertBlockMath: (attrs?: BlockMathAttrs) => ReturnType
    }
  }
}

export const BlockMath = Node.create({
  name: 'blockMath',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      latex: strAttr('latex'),
      name: strAttr('name'),
      description: strAttr('description'),
      variablesJson: strAttr('variablesJson'),
      // Boolean; missing attribute (older notes / bare equations) reads as collapsed.
      collapsed: {
        default: true,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-collapsed') !== 'false',
        renderHTML: (attrs: Record<string, unknown>) => ({ 'data-collapsed': String(attrs.collapsed) })
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-block-math]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-block-math': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathView)
  },

  addCommands() {
    return {
      insertBlockMath:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              latex: attrs.latex ?? '',
              name: attrs.name ?? '',
              description: attrs.description ?? '',
              variablesJson: attrs.variablesJson ?? '',
              collapsed: attrs.collapsed ?? true
            }
          })
    }
  }
})
