import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CalculatorView } from './CalculatorView'
import { numAttr, strAttr } from './nodeAttrs'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    calculator: {
      insertCalculator: () => ReturnType
    }
  }
}

export const CalculatorNode = Node.create({
  name: 'calculator',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      text: strAttr('text'),
      width: numAttr('width', 460)
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-calculator]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-calculator': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalculatorView)
  },

  addCommands() {
    return {
      insertCalculator:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name })
    }
  }
})
