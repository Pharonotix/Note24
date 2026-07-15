/**
 * The 4 built-in note templates from the roadmap. Fixed, never edited by the user,
 * so — unlike user-saved templates — they're static data here rather than DB rows.
 * Each doc is plain ProseMirror JSON matching the schema in contentExtensions.ts;
 * node types like `blockMath`/`desmos`/`dataTable`/`calculator` fall back to their
 * extension's own attribute defaults when attrs are omitted.
 */

type PmNode = Record<string, unknown>

const heading = (text: string, level = 2): PmNode => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }]
})

const paragraph = (text?: string): PmNode => ({
  type: 'paragraph',
  ...(text ? { content: [{ type: 'text', text }] } : {})
})

const bulletList = (items: string[]): PmNode => ({
  type: 'bulletList',
  content: items.map((text) => ({
    type: 'listItem',
    content: [paragraph(text)]
  }))
})

const orderedList = (items: string[]): PmNode => ({
  type: 'orderedList',
  content: items.map((text) => ({
    type: 'listItem',
    content: [paragraph(text)]
  }))
})

const doc = (content: PmNode[]): string => JSON.stringify({ type: 'doc', content })

export interface BuiltinTemplate {
  id: string
  name: string
  description: string
  content: string
}

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    id: 'problem-set',
    name: 'Problem Set',
    description: 'Question, equation, graph, solution, answer.',
    content: doc([
      heading('Question'),
      paragraph(),
      heading('Equation'),
      { type: 'blockMath' },
      heading('Graph'),
      { type: 'desmos' },
      heading('Solution'),
      paragraph(),
      heading('Answer'),
      paragraph()
    ])
  },
  {
    id: 'lab-report',
    name: 'Lab Report',
    description: 'Objective, procedure, data, calculations, conclusion.',
    content: doc([
      heading('Objective'),
      paragraph(),
      heading('Procedure'),
      orderedList(['']),
      heading('Data'),
      { type: 'dataTable' },
      heading('Calculations'),
      { type: 'calculator' },
      heading('Conclusion'),
      paragraph()
    ])
  },
  {
    id: 'research-notes',
    name: 'Research Notes',
    description: 'Summary, sources, questions, insights.',
    content: doc([
      heading('Summary'),
      paragraph(),
      heading('Sources'),
      bulletList(['']),
      heading('Questions'),
      bulletList(['']),
      heading('Insights'),
      paragraph()
    ])
  },
  {
    id: 'lecture-notes',
    name: 'Lecture Notes',
    description: 'Topics, examples, formulas, practice problems.',
    content: doc([
      heading('Topics'),
      bulletList(['']),
      heading('Examples'),
      paragraph(),
      heading('Formulas'),
      { type: 'blockMath' },
      heading('Practice Problems'),
      orderedList([''])
    ])
  }
]
