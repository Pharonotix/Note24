import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor, type Editor as TipTapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import type { Note } from '@shared/types'
import { useStore } from '../../store/store'
import { useDebouncedCallback } from '../../lib/useDebouncedCallback'
import { Toolbar } from './Toolbar'
import { InlineMath } from './extensions/InlineMath'
import { BlockMath } from './extensions/BlockMath'
import { DesmosNode } from './extensions/DesmosNode'
import { WikiLink } from './extensions/WikiLink'
import { ImageFile } from './extensions/ImageFile'
import { DrawingNode } from './extensions/DrawingNode'
import { CalculatorNode } from './extensions/CalculatorNode'
import { Backlinks } from '../Backlinks/Backlinks'
import styles from './Editor.module.css'

/** Uploads dropped/pasted files as attachments and inserts them into the editor. */
async function insertFiles(ed: TipTapEditor, files: FileList): Promise<void> {
  for (const file of Array.from(files)) {
    const data = new Uint8Array(await file.arrayBuffer())
    const att = await window.api.attachments.add(file.name, file.type || '', data)
    ed.chain()
      .focus()
      .insertImageFile({ attachmentId: att.id, filename: att.filename, mime: att.mime })
      .run()
  }
}

function parseContent(json: string): object {
  try {
    const doc = JSON.parse(json)
    if (doc && doc.type === 'doc') return doc
  } catch {
    /* fall through */
  }
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

/**
 * The note editor. Rendered with `key={note.id}` by the parent, so each note
 * gets a fresh editor initialized from its stored content; autosave and title
 * edits therefore always target this note, even mid-switch.
 */
export function Editor({ note }: { note: Note }): React.JSX.Element {
  const saveContent = useStore((s) => s.saveContent)
  const renameNote = useStore((s) => s.renameNote)
  const setEditor = useStore((s) => s.setEditor)
  const [title, setTitle] = useState(note.title)

  const { debounced: saveBody, flush: flushBody } = useDebouncedCallback(
    (content: string) => saveContent(note.id, content),
    600
  )
  const { debounced: saveTitle, flush: flushTitle } = useDebouncedCallback(
    (t: string) => renameNote(note.id, t),
    500
  )

  const editorRef = useRef<TipTapEditor | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing…  (type / for commands)' }),
      Highlight.configure({ multicolor: true }),
      InlineMath,
      BlockMath,
      DesmosNode,
      WikiLink,
      ImageFile,
      DrawingNode,
      CalculatorNode
    ],
    content: parseContent(note.content),
    onUpdate: ({ editor }) => saveBody(JSON.stringify(editor.getJSON())),
    editorProps: {
      handlePaste: (_view, event) => {
        const files = event.clipboardData?.files
        if (files && files.length && editorRef.current) {
          insertFiles(editorRef.current, files)
          return true
        }
        return false
      },
      handleDrop: (_view, event) => {
        const files = (event as DragEvent).dataTransfer?.files
        if (files && files.length && editorRef.current) {
          event.preventDefault()
          insertFiles(editorRef.current, files)
          return true
        }
        return false
      }
    }
  })
  editorRef.current = editor

  // Expose this note's editor to the store (used by the equation library panel).
  useEffect(() => {
    setEditor(editor)
    return () => setEditor(null)
  }, [editor, setEditor])

  // Flush pending saves when unmounting (i.e. switching notes).
  useEffect(() => {
    return () => {
      flushBody()
      flushTitle()
    }
  }, [flushBody, flushTitle])

  return (
    <div className={styles.editor}>
      {editor && <Toolbar editor={editor} />}
      <div className={styles.scroll}>
        <input
          className={styles.title}
          value={title}
          placeholder="Untitled"
          onChange={(e) => {
            setTitle(e.target.value)
            saveTitle(e.target.value)
          }}
        />
        <EditorContent editor={editor} className={styles.body} />
        <Backlinks noteId={note.id} />
      </div>
    </div>
  )
}
