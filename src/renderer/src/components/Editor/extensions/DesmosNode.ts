import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DesmosGraph } from './DesmosGraph'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    desmos: {
      insertDesmos: () => ReturnType
    }
  }
}

export const DesmosNode = Node.create({
  name: 'desmos',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      state: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-state') || '',
        renderHTML: (attrs) => ({ 'data-state': attrs.state })
      },
      width: {
        default: 640,
        parseHTML: (el) => Number(el.getAttribute('data-width')) || 640,
        renderHTML: (attrs) => ({ 'data-width': attrs.width })
      },
      height: {
        default: 380,
        parseHTML: (el) => Number(el.getAttribute('data-height')) || 380,
        renderHTML: (attrs) => ({ 'data-height': attrs.height })
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-desmos]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-desmos': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DesmosGraph)
  },

  addCommands() {
    return {
      insertDesmos:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name })
    }
  }
})
