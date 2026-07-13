import { useEffect, useReducer } from 'react'
import type { Editor } from '@tiptap/react'
import styles from './Toolbar.module.css'

/** Formatting toolbar bound to a TipTap editor instance. */
export function Toolbar({ editor }: { editor: Editor }): React.JSX.Element {
  const [, force] = useReducer((x: number) => x + 1, 0)

  useEffect(() => {
    const update = (): void => force()
    editor.on('transaction', update)
    return () => {
      editor.off('transaction', update)
    }
  }, [editor])

  const btn = (
    label: string,
    onClick: () => void,
    active = false,
    title?: string
  ): React.JSX.Element => (
    <button
      className={active ? `${styles.btn} ${styles.active}` : styles.btn}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title ?? label}
      type="button"
    >
      {label}
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
    const att = await window.api.attachments.pick()
    if (att) {
      chain()
        .insertImageFile({ attachmentId: att.id, filename: att.filename, mime: att.mime })
        .run()
    }
  }

  return (
    <div className={styles.toolbar}>
      {btn('B', () => chain().toggleBold().run(), editor.isActive('bold'), 'Bold')}
      {btn('I', () => chain().toggleItalic().run(), editor.isActive('italic'), 'Italic')}
      {btn('U', () => chain().toggleUnderline().run(), editor.isActive('underline'), 'Underline')}
      {btn('S', () => chain().toggleStrike().run(), editor.isActive('strike'), 'Strikethrough')}
      {btn('<>', () => chain().toggleCode().run(), editor.isActive('code'), 'Inline code')}
      <span className={styles.sep} />
      {HIGHLIGHTS.map((h) => swatch(h.name, h.color))}
      <span className={styles.sep} />
      {btn('H1', () => chain().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
      {btn('H2', () => chain().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('H3', () => chain().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      <span className={styles.sep} />
      {btn('•', () => chain().toggleBulletList().run(), editor.isActive('bulletList'), 'Bullet list')}
      {btn('1.', () => chain().toggleOrderedList().run(), editor.isActive('orderedList'), 'Numbered list')}
      {btn('❝', () => chain().toggleBlockquote().run(), editor.isActive('blockquote'), 'Quote')}
      {btn('{ }', () => chain().toggleCodeBlock().run(), editor.isActive('codeBlock'), 'Code block')}
      {btn('―', () => chain().setHorizontalRule().run(), false, 'Divider')}
      <span className={styles.sep} />
      {btn('$x$', () => chain().insertInlineMath().run(), false, 'Inline equation')}
      {btn('$$', () => chain().insertBlockMath().run(), false, 'Block equation')}
      {btn('📈', () => chain().insertDesmos().run(), false, 'Insert Desmos graph')}
      {btn('🖼', () => void insertImage(), false, 'Insert image / file')}
      {btn('✎', () => chain().insertDrawing().run(), false, 'Insert drawing')}
      {btn('🧮', () => chain().insertCalculator().run(), false, 'Insert calculator')}
      {btn('▦', () => chain().insertDataTable().run(), false, 'Insert table')}
      <span className={styles.sep} />
      {btn('↶', () => chain().undo().run(), false, 'Undo')}
      {btn('↷', () => chain().redo().run(), false, 'Redo')}
    </div>
  )
}
