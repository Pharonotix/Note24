import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CitationRefView } from './CitationRefView'
import { numAttr } from './nodeAttrs'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citationRef: {
      insertCitationRef: (citationId: number) => ReturnType
    }
  }
}

export const CitationRef = Node.create({
  name: 'citationRef',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      citationId: numAttr('citationId', 0)
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-citation-ref]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-citation-ref': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CitationRefView)
  },

  addCommands() {
    return {
      insertCitationRef:
        (citationId: number) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs: { citationId } },
            { type: 'text', text: ' ' }
          ])
    }
  }
})
