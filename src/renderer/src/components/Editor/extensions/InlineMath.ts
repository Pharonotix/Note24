import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { MathView } from './MathView'
import { strAttr } from './nodeAttrs'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineMath: {
      insertInlineMath: (attrs?: { latex?: string }) => ReturnType
    }
  }
}

export const InlineMath = Node.create({
  name: 'inlineMath',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      latex: strAttr('latex')
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-inline-math]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-inline-math': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathView)
  },

  addCommands() {
    return {
      insertInlineMath:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { latex: attrs.latex ?? '' } })
    }
  }
})
