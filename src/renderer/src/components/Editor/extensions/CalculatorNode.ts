import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CalculatorView } from './CalculatorView'

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
      text: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-text') || '',
        renderHTML: (attrs) => ({ 'data-text': attrs.text })
      },
      width: {
        default: 460,
        parseHTML: (el) => Number(el.getAttribute('data-width')) || 460,
        renderHTML: (attrs) => ({ 'data-width': attrs.width })
      }
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
