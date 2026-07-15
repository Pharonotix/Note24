import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DesmosGraph } from './DesmosGraph'
import { numAttr, strAttr } from './nodeAttrs'

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
      state: strAttr('state'),
      width: numAttr('width', 640),
      height: numAttr('height', 380),
      seed: strAttr('seed')
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
