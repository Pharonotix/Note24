import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ImageFileView } from './ImageFileView'

export interface ImageFileAttrs {
  attachmentId: string
  filename: string
  mime: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageFile: {
      insertImageFile: (attrs: ImageFileAttrs) => ReturnType
    }
  }
}

const strAttr = (name: string) => ({
  default: '',
  parseHTML: (el: HTMLElement) => el.getAttribute(`data-${name}`) || '',
  renderHTML: (attrs: Record<string, unknown>) => ({ [`data-${name}`]: attrs[name] })
})

export const ImageFile = Node.create({
  name: 'imageFile',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      attachmentId: strAttr('attachmentId'),
      filename: strAttr('filename'),
      mime: strAttr('mime'),
      width: {
        default: 0,
        parseHTML: (el) => Number(el.getAttribute('data-width')) || 0,
        renderHTML: (attrs) => ({ 'data-width': attrs.width })
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-imagefile]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-imagefile': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageFileView)
  },

  addCommands() {
    return {
      insertImageFile:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs })
    }
  }
})
