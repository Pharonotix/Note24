import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Suggestion } from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { WikiLinkView } from './WikiLinkView'
import { wikiSuggestionRender } from './wikiSuggestion'

export const WikiLink = Node.create({
  name: 'wikiLink',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      title: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-title') || '',
        renderHTML: (attrs) => ({ 'data-title': attrs.title })
      }
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-wikilink]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-wikilink': '' }),
      `[[${node.attrs.title}]]`
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(WikiLinkView)
  },

  addProseMirrorPlugins() {
    const type = this.name
    return [
      Suggestion({
        editor: this.editor,
        char: '[[',
        pluginKey: new PluginKey('wikiLinkSuggestion'),
        allowSpaces: true,
        startOfLine: false,
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              { type, attrs: { title: (props as { title: string }).title } },
              { type: 'text', text: ' ' }
            ])
            .run()
        },
        items: async ({ query }) => {
          const notes = await window.api.notes.list()
          const q = query.toLowerCase()
          return notes
            .map((n) => n.title)
            .filter((t) => t.toLowerCase().includes(q))
            .slice(0, 8)
        },
        render: wikiSuggestionRender
      })
    ]
  }
})
