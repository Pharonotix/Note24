import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DataTableView } from './DataTableView'
import { DEFAULT_TABLE, serializeTableJson } from '../../../lib/tableData'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dataTable: {
      insertDataTable: () => ReturnType
    }
  }
}

const defaultJson = serializeTableJson(DEFAULT_TABLE)

export const DataTableNode = Node.create({
  name: 'dataTable',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      dataJson: {
        default: defaultJson,
        parseHTML: (el) => el.getAttribute('data-json') || defaultJson,
        renderHTML: (attrs) => ({ 'data-json': attrs.dataJson })
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-datatable]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-datatable': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DataTableView)
  },

  addCommands() {
    return {
      insertDataTable:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name })
    }
  }
})
