import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ImageFileView } from './ImageFileView'
import { numAttr, strAttr } from './nodeAttrs'

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
      width: numAttr('width', 0)
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
