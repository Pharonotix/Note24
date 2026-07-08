import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DrawingView } from './DrawingView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    drawing: {
      insertDrawing: () => ReturnType
    }
  }
}

export const DrawingNode = Node.create({
  name: 'drawing',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      scene: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-scene') || '',
        renderHTML: (attrs) => ({ 'data-scene': attrs.scene })
      },
      width: {
        default: 700,
        parseHTML: (el) => Number(el.getAttribute('data-width')) || 700,
        renderHTML: (attrs) => ({ 'data-width': attrs.width })
      },
      height: {
        default: 430,
        parseHTML: (el) => Number(el.getAttribute('data-height')) || 430,
        renderHTML: (attrs) => ({ 'data-height': attrs.height })
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-drawing]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-drawing': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingView)
  },

  addCommands() {
    return {
      insertDrawing:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name })
    }
  }
})
