import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { FlowchartView } from './FlowchartView'
import { numAttr, strAttr } from './nodeAttrs'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    flowchart: {
      insertFlowchart: () => ReturnType
    }
  }
}

/** Flowchart / mind-map / dependency-map block, backed by React Flow (see FlowchartCanvas). */
export const FlowchartNode = Node.create({
  name: 'flowchart',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      // JSON-stringified { nodes: FlowNode[], edges: FlowEdge[] }
      data: strAttr('flowdata', '{"nodes":[],"edges":[]}'),
      width: numAttr('width', 700),
      height: numAttr('height', 420)
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-flowchart]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-flowchart': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FlowchartView)
  },

  addCommands() {
    return {
      insertFlowchart:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name })
    }
  }
})
