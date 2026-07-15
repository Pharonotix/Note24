import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DrawingView } from './DrawingView'
import { numAttr, strAttr } from './nodeAttrs'

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
      scene: strAttr('scene'),
      width: numAttr('width', 700),
      height: numAttr('height', 430)
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
