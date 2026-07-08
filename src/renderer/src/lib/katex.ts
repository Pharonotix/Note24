import katex from 'katex'

/** Renders LaTeX to an HTML string. Never throws: KaTeX renders errors inline. */
export function renderLatex(
  latex: string,
  displayMode: boolean
): { html: string; error: string | null } {
  try {
    const html = katex.renderToString(latex || '', {
      displayMode,
      throwOnError: false,
      errorColor: '#d98a8a',
      output: 'htmlAndMathml'
    })
    return { html, error: null }
  } catch (e) {
    return { html: '', error: e instanceof Error ? e.message : 'Invalid LaTeX' }
  }
}
