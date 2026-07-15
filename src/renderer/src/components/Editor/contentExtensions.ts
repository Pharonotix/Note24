import type { AnyExtension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import { InlineMath } from './extensions/InlineMath'
import { BlockMath } from './extensions/BlockMath'
import { DesmosNode } from './extensions/DesmosNode'
import { WikiLink } from './extensions/WikiLink'
import { ImageFile } from './extensions/ImageFile'
import { DrawingNode } from './extensions/DrawingNode'
import { CalculatorNode } from './extensions/CalculatorNode'
import { DataTableNode } from './extensions/DataTableNode'

/**
 * The block/mark extensions every note body needs, shared by the live editor
 * (`Editor.tsx`, which adds its own `Placeholder`) and the read-only print/export
 * renderer (`PrintLayer.tsx`) — kept in one place so exported PDFs never drift
 * from what a note actually looks like on screen.
 */
export function contentExtensions(): AnyExtension[] {
  return [
    StarterKit,
    Highlight.configure({ multicolor: true }),
    InlineMath,
    BlockMath,
    DesmosNode,
    WikiLink,
    ImageFile,
    DrawingNode,
    CalculatorNode,
    DataTableNode
  ]
}
