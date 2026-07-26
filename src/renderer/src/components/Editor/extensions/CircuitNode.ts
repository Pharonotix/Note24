import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CircuitView } from './CircuitView'
import { numAttr, strAttr } from './nodeAttrs'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    circuit: {
      insertCircuit: () => ReturnType
    }
  }
}

/** Circuit schematic block, backed by React Flow (see CircuitCanvas). */
export const CircuitNode = Node.create({
  name: 'circuit',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      // JSON-stringified { nodes: CircuitFlowNode[], edges: CircuitFlowEdge[] }
      data: strAttr('circuitdata', '{"nodes":[],"edges":[]}'),
      width: numAttr('width', 720),
      height: numAttr('height', 440)
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-circuit]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-circuit': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CircuitView)
  },

  addCommands() {
    return {
      insertCircuit:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name })
    }
  }
})
