import { useEffect, useReducer } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Calculator,
  ChartLine,
  Code,
  CodeXml,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  List,
  ListOrdered,
  Minus,
  PenLine,
  Quote,
  Radical,
  Redo,
  Sheet,
  SquareRadical,
  Strikethrough,
  Underline,
  Undo
} from 'lucide-react'
import { useStore } from '../../store/store'
import styles from './Toolbar.module.css'

const ICON = { size: 16, strokeWidth: 2 }

/** Formatting toolbar bound to a TipTap editor instance. */
export function Toolbar({ editor, noteId }: { editor: Editor; noteId: number }): React.JSX.Element {
  const [, force] = useReducer((x: number) => x + 1, 0)

  useEffect(() => {
    const update = (): void => force()
    editor.on('transaction', update)
    return () => {
      editor.off('transaction', update)
    }
  }, [editor])

  const btn = (
    icon: React.ReactNode,
    title: string,
    onClick: () => void,
    active = false
  ): React.JSX.Element => (
    <button
      className={active ? `${styles.btn} ${styles.active}` : styles.btn}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      type="button"
    >
      {icon}
    </button>
  )

  const chain = (): ReturnType<Editor['chain']> => editor.chain().focus()

  const HIGHLIGHTS = [
    { name: 'Yellow', color: 'rgba(250,204,21,0.40)' },
    { name: 'Green', color: 'rgba(74,222,128,0.38)' },
    { name: 'Blue', color: 'rgba(96,165,250,0.38)' },
    { name: 'Pink', color: 'rgba(244,114,182,0.38)' }
  ]

  const swatch = (name: string, color: string): React.JSX.Element => {
    const active = editor.isActive('highlight', { color })
    return (
      <button
        key={color}
        className={active ? `${styles.swatch} ${styles.swatchOn}` : styles.swatch}
        style={{ background: color }}
        title={`Highlight ${name}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          active
            ? chain().unsetHighlight().run()
            : chain().setHighlight({ color }).run()
        }
      />
    )
  }

  const insertImage = async (): Promise<void> => {
    const att = await window.api.attachments.pick({ noteId })
    if (att) {
      chain()
        .insertImageFile({ attachmentId: att.id, filename: att.filename, mime: att.mime })
        .run()
      useStore.getState().bumpAttachments()
    }
  }

  return (
    <div className={styles.toolbar}>
      {btn(<Bold {...ICON} />, 'Bold', () => chain().toggleBold().run(), editor.isActive('bold'))}
      {btn(<Italic {...ICON} />, 'Italic', () => chain().toggleItalic().run(), editor.isActive('italic'))}
      {btn(<Underline {...ICON} />, 'Underline', () => chain().toggleUnderline().run(), editor.isActive('underline'))}
      {btn(<Strikethrough {...ICON} />, 'Strikethrough', () => chain().toggleStrike().run(), editor.isActive('strike'))}
      {btn(<Code {...ICON} />, 'Inline code', () => chain().toggleCode().run(), editor.isActive('code'))}
      <span className={styles.sep} />
      {HIGHLIGHTS.map((h) => swatch(h.name, h.color))}
      <span className={styles.sep} />
      {btn(<Heading1 {...ICON} />, 'Heading 1', () => chain().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
      {btn(<Heading2 {...ICON} />, 'Heading 2', () => chain().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn(<Heading3 {...ICON} />, 'Heading 3', () => chain().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      <span className={styles.sep} />
      {btn(<List {...ICON} />, 'Bullet list', () => chain().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn(<ListOrdered {...ICON} />, 'Numbered list', () => chain().toggleOrderedList().run(), editor.isActive('orderedList'))}
      {btn(<Quote {...ICON} />, 'Quote', () => chain().toggleBlockquote().run(), editor.isActive('blockquote'))}
      {btn(<CodeXml {...ICON} />, 'Code block', () => chain().toggleCodeBlock().run(), editor.isActive('codeBlock'))}
      {btn(<Minus {...ICON} />, 'Divider', () => chain().setHorizontalRule().run())}
      <span className={styles.sep} />
      {btn(<Radical {...ICON} />, 'Inline equation', () => chain().insertInlineMath().run())}
      {btn(<SquareRadical {...ICON} />, 'Block equation', () => chain().insertBlockMath().run())}
      {btn(<ChartLine {...ICON} />, 'Insert Desmos graph', () => chain().insertDesmos().run())}
      {btn(<Image {...ICON} />, 'Insert image / file', () => void insertImage())}
      {btn(<PenLine {...ICON} />, 'Insert drawing', () => chain().insertDrawing().run())}
      {btn(<Calculator {...ICON} />, 'Insert calculator', () => chain().insertCalculator().run())}
      {btn(<Sheet {...ICON} />, 'Insert table', () => chain().insertDataTable().run())}
      <span className={styles.sep} />
      {btn(<Undo {...ICON} />, 'Undo', () => chain().undo().run())}
      {btn(<Redo {...ICON} />, 'Redo', () => chain().redo().run())}
    </div>
  )
}
